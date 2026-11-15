// Recuperar y cambiar contraseña (ACC-04). No sabe nada de req/res.
const { Op } = require('sequelize');
const { User, Session } = require('../models');
const AppError = require('../utils/AppError');
const { hashPassword, verifyPassword } = require('../utils/password');
const { sendMail, codeEmail } = require('../utils/mailer');
const { issueCode, consumeCode, CODE_MINUTES } = require('./code.service');

const MAX_FAILED_ATTEMPTS = 5; // contraseñas actuales incorrectas seguidas antes de esperar
const LOCK_MINUTES = 5;
const PURPOSE = 'reset_password';

// Cierra las sesiones abiertas de la cuenta (todas, o todas menos una).
function revokeSessions(userId, exceptSessionId) {
  const where = { userId, revokedAt: null };
  if (exceptSessionId) where.id = { [Op.ne]: exceptSessionId };
  return Session.update({ revokedAt: new Date() }, { where });
}

// Envía el código de recuperación al correo. Responde igual exista o no la cuenta, para no
// revelar qué correos están registrados. Solo las cuentas activas (correo verificado) reciben código.
async function requestReset({ email }) {
  const user = await User.findOne({ where: { email } });
  if (!user || user.status !== 'active') return { recovery: undefined };

  let code;
  try {
    code = await issueCode(user, PURPOSE);
  } catch (err) {
    // Pidió otro código muy pronto: se responde igual, sin revelar que la cuenta existe.
    if (err.code === 'CODE_TOO_SOON') return { recovery: undefined };
    throw err;
  }

  const { text, html } = codeEmail({
    title: 'Recupera tu contraseña',
    intro: 'Usa este código para crear una contraseña nueva. Si no lo pediste tú, ignora este correo.',
    code,
    minutes: CODE_MINUTES,
  });
  const result = await sendMail({ to: user.email, subject: 'Recupera tu contraseña de VoyBus', text, html });

  return {
    recovery: {
      channel: 'email',
      simulated: result.simulated,
      sent: result.sent,
      expiresInMinutes: CODE_MINUTES,
      // Solo en modo simulado (sin SMTP) se devuelve el código, para poder probar sin correo real.
      ...(result.simulated ? { code } : {}),
    },
  };
}

// Cambia la contraseña con el código recibido. Mismo error para correo inexistente o código malo.
async function resetPassword({ email, code, newPassword }) {
  const user = await User.findOne({ where: { email } });
  if (!user || user.status !== 'active') {
    throw new AppError(400, 'INVALID_CODE', 'El código no es válido o ya venció');
  }
  await consumeCode(user, PURPOSE, code);

  await user.update({
    passwordHash: await hashPassword(newPassword),
    failedLoginAttempts: 0,
    lockedUntil: null,
  });
  // Por seguridad, cualquier sesión abierta con la clave anterior se cierra.
  await revokeSessions(user.id);
}

// Cambia la contraseña desde el perfil: exige la actual y espera un tiempo tras varios fallos.
async function changePassword({ user, session }, { currentPassword, newPassword }) {
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const seconds = Math.ceil((user.lockedUntil - new Date()) / 1000);
    throw new AppError(
      429,
      'TOO_MANY_ATTEMPTS',
      `Demasiados intentos fallidos. Intenta de nuevo en ${Math.ceil(seconds / 60)} min`,
      { retryAfterSeconds: seconds },
    );
  }

  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) {
    const attempts = user.failedLoginAttempts + 1;
    if (attempts >= MAX_FAILED_ATTEMPTS) {
      await user.update({
        failedLoginAttempts: 0,
        lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60 * 1000),
      });
      throw new AppError(
        429,
        'TOO_MANY_ATTEMPTS',
        `Demasiados intentos fallidos. Intenta de nuevo en ${LOCK_MINUTES} min`,
        { retryAfterSeconds: LOCK_MINUTES * 60 },
      );
    }
    await user.update({ failedLoginAttempts: attempts });
    throw new AppError(400, 'INVALID_CURRENT_PASSWORD', 'La contraseña actual no es correcta');
  }

  await user.update({
    passwordHash: await hashPassword(newPassword),
    failedLoginAttempts: 0,
    lockedUntil: null,
  });
  // Las demás sesiones (otros teléfonos) se cierran; la actual sigue abierta.
  await revokeSessions(user.id, session.id);
}

module.exports = { requestReset, resetPassword, changePassword };
