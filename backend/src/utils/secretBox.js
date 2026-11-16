// Cifrado de datos sensibles en la base (AES-256-GCM). La clave se deriva de AUTH_SECRET.
const crypto = require('crypto');

function key() {
  const secret = process.env.AUTH_SECRET || 'voybus-dev-secret';
  return crypto.createHash('sha256').update(`secretbox:${secret}`).digest();
}

function encrypt(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), data.toString('base64')].join(':');
}

function decrypt(payload) {
  const [version, iv, tag, data] = payload.split(':');
  if (version !== 'v1') throw new Error('Formato de dato cifrado desconocido');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8');
}

module.exports = { encrypt, decrypt };
