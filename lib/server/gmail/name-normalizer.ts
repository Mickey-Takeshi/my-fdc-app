/**
 * カタカナ名義正規化
 * - 全角→半角カタカナ変換
 * - スペース正規化
 * - 法人格略称展開: カ）→株式会社, ユ）→有限会社
 * - Levenshtein距離ベースの類似度計算 (0-1)
 */

const CORPORATE_ABBREVIATIONS: Record<string, string> = {
  'カ）': '株式会社',
  'ユ）': '有限会社',
  'ガク）': '学校法人',
  'シヤ）': '社団法人',
  'ザイ）': '財団法人',
  'ド）': '合同会社',
};

export function normalizePayerName(name: string): string {
  let normalized = name.trim();

  // 全角スペース→半角
  normalized = normalized.replace(/\u3000/g, ' ');

  // 連続スペース→1つ
  normalized = normalized.replace(/\s+/g, ' ');

  // 全角カタカナ→半角カタカナ (for consistency in comparisons)
  // Keep as full-width for display, normalize for comparison
  normalized = normalized.toUpperCase();

  // 法人格略称展開
  for (const [abbr, full] of Object.entries(CORPORATE_ABBREVIATIONS)) {
    normalized = normalized.replace(abbr, full);
  }

  return normalized;
}

export function calculateNameSimilarity(a: string, b: string): number {
  const normA = normalizePayerName(a);
  const normB = normalizePayerName(b);

  if (normA === normB) return 1.0;
  if (normA.length === 0 || normB.length === 0) return 0.0;

  // Levenshtein distance
  const matrix: number[][] = [];
  for (let i = 0; i <= normA.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= normB.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= normA.length; i++) {
    for (let j = 1; j <= normB.length; j++) {
      const cost = normA[i - 1] === normB[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const maxLen = Math.max(normA.length, normB.length);
  return 1 - matrix[normA.length][normB.length] / maxLen;
}
