/**
 * 入金マッチングエンジン
 *
 * マッチングアルゴリズム:
 * Step 1: 金額マッチング（完全一致 or ±100円）
 * Step 2: 名義マッチング（正規化後の類似度）
 * Step 3: Confidence判定
 */

import { calculateNameSimilarity } from './name-normalizer';
import type { ParsedPaymentInfo, MatchConfidence } from '@/lib/types/gmail-billing';
import { getAdminClient } from '@/lib/supabase/admin';

interface MatchCandidate {
  paymentId: string;
  confidence: MatchConfidence;
  confidenceScore: number;
  matchReasons: string[];
  parsedAmount: number | null;
  parsedPayerName: string | null;
  parsedTransferDate: string | null;
}

export async function findMatches(
  workspaceId: string,
  parsed: ParsedPaymentInfo
): Promise<MatchCandidate[]> {
  const supabase = getAdminClient();

  // Get pending payments for this workspace
  const { data: payments } = await supabase
    .from('payments')
    .select('id, amount, expected_payer_name, bank_transfer_ref, invoice_number')
    .eq('workspace_id', workspaceId)
    .eq('status', 'pending')
    .eq('payment_method', 'bank_transfer')
    .is('deleted_at', null);

  if (!payments?.length || !parsed.amount) return [];

  const candidates: MatchCandidate[] = [];

  for (const payment of payments) {
    const reasons: string[] = [];
    let score = 0;

    // Amount matching
    const diff = Math.abs(Number(payment.amount) - parsed.amount);
    const amountExact = diff === 0;
    const amountApprox = diff <= 100;

    if (amountExact) {
      score += 0.5;
      reasons.push('金額完全一致');
    } else if (amountApprox) {
      score += 0.3;
      reasons.push(`金額近似一致（差額: ${diff}円）`);
    }

    // Name matching
    if (parsed.payerName && payment.expected_payer_name) {
      const similarity = calculateNameSimilarity(
        parsed.payerName,
        payment.expected_payer_name
      );
      if (similarity >= 0.95) {
        score += 0.4;
        reasons.push('名義完全一致');
      } else if (similarity >= 0.8) {
        score += 0.2;
        reasons.push(`名義部分一致（${Math.round(similarity * 100)}%）`);
      }
    }

    // Reference number matching
    if (
      payment.bank_transfer_ref &&
      parsed.rawSnippet.includes(payment.bank_transfer_ref)
    ) {
      score += 0.3;
      reasons.push('振込参照番号一致');
    }

    if (score === 0) continue;

    // Determine confidence
    let confidence: MatchConfidence;
    if (score >= 0.9) confidence = 'high';
    else if (score >= 0.6) confidence = 'medium';
    else if (score >= 0.3) confidence = 'low';
    else confidence = 'none';

    candidates.push({
      paymentId: payment.id,
      confidence,
      confidenceScore: Math.min(score, 1),
      matchReasons: reasons,
      parsedAmount: parsed.amount,
      parsedPayerName: parsed.payerName,
      parsedTransferDate: parsed.transferDate,
    });
  }

  // Sort by confidence score descending
  candidates.sort((a, b) => b.confidenceScore - a.confidenceScore);

  return candidates;
}
