/**
 * ReDoS 対策パターンバリデーター（B氏追加）
 *
 * ユーザー定義正規表現のバリデーション:
 * 1. 構文チェック
 * 2. 文字数上限: 200文字
 * 3. 禁止パターン: ネストした量指定子
 * 4. 実行時タイムアウト: 100ms
 */

const MAX_PATTERN_LENGTH = 200;

// ネストした量指定子パターン (ReDoS vulnerability)
const DANGEROUS_PATTERNS = [
  /(\+|\*|\{)\s*(\+|\*|\{)/,  // Nested quantifiers
  /\(\?[^)]*\)\s*(\+|\*|\{)/,  // Quantifier after non-capturing group with quantifier inside
];

export interface PatternValidationResult {
  valid: boolean;
  error?: string;
}

export function validatePattern(pattern: string): PatternValidationResult {
  // Length check
  if (pattern.length > MAX_PATTERN_LENGTH) {
    return { valid: false, error: `パターンは${MAX_PATTERN_LENGTH}文字以内です` };
  }

  // Syntax check
  try {
    new RegExp(pattern);
  } catch {
    return { valid: false, error: '正規表現の構文が無効です' };
  }

  // Dangerous pattern check
  for (const dangerous of DANGEROUS_PATTERNS) {
    if (dangerous.test(pattern)) {
      return { valid: false, error: 'セキュリティ上の理由で使用できないパターンです' };
    }
  }

  // Timeout test with sample input
  try {
    const regex = new RegExp(pattern);
    const testInput = 'a'.repeat(100);
    const start = Date.now();
    regex.test(testInput);
    if (Date.now() - start > 100) {
      return { valid: false, error: 'パターンの実行に時間がかかりすぎます' };
    }
  } catch {
    return { valid: false, error: 'パターンの実行中にエラーが発生しました' };
  }

  return { valid: true };
}
