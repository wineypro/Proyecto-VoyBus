// Códigos TOTP (RFC 6238) para apps autenticadoras como Google Authenticator. Sin dependencias.
const crypto = require('crypto');

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const STEP_SECONDS = 30;
const DIGITS = 6;

function base32Encode(buffer) {
  let bits = '';
  for (const byte of buffer) bits += byte.toString(2).padStart(8, '0');
  let out = '';
  for (let i = 0; i < bits.length; i += 5) out += ALPHABET[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)];
  return out;
}

function base32Decode(text) {
  let bits = '';
  for (const ch of text.replace(/=+$/, '').toUpperCase()) {
    const value = ALPHABET.indexOf(ch);
    if (value === -1) throw new Error('Clave base32 no válida');
    bits += value.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

// Clave secreta nueva: 20 bytes al azar (160 bits), en base32 para escribirla o ponerla en el QR.
function generateSecret() {
  return base32Encode(crypto.randomBytes(20));
}

// Código de 6 dígitos para un contador (HOTP, RFC 4226).
function codeFor(secret, counter) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', base32Decode(secret)).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];
  return String(binary % 10 ** DIGITS).padStart(DIGITS, '0');
}

const stepAt = (timeMs) => Math.floor(timeMs / 1000 / STEP_SECONDS);

// Comprueba el código aceptando el paso actual y uno antes y después (desfase de reloj).
// Devuelve el número de paso que coincidió, o null si no coincide.
function verifyCode(secret, code, timeMs = Date.now(), window = 1) {
  if (!/^[0-9]{6}$/.test(code)) return null;
  const current = stepAt(timeMs);
  const received = Buffer.from(code);
  for (let step = current - window; step <= current + window; step += 1) {
    const expected = Buffer.from(codeFor(secret, step));
    if (crypto.timingSafeEqual(expected, received)) return step;
  }
  return null;
}

// Dirección que se codifica en el QR (formato estándar otpauth).
function otpauthUrl({ issuer, account, secret }) {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(account)}`;
  const params = new URLSearchParams({ secret, issuer, algorithm: 'SHA1', digits: String(DIGITS), period: String(STEP_SECONDS) });
  return `otpauth://totp/${label}?${params.toString()}`;
}

module.exports = { generateSecret, codeFor, verifyCode, otpauthUrl, base32Encode, base32Decode, stepAt };
