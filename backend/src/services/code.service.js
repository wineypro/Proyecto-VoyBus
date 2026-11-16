// Códigos de un solo uso (verificación de correo, 2FA, recuperación). No sabe nada de req/res.
const crypto = require('crypto');
const { Op } = require('sequelize');
const { OneTimeCode } = require('../models');
const AppError = require('../utils/AppError');

const CODE_MINUTES = 10; // vigencia del código
const MAX_ATTEMPTS = 5; // intentos con código incorrecto antes de invalidarlo
const RESEND_SECONDS = 30; // espera mínima entre un envío y el siguiente

function hashCode(userId, purpose, code) {
  const secret = process.env.AUTH_SECRET || 'voybus-dev-secret';
  return crypto.createHmac('sha256', secret).update(`${userId}:${purpose}:${code}`).digest('hex');
}

// Crea un código nuevo (e invalida los anteriores del mismo tipo). Devuelve el código en claro
// para enviarlo por correo; en la base solo queda su hash.
async function issueCode(user, purpose) {
  const last = await OneTimeCode.findOne({
    where: { userId: user.id, purpose },
    order: [['createdAt', 'DESC']],
  });
  if (last) {
    const elapsed = (Date.now() - last.createdAt.getTime()) / 1000;
    if (elapsed < RESEND_SECONDS) {
      const wait = Math.ceil(RESEND_SECONDS - elapsed);
      throw new AppError(429, 'CODE_TOO_SOON', `Espera ${wait} segundos antes de pedir otro código`, {
        retryAfterSeconds: wait,
      });
    }
  }

  await OneTimeCode.update(
    { usedAt: new Date() },
    { where: { userId: user.id, purpose, usedAt: null } },
  );

  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  await OneTimeCode.create({
    userId: user.id,
    purpose,
    codeHash: hashCode(user.id, purpose, code),
    expiresAt: new Date(Date.now() + CODE_MINUTES * 60 * 1000),
  });
  return code;
}

// Comprueba el código y lo marca como usado. Mismo error para vencido, usado o incorrecto.
async function consumeCode(user, purpose, code) {
  const invalid = () => new AppError(400, 'INVALID_CODE', 'El código no es válido o ya venció');

  const record = await OneTimeCode.findOne({
    where: { userId: user.id, purpose, usedAt: null, expiresAt: { [Op.gt]: new Date() } },
    order: [['createdAt', 'DESC']],
  });
  if (!record) throw invalid();

  const expected = Buffer.from(record.codeHash, 'hex');
  const received = Buffer.from(hashCode(user.id, purpose, code), 'hex');
  const match = expected.length === received.length && crypto.timingSafeEqual(expected, received);

  if (!match) {
    const attempts = record.attempts + 1;
    await record.update({
      attempts,
      usedAt: attempts >= MAX_ATTEMPTS ? new Date() : null,
    });
    throw invalid();
  }

  await record.update({ usedAt: new Date() });
}

module.exports = { issueCode, consumeCode, CODE_MINUTES };
