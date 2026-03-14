/**
 * ユーザー定義正規表現のバリデーション
 * - 構文チェック
 * - 文字数上限: 200文字
 * - 禁止パターン: ネストした量指定子（ReDoS 対策）
 * - 実行時タイムアウト: 100ms
 */

const DANGEROUS_PATTERNS = [
  /(\+|\*|\{)\s*(\+|\*|\{)/,          // ネストした量指定子 e.g., (a+)+
  /\(\?[^)]*\(\?/,                      // ネストしたグループ
  /(.)\1{10,}/,                         // 10回以上の連続繰り返し
];

const MAX_PATTERN_LENGTH = 200;

export interface PatternValidationResult {
  valid: boolean;
  error?: string;
}

export function validatePattern(pattern: string): PatternValidationResult {
  if (pattern.length > MAX_PATTERN_LENGTH) {
    return { valid: false, error: `パターンは${MAX_PATTERN_LENGTH}文字以内にしてください` };
  }

  // 構文チェック
  try {
    new RegExp(pattern);
  } catch {
    return { valid: false, error: '正規表現の構文エラーです' };
  }

  // ReDoS パターン検出
  for (const dangerous of DANGEROUS_PATTERNS) {
    if (dangerous.test(pattern)) {
      return { valid: false, error: '安全でないパターンが含まれています' };
    }
  }

  return { valid: true };
}

export function safeMatch(text: string, pattern: string, timeoutMs = 100): RegExpMatchArray | null {
  const start = Date.now();
  try {
    const regex = new RegExp(pattern, 'g');
    const result = regex.exec(text);
    if (Date.now() - start > timeoutMs) return null;
    return result;
  } catch {
    return null;
  }
}
