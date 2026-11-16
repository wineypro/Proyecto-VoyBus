// Desafío del inicio de sesión en dos pasos: un testigo firmado y de vida corta que prueba que la
// contraseña ya fue validada. No da acceso por sí solo: falta el código de la app autenticadora.
const crypto = require('crypto');

const CHALLENGE_MINUTES = 5;

const secret = () => process.env.AUTH_SECRET || 'voybus-dev-secret';
const sign = (body) => crypto.createHmac('sha256', secret()).update(`challenge:${body}`).digest('base64url');

function createChallenge(userId) {
  const body = Buffer.from(JSON.stringify({ uid: userId, exp: Date.now() + CHALLENGE_MINUTES * 60 * 1000 })).toString('base64url');
  return `${body}.${sign(body)}`;
}

// Devuelve el id del usuario si el testigo es auténtico y no venció; si no, null.
function readChallenge(token) {
  const [body, signature] = String(token).split('.');
  if (!body || !signature) return null;
  const expected = Buffer.from(sign(body));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) return null;
  try {
    const { uid, exp } = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return Number.isInteger(uid) && Date.now() < exp ? uid : null;
  } catch {
    return null;
  }
}

module.exports = { createChallenge, readChallenge, CHALLENGE_MINUTES };
