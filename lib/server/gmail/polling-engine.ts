import { createAdminClient } from '@/lib/supabase/admin';
import { decryptToken } from './token-encryption';
import { canExecute, recordSuccess, recordFailure } from './circuit-breaker';
import { matchPayment } from './matching-engine';
import { apiLogger } from '../logger';
import type { ParsedPaymentInfo } from '@/lib/types/gmail-billing';

const log = apiLogger({ service: 'gmail-polling' });

const MAX_CONFIGS_PER_RUN = 10;

export async function runPollingCycle(): Promise<{ processed: number; errors: number }> {
  const admin = createAdminClient();
  let processed = 0;
  let errors = 0;

  const { data: configs } = await admin
    .from('gmail_watch_configs')
    .select('*')
    .eq('is_active', true)
    .order('last_poll_at', { ascending: true, nullsFirst: true })
    .limit(MAX_CONFIGS_PER_RUN);

  if (!configs || configs.length === 0) {
    log.info('No active Gmail configs to poll');
    return { processed: 0, errors: 0 };
  }

  for (const config of configs) {
    try {
      if (!await canExecute(config.id)) {
        log.info({ configId: config.id }, 'Circuit breaker OPEN, skipping');
        continue;
      }

      const refreshToken = decryptToken(
        config.encrypted_refresh_token,
        config.token_iv,
        config.token_auth_tag,
        config.token_version
      );

      const messages = await fetchNewMessages(refreshToken, config.last_history_id);

      for (const msg of messages) {
        const parsed = parsePaymentInfo(msg, config.bank_patterns);
        if (!parsed) continue;

        const { data: savedMsg } = await admin
          .from('gmail_processed_messages')
          .insert({
            config_id: config.id,
            gmail_message_id: msg.id,
            gmail_thread_id: msg.threadId,
            from_address: msg.from,
            subject: msg.subject,
            snippet: msg.snippet,
            received_at: msg.receivedAt,
            parse_result: parsed,
            match_status: 'pending',
          })
          .select('id')
          .single();

        if (savedMsg) {
          await matchPayment(config.workspace_id, savedMsg.id, parsed);
        }
        processed++;
      }

      await admin.from('gmail_watch_configs').update({
        last_poll_at: new Date().toISOString(),
        last_success_at: new Date().toISOString(),
        last_history_id: messages.length > 0 ? messages[messages.length - 1].historyId : config.last_history_id,
        poll_error_count: 0,
        last_error: null,
      }).eq('id', config.id);

      await recordSuccess(config.id);

    } catch (err) {
      errors++;
      log.error({ err, configId: config.id }, 'Polling failed');
      await recordFailure(config.id);

      const newErrorCount = (config.poll_error_count ?? 0) + 1;
      const updates: Record<string, unknown> = {
        poll_error_count: newErrorCount,
        last_error: err instanceof Error ? err.message : 'Unknown error',
        last_poll_at: new Date().toISOString(),
      };

      if (newErrorCount >= 5) {
        updates.is_active = false;
        log.warn({ configId: config.id }, 'Auto-deactivated after 5 consecutive errors');
      }

      await admin.from('gmail_watch_configs').update(updates).eq('id', config.id);
    }
  }

  return { processed, errors };
}

interface GmailMessage {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  snippet: string;
  receivedAt: string;
  historyId: string;
}

async function fetchNewMessages(_refreshToken: string, _lastHistoryId: string | null): Promise<GmailMessage[]> {
  // TODO: Implement Gmail API call
  // 1. Exchange refresh token for access token
  // 2. Call users.messages.list with historyId or query
  // 3. For each message, call users.messages.get
  // 4. Extract headers (From, Subject, Date)
  log.debug('fetchNewMessages: Gmail API integration pending');
  return [];
}

function parsePaymentInfo(
  msg: GmailMessage,
  bankPatterns: Array<{ from_pattern?: string; subject_pattern?: string; amount_regex?: string; payer_regex?: string; bank_name?: string }>
): ParsedPaymentInfo | null {
  for (const pattern of bankPatterns) {
    const fromMatch = pattern.from_pattern ? new RegExp(pattern.from_pattern, 'i').test(msg.from) : true;
    const subjectMatch = pattern.subject_pattern ? new RegExp(pattern.subject_pattern, 'i').test(msg.subject) : true;

    if (!fromMatch || !subjectMatch) continue;

    let amount: number | null = null;
    let payerName: string | null = null;

    if (pattern.amount_regex) {
      const amountMatch = new RegExp(pattern.amount_regex).exec(msg.snippet);
      if (amountMatch?.groups?.['amount']) {
        amount = Number(amountMatch.groups['amount'].replace(/,/g, ''));
      }
    }

    if (pattern.payer_regex) {
      const payerMatch = new RegExp(pattern.payer_regex).exec(msg.snippet);
      if (payerMatch?.[1]) {
        payerName = payerMatch[1];
      }
    }

    return {
      amount,
      payerName,
      transferDate: null,
      bankName: pattern.bank_name ?? null,
      rawSubject: msg.subject,
    };
  }

  return null;
}
