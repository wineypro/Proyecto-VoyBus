// Capa de servicios: lógica de negocio y acceso a modelos. No sabe nada de req/res.
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User, Role } = require('../models');
const AppError = require('../utils/AppError');
const { hashPassword } = require('../utils/password');

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
    createdAt: user.createdAt,
  };
}

// Verificación SIMULADA: no se envía un correo real. El código de 6 dígitos se calcula a partir
// del correo, así que no hace falta guardarlo. En la respuesta del registro se devuelve para poder probar.
function verificationCode(email) {
  const secret = process.env.AUTH_SECRET || 'voybus-dev-secret';
  const digest = crypto.createHmac('sha256', secret).update(email).digest();
  return String(digest.readUInt32BE(0) % 1000000).padStart(6, '0');
}

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
    verification: { simulated: true, channel: 'email', code: verificationCode(email) },
  };
}

module.exports = { register, toPublicUser, verificationCode };