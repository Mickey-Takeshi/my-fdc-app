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
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
    );
  });

  it('通常の文字はそのまま返す', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });

  it('アンパサンドをエスケープする', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('シングルクォートをエスケープする', () => {
    expect(escapeHtml("it's")).toBe('it&#x27;s');
  });
});

describe('sanitizeFilename', () => {
  it('パストラバーサル文字を除去する', () => {
    expect(sanitizeFilename('../../../etc/passwd')).toBe('etcpasswd');
  });

  it('Windows禁止文字を除去する', () => {
    expect(sanitizeFilename('file<>:"|?*.txt')).toBe('file.txt');
  });

  it('スラッシュとバックスラッシュを除去する', () => {
    expect(sanitizeFilename('path/to\\file.txt')).toBe('pathtofile.txt');
  });

  it('前後の空白を除去する', () => {
    expect(sanitizeFilename('  file.txt  ')).toBe('file.txt');
  });
});

describe('sanitizeRedirectUrl', () => {
  const allowedHosts = ['example.com', 'app.example.com'];

  it('相対パスを許可する', () => {
    expect(sanitizeRedirectUrl('/dashboard', allowedHosts)).toBe('/dashboard');
    expect(sanitizeRedirectUrl('/login?next=/home', allowedHosts)).toBe('/login?next=/home');
  });

  it('許可されたホストのURLを許可する', () => {
    expect(sanitizeRedirectUrl('https://example.com/page', allowedHosts)).toBe(
      'https://example.com/page'
    );
  });

  it('許可されていないホストを拒否する', () => {
    expect(sanitizeRedirectUrl('https://evil.com/phishing', allowedHosts)).toBeNull();
  });

  it('プロトコル相対URLを拒否する', () => {
    expect(sanitizeRedirectUrl('//evil.com/phishing', allowedHosts)).toBeNull();
  });

  it('無効なURLをnullで返す', () => {
    expect(sanitizeRedirectUrl('not a url', [])).toBeNull();
  });
});

describe('sanitizeUserInput', () => {
  it('制御文字を除去する', () => {
    expect(sanitizeUserInput('hello\x00world')).toBe('helloworld');
    expect(sanitizeUserInput('test\x1Fvalue')).toBe('testvalue');
  });

  it('長さを制限する', () => {
    const longString = 'a'.repeat(2000);
    expect(sanitizeUserInput(longString, 100).length).toBe(100);
  });

  it('前後の空白を除去する', () => {
    expect(sanitizeUserInput('  hello  ')).toBe('hello');
  });

  it('改行とタブは許可する', () => {
    expect(sanitizeUserInput('hello\nworld\ttab')).toBe('hello\nworld\ttab');
  });

  it('デフォルトで1000文字に制限する', () => {
    const longString = 'a'.repeat(2000);
    expect(sanitizeUserInput(longString).length).toBe(1000);
  });
});

describe('isValidEmail', () => {
  it('有効なメールアドレスを検証する', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co.jp')).toBe(true);
    expect(isValidEmail('user+tag@example.org')).toBe(true);
  });

  it('無効なメールアドレスを拒否する', () => {
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('test@')).toBe(false);
    expect(isValidEmail('test@.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('長すぎるメールアドレスを拒否する', () => {
    const longEmail = 'a'.repeat(250) + '@example.com';
    expect(isValidEmail(longEmail)).toBe(false);
  });
});

describe('isValidUuid', () => {
  it('有効なUUIDを検証する', () => {
    expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isValidUuid('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
    expect(isValidUuid('00000000-0000-0000-0000-000000000000')).toBe(true);
  });

  it('無効なUUIDを拒否する', () => {
    expect(isValidUuid('not-a-uuid')).toBe(false);
    expect(isValidUuid('550e8400-e29b-41d4-a716')).toBe(false);
    expect(isValidUuid('550e8400e29b41d4a716446655440000')).toBe(false);
    expect(isValidUuid('')).toBe(false);
    expect(isValidUuid('550e8400-e29b-41d4-a716-44665544000g')).toBe(false);
  });
});
