const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '/': '&#x2F;',
};

export function escapeHtml(str: string): string {
  return str.replace(/[&<>"'/]/g, (char) => HTML_ESCAPES[char]);
}

export function sanitizeSqlInput(str: string): string {
  return str.replace(/'/g, "''");
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/\.\./g, '').replace(/[/\\]/g, '').replace(/[<>:"|?*]/g, '').trim();
}

export function sanitizeRedirectUrl(url: string, allowedHosts: string[]): string | null {
  try {
    if (url.startsWith('/') && !url.startsWith('//')) return url;
    const parsed = new URL(url, 'https://example.com');
    return allowedHosts.includes(parsed.hostname) ? url : null;
  } catch {
    return null;
  }
}

export function sanitizeUserInput(input: string, maxLength = 1000): string {
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim().slice(0, maxLength);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export function isValidUuid(uuid: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}
