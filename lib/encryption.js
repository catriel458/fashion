import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32;

function getKey() {
  if (!process.env.ENCRYPTION_KEY) throw new Error('ENCRYPTION_KEY no está definida');
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  if (key.length !== KEY_LENGTH) throw new Error('ENCRYPTION_KEY debe ser de 32 bytes (64 caracteres hex)');
  return key;
}

export function encrypt(text) {
  const key = getKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(ciphertext) {
  const key = getKey();
  const [ivHex, encHex] = ciphertext.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const enc = Buffer.from(encHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  const decrypted = Buffer.concat([decipher.update(enc), decipher.final()]);
  return decrypted.toString('utf8');
}
