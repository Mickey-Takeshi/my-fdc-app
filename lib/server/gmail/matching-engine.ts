import { createAdminClient } from '@/lib/supabase/admin';
import { calculateNameSimilarity } from './name-normalizer';
import type { MatchConfidence, ParsedPaymentInfo } from '@/lib/types/gmail-billing';
import { apiLogger } from '../logger';

const log = apiLogger({ service: 'gmail-matching' });

interface PendingPayment {
  id: string;
  amount: number;
  expected_payer_name: string | null;
  invoice_number: string | null;
  bank_transfer_ref: string | null;
}

export async function matchPayment(
  workspaceId: string,
  messageId: number,
  parsed: ParsedPaymentInfo
): Promise<{ matchId: string; confidence: MatchConfidence; score: number } | null> {
  const admin = createAdminClient();

  const { data: pendingPayments } = await admin
    .from('payments')
    .select('id, amount, expected_payer_name, invoice_number, bank_transfer_ref')
    .eq('workspace_id', workspaceId)
    .eq('status', 'pending')
    .is('deleted_at', null);

  if (!pendingPayments || pendingPayments.length === 0) return null;

  let bestMatch: { payment: PendingPayment; confidence: MatchConfidence; score: number; reasons: string[] } | null = null;

  for (const payment of pendingPayments) {
    const reasons: string[] = [];
    let score = 0;

    // 金額マッチング
    if (parsed.amount !== null) {
      const diff = Math.abs(Number(payment.amount) - parsed.amount);
      if (diff === 0) { score += 0.5; reasons.push('amount_exact'); }
      else if (diff <= 100) { score += 0.3; reasons.push('amount_approx'); }
    }

    // 名義マッチング
    if (parsed.payerName && payment.expected_payer_name) {
      const similarity = calculateNameSimilarity(parsed.payerName, payment.expected_payer_name);
      if (similarity >= 0.95) { score += 0.4; reasons.push('name_exact'); }
      else if (similarity >= 0.8) { score += 0.2; reasons.push('name_partial'); }
    }

    // 参照番号マッチング
    if (parsed.rawSubject && payment.invoice_number) {
      if (parsed.rawSubject.includes(payment.invoice_number)) {
        score += 0.3;
        reasons.push('invoice_ref');
      }
    }

    const confidence = getConfidence(score);

    if (confidence !== 'none' && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { payment, confidence, score, reasons };
    }
  }

  if (!bestMatch) return null;

  const { data: match, error } = await admin
    .from('payment_matches')
    .insert({
      workspace_id: workspaceId,
      message_id: messageId,
      payment_id: bestMatch.payment.id,
      confidence: bestMatch.confidence,
      confidence_score: bestMatch.score,
      match_reasons: bestMatch.reasons,
      parsed_amount: parsed.amount,
      parsed_payer_name: parsed.payerName,
      parsed_transfer_date: parsed.transferDate,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    log.error({ error }, 'Failed to create payment match');
    return null;
  }

  return { matchId: match.id, confidence: bestMatch.confidence, score: bestMatch.score };
}

function getConfidence(score: number): MatchConfidence {
  if (score >= 0.9) return 'high';
  if (score >= 0.6) return 'medium';
  if (score >= 0.3) return 'low';
  return 'none';
}
