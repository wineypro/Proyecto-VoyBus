// Capa de servicios: lógica de negocio y acceso a modelos. No sabe nada de req/res.
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User, Role, Session } = require('../models');
const AppError = require('../utils/AppError');
const { hashPassword, verifyPassword } = require('../utils/password');
const { sendMail, codeEmail } = require('../utils/mailer');
const { issueCode, consumeCode, CODE_MINUTES } = require('./code.service');
const { createChallenge } = require('../utils/challenge');

const MAX_FAILED_ATTEMPTS = 5; // intentos fallidos seguidos antes de bloquear
const LOCK_MINUTES = 5; // espera temporal tras el bloqueo
const SESSION_DAYS = 7;

// Datos del usuario que se pueden mostrar. NUNCA se devuelve passwordHash.
function toPublicUser(user, roleName) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: roleName,
    status: user.status,
    alias: user.alias ?? null,
    photoUrl: user.photoUrl ?? null,
    twoFactorEnabled: Boolean(user.twoFactorEnabled),
    createdAt: user.createdAt,
  };
}

// Crea un código nuevo, lo envía por correo y arma lo que se informa a la app.
// Si el correo está simulado (sin credenciales SMTP), se devuelve el código para poder probar;
// con correo real, el código NUNCA se devuelve.
async function sendVerificationCode(user) {
  const code = await issueCode(user, 'verify_email');
  const mail = codeEmail({
    title: 'Tu código de verificación de VoyBus',
    intro: `Hola ${user.name}, usa este código para verificar tu correo en VoyBus.`,
    code,
    minutes: CODE_MINUTES,
  });
  const result = await sendMail({
    to: user.email,
    subject: 'Tu código de verificación de VoyBus',
    ...mail,
  });
  return {
    channel: 'email',
    simulated: result.simulated,
    sent: result.sent,
    expiresInMinutes: CODE_MINUTES,
    ...(result.simulated ? { code } : {}),
  };
}

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

async function register({ name, email, phone, password, acceptPrivacy }) {
  const duplicated = await User.findOne({
    where: phone ? { [Op.or]: [{ email }, { phone }] } : { email },
  });
  if (duplicated) {
    if (duplicated.email === email) {
      throw new AppError(409, 'EMAIL_ALREADY_REGISTERED', 'Ya existe una cuenta con ese correo');
    }
    throw new AppError(409, 'PHONE_ALREADY_REGISTERED', 'Ya existe una cuenta con ese teléfono');
  }

  const role = await Role.findOne({ where: { name: 'pasajero' } });
  const user = await User.create({
    name,
    email,
    phone: phone ?? null,
    passwordHash: await hashPassword(password),
    roleId: role.id,
    status: 'pending',
    privacyAcceptedAt: acceptPrivacy ? new Date() : null,
  });

  return {
    user: toPublicUser(user, role.name),
    verification: await sendVerificationCode(user),
  };
}

// Marca el correo como verificado si el código es correcto, vigente y no usado.
// El error es el mismo para "correo inexistente" y "código incorrecto", para no revelar qué cuentas existen.
async function verifyEmail({ email, code }) {
  const user = await User.findOne({ where: { email }, include: [{ model: Role, as: 'role' }] });
  if (!user) {
    throw new AppError(400, 'INVALID_CODE', 'El código no es válido o ya venció');
  }
  if (user.status === 'disabled') {
    throw new AppError(403, 'ACCOUNT_DISABLED', 'Esta cuenta está deshabilitada');
  }
  await consumeCode(user, 'verify_email', code);
  if (user.status === 'pending') {
    await user.update({ status: 'active', emailVerifiedAt: new Date() });
  }
  return toPublicUser(user, user.role.name);
}

// Reenvía el código de verificación. Responde igual exista o no la cuenta, para no revelarlo.
async function resendVerification({ email }) {
  const user = await User.findOne({ where: { email } });
  if (!user || user.status !== 'pending') {
    return { sent: true };
  }
  const verification = await sendVerificationCode(user);
  return { sent: true, verification };
}

// Hash de relleno: se compara aunque el correo no exista, para que el tiempo de respuesta
// no delate qué correos están registrados.
const DUMMY_HASH = `scrypt$${'0'.repeat(32)}$${'0'.repeat(128)}`;

async function login({ email, password }) {
  const user = await User.findOne({ where: { email }, include: [{ model: Role, as: 'role' }] });
  const invalid = () => new AppError(401, 'INVALID_CREDENTIALS', 'Correo o contraseña incorrectos');

  if (!user) {
    await verifyPassword(password, DUMMY_HASH);
    throw invalid();
  }

  // Bloqueo temporal por intentos fallidos
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const seconds = Math.ceil((user.lockedUntil - new Date()) / 1000);
    throw new AppError(
      429,
      'TOO_MANY_ATTEMPTS',
      `Demasiados intentos fallidos. Intenta de nuevo en ${Math.ceil(seconds / 60)} min`,
      { retryAfterSeconds: seconds },
    );
  }

  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) {
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
    throw invalid();
  }

  // Estas dos respuestas solo se dan con la contraseña correcta, así no revelan si el correo existe.
  if (user.status === 'disabled') {
    throw new AppError(403, 'ACCOUNT_DISABLED', 'Esta cuenta está deshabilitada');
  }
  if (user.status === 'pending') {
    throw new AppError(
      403,
      'ACCOUNT_NOT_VERIFIED',
      'Debes verificar tu correo con el código que te enviamos para poder ingresar',
    );
  }

  // Con verificación en dos pasos activa, la contraseña sola no da acceso: se entrega un desafío de
  // vida corta y la app debe enviar el código de su app autenticadora (/auth/login/2fa).
  // Los contadores de intentos NO se reinician aquí, sino al completar el segundo paso.
  if (user.twoFactorEnabled) {
    return { requiresTwoFactor: true, challengeToken: createChallenge(user.id) };
  }

  await user.update({ failedLoginAttempts: 0, lockedUntil: null });
  return createSession(user, user.role.name);
}

// Abre la sesión: el token viaja a la app y en la base solo queda su hash.
async function createSession(user, roleName) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await Session.create({ userId: user.id, tokenHash: sha256(token), expiresAt });

  return { token, expiresAt, user: toPublicUser(user, roleName) };
}

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  createSession,
  toPublicUser,
  sha256,
};
