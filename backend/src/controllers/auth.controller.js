// Capa de controladores: traduce HTTP ↔ servicios. Sin lógica de negocio.
const authService = require('../services/auth.service');
const sessionService = require('../services/session.service');
const passwordService = require('../services/password.service');
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
  const result = await authService.login(req.valid.body);
  // Cuenta con verificación en dos pasos: todavía no hay sesión, falta el código de la app.
  if (result.requiresTwoFactor) {
    return ok(res, { requiresTwoFactor: true, challengeToken: result.challengeToken });
  }
  ok(res, { token: result.token, user: result.user }, { expiresAt: result.expiresAt });
}

// Usuario de la sesión actual (lo carga requireAuth).
async function me(req, res) {
  ok(res, authService.toPublicUser(req.auth.user, req.auth.role));
}

async function logout(req, res) {
  await sessionService.revoke(req.auth.session);
  ok(res, { loggedOut: true });
}

async function forgotPassword(req, res) {
  const { recovery } = await passwordService.requestReset(req.valid.body);
  ok(res, { sent: true }, { recovery });
}

async function resetPassword(req, res) {
  await passwordService.resetPassword(req.valid.body);
  ok(res, { updated: true });
}

async function changePassword(req, res) {
  await passwordService.changePassword(req.auth, req.valid.body);
  ok(res, { updated: true });
}

module.exports = {
  register,
  verifyEmail,
  resendCode,
  login,
  me,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
};
