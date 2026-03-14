import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(version = 1): Buffer {
  const envKey = version === 1
    ? process.env.GMAIL_TOKEN_ENCRYPTION_KEY
    : process.env[`GMAIL_TOKEN_ENCRYPTION_KEY_V${version}`];

  if (!envKey) throw new Error(`Encryption key not found for version ${version}`);
  return Buffer.from(envKey, 'hex');
}

export function encryptToken(token: string): { encrypted: string; iv: string; authTag: string; version: number } {
  const key = getEncryptionKey(1);
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(token, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag().toString('base64');

  return {
    encrypted,
    iv: iv.toString('base64'),
    authTag,
    version: 1,
  };
}

export function decryptToken(encrypted: string, iv: string, authTag: string, version = 1): string {
  const key = getEncryptionKey(version);
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));

  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
