/**
 * lib/utils/encryption.ts
 *
 * Phase 12: トークン暗号化ユーティリティ
 * AES-256-GCM を使用した暗号化/復号
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;  // 128ビット

/**
 * 暗号化キーを取得
 */
function getKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('TOKEN_ENCRYPTION_KEY is not configured');
  }
  return Buffer.from(key, 'base64');
}

/**
 * テキストを暗号化
 * @param plainText 平文
 * @returns 暗号文（iv:authTag:encrypted の形式、base64エンコード）
 */
export function encrypt(plainText: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  // iv:authTag:encrypted の形式で結合
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * 暗号文を復号
 * @param encryptedText 暗号文（iv:authTag:encrypted の形式）
 * @returns 平文
 */
export function decrypt(encryptedText: string): string {
  const key = getKey();

  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format');
  }

  const iv = Buffer.from(parts[0], 'base64');
  const authTag = Buffer.from(parts[1], 'base64');
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * 暗号化キーが設定されているか確認
 */
export function isEncryptionConfigured(): boolean {
  return !!process.env.TOKEN_ENCRYPTION_KEY;
}
