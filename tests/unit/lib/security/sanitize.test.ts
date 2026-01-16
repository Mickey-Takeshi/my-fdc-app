import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  sanitizeFilename,
  sanitizeUserInput,
  sanitizeRedirectUrl,
  isValidEmail,
  isValidUuid,
} from '@/lib/security/sanitize';

describe('escapeHtml', () => {
  it('HTML特殊文字をエスケープする', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    expect(escapeHtml('Hello World')).toBe('Hello World');
    expect(escapeHtml('a & b')).toBe('a &amp; b');
    expect(escapeHtml("it's")).toBe('it&#x27;s');
  });
});

describe('sanitizeFilename', () => {
  it('危険な文字を除去する', () => {
    expect(sanitizeFilename('../../../etc/passwd')).toBe('etcpasswd');
    expect(sanitizeFilename('file<>:"|?*.txt')).toBe('file.txt');
    expect(sanitizeFilename('path/to\\file.txt')).toBe('pathtofile.txt');
    expect(sanitizeFilename('  file.txt  ')).toBe('file.txt');
  });
});

describe('sanitizeRedirectUrl', () => {
  const allowedHosts = ['example.com', 'app.example.com'];

  it('相対パスと許可されたホストを許可する', () => {
    expect(sanitizeRedirectUrl('/dashboard', allowedHosts)).toBe('/dashboard');
    expect(sanitizeRedirectUrl('/login?next=/home', allowedHosts)).toBe('/login?next=/home');
    expect(sanitizeRedirectUrl('https://example.com/page', allowedHosts)).toBe('https://example.com/page');
  });

  it('危険なURLを拒否する', () => {
    expect(sanitizeRedirectUrl('https://evil.com/phishing', allowedHosts)).toBeNull();
    expect(sanitizeRedirectUrl('//evil.com/phishing', allowedHosts)).toBeNull();
    expect(sanitizeRedirectUrl('not a url', [])).toBeNull();
  });
});

describe('sanitizeUserInput', () => {
  it('制御文字除去・長さ制限・空白除去を行う', () => {
    expect(sanitizeUserInput('hello\x00world')).toBe('helloworld');
    expect(sanitizeUserInput('test\x1Fvalue')).toBe('testvalue');
    expect(sanitizeUserInput('a'.repeat(2000), 100).length).toBe(100);
    expect(sanitizeUserInput('  hello  ')).toBe('hello');
    expect(sanitizeUserInput('hello\nworld\ttab')).toBe('hello\nworld\ttab');
    expect(sanitizeUserInput('a'.repeat(2000)).length).toBe(1000);
  });
});

describe('isValidEmail', () => {
  it('メールアドレスを検証する', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co.jp')).toBe(true);
    expect(isValidEmail('user+tag@example.org')).toBe(true);
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('test@')).toBe(false);
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('a'.repeat(250) + '@example.com')).toBe(false);
  });
});

describe('isValidUuid', () => {
  it('UUIDを検証する', () => {
    expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isValidUuid('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
    expect(isValidUuid('00000000-0000-0000-0000-000000000000')).toBe(true);
    expect(isValidUuid('not-a-uuid')).toBe(false);
    expect(isValidUuid('550e8400-e29b-41d4-a716')).toBe(false);
    expect(isValidUuid('')).toBe(false);
  });
});
