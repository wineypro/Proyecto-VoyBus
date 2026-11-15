// Capa de controladores: traduce HTTP ↔ servicios. Sin lógica de negocio.
const authService = require('../services/auth.service');
const sessionService = require('../services/session.service');
const { ok } = require('../utils/response');

async function register(req, res) {
  const { user, verification } = await authService.register(req.valid.body);
  ok(res, user, { verification }, 201);
}

async function verifyEmail(req, res) {
  const user = await authService.verifyEmail(req.valid.body);
  ok(res, user);
}

async function resendCode(req, res) {
  const { verification } = await authService.resendVerification(req.valid.body);
  ok(res, { sent: true }, { verification });
}

async function login(req, res) {
  const { token, expiresAt, user } = await authService.login(req.valid.body);
  ok(res, { token, user }, { expiresAt });
}

// Usuario de la sesión actual (lo carga requireAuth).
async function me(req, res) {
  ok(res, authService.toPublicUser(req.auth.user, req.auth.role));
}

async function logout(req, res) {
  await sessionService.revoke(req.auth.session);
  ok(res, { loggedOut: true });
}

module.exports = { register, verifyEmail, resendCode, login, me, logout };
