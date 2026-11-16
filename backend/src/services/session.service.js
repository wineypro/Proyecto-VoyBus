// Sesiones: validar el token que manda la app y cerrar sesión. No sabe nada de req/res.
const { Session, User, Role } = require('../models');
const AppError = require('../utils/AppError');
const { sha256 } = require('./auth.service');

// Devuelve la sesión y el usuario si el token es válido; si no, lanza 401.
async function authenticate(token) {
  const session = await Session.findOne({
    where: { tokenHash: sha256(token), revokedAt: null },
    include: [{ model: User, as: 'user', include: [{ model: Role, as: 'role' }] }],
  });
  if (!session || session.expiresAt <= new Date()) {
    throw new AppError(401, 'UNAUTHORIZED', 'Tu sesión no es válida o expiró. Inicia sesión de nuevo');
  }
  if (session.user.status !== 'active') {
    throw new AppError(403, 'ACCOUNT_DISABLED', 'Esta cuenta no está habilitada');
  }
  return { session, user: session.user };
}

// Cierra la sesión: el token queda inutilizable aunque alguien lo tenga guardado.
async function revoke(session) {
  await session.update({ revokedAt: new Date() });
}

module.exports = { authenticate, revoke };
