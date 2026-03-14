/**
 * カタカナ名義正規化
 * - 全角 -> 半角カタカナ変換
 * - スペース正規化
 * - 法人格略称展開
 * - Levenshtein距離ベースの類似度計算
 */

const COMPANY_ABBREVS: [string, string][] = [
  ['カ)', '株式会社'],
  ['カ）', '株式会社'],
  ['ユ)', '有限会社'],
  ['ユ）', '有限会社'],
  ['ド)', '同'],
  ['ド）', '同'],
];

export function normalizePayerName(name: string): string {
  let normalized = name
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

  for (const [abbrev, full] of COMPANY_ABBREVS) {
    normalized = normalized.replace(abbrev, full);
  }

  return normalized;
}

export function calculateNameSimilarity(a: string, b: string): number {
  const na = normalizePayerName(a);
  const nb = normalizePayerName(b);

  if (na === nb) return 1.0;
  if (na.includes(nb) || nb.includes(na)) return 0.85;

  const distance = levenshteinDistance(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return 1.0;

  return Math.max(0, 1 - distance / maxLen);
}

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0) as number[]);

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}
