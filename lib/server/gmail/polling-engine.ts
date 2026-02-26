/**
 * Gmail Polling エンジン
 *
 * Vercel Cron（5分間隔）から呼び出される。
 * 1. active な gmail_watch_configs を最大10件取得
 * 2. 各設定について新着メールを取得・パース・マッチング
 * 3. エラー時は poll_error_count をインクリメント
 */

import { getAdminClient } from '@/lib/supabase/admin';
import { decryptToken } from './token-encryption';
import { canExecute, recordSuccess, recordFailure } from './circuit-breaker';
import { findMatches } from './matching-engine';
import { logger } from '../logger';
import type { BankPattern, ParsedPaymentInfo } from '@/lib/types/gmail-billing';

const MAX_CONFIGS_PER_RUN = 10;

export async function runPolling(): Promise<{
  processed: number;
  errors: number;
}> {
  const supabase = getAdminClient();
  const log = logger.child({ service: 'gmail-polling', correlationId: crypto.randomUUID() });

  // Get active configs
  const { data: configs } = await supabase
    .from('gmail_watch_configs')
    .select('*')
    .eq('is_active', true)
    .order('last_poll_at', { ascending: true, nullsFirst: true })
    .limit(MAX_CONFIGS_PER_RUN);

  if (!configs?.length) {
    log.info('No active Gmail configs to poll');
    return { processed: 0, errors: 0 };
  }

  let processed = 0;
  let errors = 0;

  for (const config of configs) {
    try {
      // Circuit breaker check
      if (!canExecute(config.id)) {
        log.warn({ configId: config.id }, 'Circuit breaker OPEN, skipping');
        continue;
      }

      // Decrypt refresh token
      const refreshToken = decryptToken(
        config.encrypted_refresh_token,
        config.token_iv,
        config.token_auth_tag,
        config.token_version
      );

      // Get access token from refresh token
      const accessToken = await exchangeRefreshToken(refreshToken);

      // Fetch messages
      const messages = await fetchGmailMessages(
        accessToken,
        config.last_history_id,
        config.label_filter
      );

      // Parse each message with bank patterns
      const patterns = config.bank_patterns as BankPattern[];
      for (const msg of messages) {
        const parsed = parseMessage(msg, patterns);
        if (!parsed) continue;

        // Save processed message
        const { data: savedMsg } = await supabase
          .from('gmail_processed_messages')
          .upsert(
            {
              config_id: config.id,
              gmail_message_id: msg.id,
              gmail_thread_id: msg.threadId,
              from_address: msg.from,
              subject: msg.subject,
              snippet: msg.snippet,
              received_at: msg.date,
              parse_result: parsed,
              match_status: 'pending',
            },
            { onConflict: 'config_id,gmail_message_id' }
          )
          .select('id')
          .single();

        if (!savedMsg) continue;

        // Find matches
        const matches = await findMatches(config.workspace_id, parsed);
        for (const match of matches) {
          await supabase.from('payment_matches').upsert(
            {
              workspace_id: config.workspace_id,
              message_id: savedMsg.id,
              payment_id: match.paymentId,
              confidence: match.confidence,
              confidence_score: match.confidenceScore,
              match_reasons: match.matchReasons,
              parsed_amount: match.parsedAmount,
              parsed_payer_name: match.parsedPayerName,
              parsed_transfer_date: match.parsedTransferDate,
              status: 'pending', // D氏方針: 全て管理者確認必須
            },
            { onConflict: 'message_id,payment_id' }
          );
        }

        // Update message status
        await supabase
          .from('gmail_processed_messages')
          .update({
            match_status: matches.length > 0 ? 'matched' : 'no_match',
          })
          .eq('id', savedMsg.id);
      }

      // Update config
      await supabase
        .from('gmail_watch_configs')
        .update({
          last_poll_at: new Date().toISOString(),
          last_success_at: new Date().toISOString(),
          poll_error_count: 0,
          last_error: null,
          ...(messages.length > 0 && messages[0].historyId
            ? { last_history_id: messages[0].historyId }
            : {}),
        })
        .eq('id', config.id);

      recordSuccess(config.id);
      processed++;
      log.info({ configId: config.id, messageCount: messages.length }, 'Polling complete');
    } catch (err) {
      errors++;
      recordFailure(config.id);
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      log.error({ configId: config.id, err: errorMsg }, 'Polling failed');

      // Update error state
      const newErrorCount = (config.poll_error_count || 0) + 1;
      const shouldDeactivate =
        newErrorCount >= 5 || errorMsg.includes('401') || errorMsg.includes('403');

      await supabase
        .from('gmail_watch_configs')
        .update({
          last_poll_at: new Date().toISOString(),
          poll_error_count: newErrorCount,
          last_error: errorMsg,
          ...(shouldDeactivate ? { is_active: false } : {}),
        })
        .eq('id', config.id);

      if (shouldDeactivate) {
        log.error({ configId: config.id }, 'Config deactivated due to repeated failures');
      }
    }
  }

  return { processed, errors };
}

async function exchangeRefreshToken(refreshToken: string): Promise<string> {
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!resp.ok) {
    throw new Error(`Token exchange failed: ${resp.status}`);
  }

  const data = await resp.json();
  return data.access_token;
}

interface GmailMessage {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  historyId?: string;
}

async function fetchGmailMessages(
  accessToken: string,
  afterHistoryId: string | null,
  labelFilter: string
): Promise<GmailMessage[]> {
  const params = new URLSearchParams({
    labelIds: labelFilter || 'INBOX',
    maxResults: '50',
  });

  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!resp.ok) {
    throw new Error(`Gmail API failed: ${resp.status}`);
  }

  const data = await resp.json();
  const messages: GmailMessage[] = [];

  for (const msg of data.messages || []) {
    const detail = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!detail.ok) continue;

    const msgData = await detail.json();
    const headers = msgData.payload?.headers || [];

    const getHeader = (name: string) =>
      headers.find((h: { name: string; value: string }) =>
        h.name.toLowerCase() === name.toLowerCase()
      )?.value ?? '';

    messages.push({
      id: msgData.id,
      threadId: msgData.threadId,
      from: getHeader('From'),
      subject: getHeader('Subject'),
      snippet: msgData.snippet || '',
      date: getHeader('Date'),
      historyId: msgData.historyId,
    });
  }

  return messages;
}

function parseMessage(
  msg: GmailMessage,
  patterns: BankPattern[]
): ParsedPaymentInfo | null {
  for (const pattern of patterns) {
    if (!pattern.isActive) continue;

    try {
      const fromMatch = new RegExp(pattern.fromPattern, 'i').test(msg.from);
      const subjectMatch = new RegExp(pattern.subjectPattern, 'i').test(msg.subject);

      if (!fromMatch || !subjectMatch) continue;

      const amountRegex = new RegExp(pattern.amountPattern);
      const amountMatch = amountRegex.exec(msg.snippet);
      const amount = amountMatch?.groups?.amount
        ? parseInt(amountMatch.groups.amount.replace(/,/g, ''), 10)
        : null;

      let payerName: string | null = null;
      if (pattern.payerNamePattern) {
        const nameMatch = new RegExp(pattern.payerNamePattern).exec(msg.snippet);
        payerName = nameMatch?.[1] ?? null;
      }

      return {
        amount,
        payerName,
        transferDate: msg.date,
        bankName: pattern.bankName,
        rawSnippet: msg.snippet,
        parseConfidence: amount ? 0.8 : 0.3,
      };
    } catch {
      // Invalid pattern, skip
      continue;
    }
  }

  return null;
}
