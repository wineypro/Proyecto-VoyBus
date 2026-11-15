// Verificación en dos pasos con app autenticadora (TOTP). No sabe nada de req/res.
const QRCode = require('qrcode');
const { User, Role } = require('../models');
const AppError = require('../utils/AppError');
const { verifyPassword } = require('../utils/password');
const { encrypt, decrypt } = require('../utils/secretBox');
const { generateSecret, verifyCode, otpauthUrl } = require('../utils/totp');
const { readChallenge } = require('../utils/challenge');
const { createSession } = require('./auth.service');

const MAX_FAILED_ATTEMPTS = 5; // mismos contadores que el inicio de sesión
const LOCK_MINUTES = 5;
const ISSUER = 'VoyBus';

function assertNotLocked(user) {
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const seconds = Math.ceil((user.lockedUntil - new Date()) / 1000);
    throw new AppError(
      429,
      'TOO_MANY_ATTEMPTS',
      `Demasiados intentos fallidos. Intenta de nuevo en ${Math.ceil(seconds / 60)} min`,
      { retryAfterSeconds: seconds },
    );
  }
}

// Suma un intento fallido; al quinto, bloquea unos minutos. Siempre lanza un error.
async function failAttempt(user, message = 'El código no es válido o ya venció') {
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
  throw new AppError(400, 'INVALID_CODE', message);
}

// Paso del código si es válido y no se usó antes; si no, null.
function freshStep(user, code) {
  const step = verifyCode(decrypt(user.twoFactorSecret), code);
  if (step === null) return null;
  return user.twoFactorLastStep != null && step <= user.twoFactorLastStep ? null : step;
}

// Paso 1 de la activación: genera la clave y el QR que la persona escanea con su app.
async function startSetup(user) {
  if (user.twoFactorEnabled) {
    throw new AppError(409, 'TWO_FACTOR_ALREADY_ENABLED', 'La verificación en dos pasos ya está activada');
  }
  const secret = generateSecret();
  await user.update({ twoFactorSecret: encrypt(secret), twoFactorLastStep: null });

  const url = otpauthUrl({ issuer: ISSUER, account: user.email, secret });
  const qrDataUrl = await QRCode.toDataURL(url, { margin: 1, width: 240 });
  return { secret, otpauthUrl: url, qrDataUrl };
}

// Paso 2: confirma con un código de la app. Recién ahí queda activada.
async function enable(user, { code }) {
  if (user.twoFactorEnabled) {
    throw new AppError(409, 'TWO_FACTOR_ALREADY_ENABLED', 'La verificación en dos pasos ya está activada');
  }
  if (!user.twoFactorSecret) {
    throw new AppError(400, 'TWO_FACTOR_NOT_STARTED', 'Primero escanea el código QR con tu app autenticadora');
  }
  assertNotLocked(user);

  const step = freshStep(user, code);
  if (step === null) await failAttempt(user);

  await user.update({ twoFactorEnabled: true, twoFactorLastStep: step, failedLoginAttempts: 0, lockedUntil: null });
  return { enabled: true };
}

// Desactivar exige la contraseña y un código vigente; el error no dice cuál de los dos falló.
async function disable(user, { password, code }) {
  if (!user.twoFactorEnabled) {
    throw new AppError(400, 'TWO_FACTOR_NOT_ENABLED', 'La verificación en dos pasos no está activada');
  }
  assertNotLocked(user);

  const passwordOk = await verifyPassword(password, user.passwordHash);
  const step = freshStep(user, code);
  if (!passwordOk || step === null) {
    await failAttempt(user, 'La contraseña o el código no son correctos');
  }

  await user.update({
    twoFactorEnabled: false,
    twoFactorSecret: null,
    twoFactorLastStep: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
  });
  return { enabled: false };
}

// Segundo paso del inicio de sesión: valida el código y recién entonces abre la sesión.
async function completeLogin({ challengeToken, code }) {
  const expired = () =>
    new AppError(401, 'CHALLENGE_EXPIRED', 'La verificación venció. Inicia sesión de nuevo');

  const userId = readChallenge(challengeToken);
  if (!userId) throw expired();

  const user = await User.findByPk(userId, { include: [{ model: Role, as: 'role' }] });
  if (!user || user.status !== 'active' || !user.twoFactorEnabled) throw expired();
  assertNotLocked(user);

  const step = freshStep(user, code);
  if (step === null) await failAttempt(user);

  await user.update({ twoFactorLastStep: step, failedLoginAttempts: 0, lockedUntil: null });
  return createSession(user, user.role.name);
}

module.exports = { startSetup, enable, disable, completeLogin };
