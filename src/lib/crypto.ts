import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const SECRET = Buffer.from(process.env.KEY_ENCRYPTION_SECRET!, 'base64'); // 32 Bytes

export function encryptKey(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', SECRET, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), enc].map(b => b.toString('base64')).join(':');
}

export function decryptKey(stored: string): string {
  const [iv, tag, data] = stored.split(':').map(s => Buffer.from(s, 'base64'));
  const decipher = createDecipheriv('aes-256-gcm', SECRET, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
