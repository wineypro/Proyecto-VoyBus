const AppError = require('../utils/AppError');
const { authenticate } = require('../services/session.service');

// Uso: router.get('/ruta', requireAuth, controller.algo)
// Deja en req.auth: { user, session, role } (role es 'pasajero', 'conductor' o 'administrador').
// La app manda el header:  Authorization: Bearer <token>
async function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new AppError(401, 'UNAUTHORIZED', 'Debes iniciar sesión');
  }
  const { session, user } = await authenticate(token);
  req.auth = { session, user, role: user.role.name };
  next();
}

// Uso: router.get('/admin', requireAuth, requireRole('administrador'), controller.algo)
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.auth.role)) {
    throw new AppError(403, 'FORBIDDEN', 'No tienes permiso para esta acción');
  }
  next();
};

module.exports = { requireAuth, requireRole };
