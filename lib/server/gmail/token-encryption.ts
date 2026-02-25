/**
 * AES-256-GCM トークン暗号化/復号化（B氏設計）
 *
 * キーローテーション対応:
 *   GMAIL_TOKEN_ENCRYPTION_KEY     = 現在のキー（64文字hex）
 *   GMAIL_TOKEN_ENCRYPTION_KEY_V1  = 旧キー
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(version = 1): Buffer {
  const envKey =
    version === 1
      ? process.env.GMAIL_TOKEN_ENCRYPTION_KEY
      : process.env[`GMAIL_TOKEN_ENCRYPTION_KEY_V${version - 1}`];

  if (!envKey || envKey.length !== 64) {
    throw new Error(`Encryption key for version ${version} is not configured`);
  }

  return Buffer.from(envKey, 'hex');
}

export function encryptToken(plaintext: string): {
  encrypted: string;
  iv: string;
  authTag: string;
  version: number;
} {
  const key = getKey(1);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    version: 1,
  };
}

export function decryptToken(
  encrypted: string,
  iv: string,
  authTag: string,
  version = 1
): string {
  const key = getKey(version);
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, 'base64'),
    { authTagLength: AUTH_TAG_LENGTH }
  );
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));

  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
