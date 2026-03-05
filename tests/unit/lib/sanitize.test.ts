import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  sanitizeObject,
  checkRateLimit,
} from '@/lib/server/sanitize';

describe('sanitizeString', () => {
  it('escapes HTML tags', () => {
    expect(sanitizeString('<script>alert("xss")</script>')).not.toContain(
      '<script>'
    );
  });

  it('escapes quotes', () => {
    const result = sanitizeString('"hello"');
    expect(result).not.toContain('"hello"');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeString('')).toBe('');
  });
});

describe('sanitizeObject', () => {
  it('sanitizes all string values', () => {
    const result = sanitizeObject({ name: '<b>test</b>', age: 25 });
    expect(result.name).not.toContain('<b>');
    expect(result.age).toBe(25);
  });

  it('sanitizes nested arrays of strings', () => {
    const result = sanitizeObject({
      tags: ['<script>bad</script>', 'good'],
    });
    expect((result.tags as string[])[0]).not.toContain('<script>');
    expect((result.tags as string[])[1]).toBe('good');
  });
});

describe('checkRateLimit', () => {
  it('allows requests within limit', () => {
    const key = 'test-' + Date.now();
    expect(checkRateLimit(key, 5, 1000)).toBe(true);
    expect(checkRateLimit(key, 5, 1000)).toBe(true);
  });

  it('blocks requests exceeding limit', () => {
    const key = 'block-' + Date.now();
    for (let i = 0; i < 3; i++) {
      checkRateLimit(key, 3, 60000);
    }
    expect(checkRateLimit(key, 3, 60000)).toBe(false);
  });
});
