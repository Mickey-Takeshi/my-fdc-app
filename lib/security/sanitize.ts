/**
 * lib/security/sanitize.ts
 *
 * Phase 20: 入力サニタイズユーティリティ
 */

/**
 * HTML 特殊文字をエスケープ
 * XSS 対策の基本
 */
export function escapeHtml(str: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return str.replace(/[&<>"'/]/g, (char) => htmlEscapes[char]);
}

/**
 * SQL インジェクション対策用の文字列サニタイズ
 * ※ Supabase のパラメータ化クエリを使用する場合は不要
 * 　 念のための追加防御層として使用
 */
export function sanitizeSqlInput(str: string): string {
  // シングルクォートをエスケープ
  return str.replace(/'/g, "''");
}

/**
 * ファイル名のサニタイズ
 * パストラバーサル攻撃対策
 */
export function sanitizeFilename(filename: string): string {
  // 危険な文字を除去
  return filename
    .replace(/\.\./g, '') // ディレクトリトラバーサル
    .replace(/[/\\]/g, '') // パス区切り文字
    .replace(/[<>:"|?*]/g, '') // Windows で使えない文字
    .trim();
}

/**
 * URL のサニタイズ
 * オープンリダイレクト攻撃対策
 */
export function sanitizeRedirectUrl(url: string, allowedHosts: string[]): string | null {
  try {
    const parsed = new URL(url, 'https://example.com');

    // 相対パスの場合はそのまま許可
    if (url.startsWith('/') && !url.startsWith('//')) {
      return url;
    }

    // 許可されたホストかチェック
    if (allowedHosts.includes(parsed.hostname)) {
      return url;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * ユーザー入力の一般的なサニタイズ
 * - 前後の空白を除去
 * - 制御文字を除去
 * - 長さを制限
 */
export function sanitizeUserInput(
  input: string,
  maxLength: number = 1000
): string {
  return input
    // 制御文字を除去（改行とタブは許可）
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // 前後の空白を除去
    .trim()
    // 長さを制限
    .slice(0, maxLength);
}

/**
 * メールアドレスのバリデーション
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * UUID のバリデーション
 */
export function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
