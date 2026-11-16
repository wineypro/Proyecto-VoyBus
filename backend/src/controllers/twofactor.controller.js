// Capa de controladores: traduce HTTP ↔ servicios. Sin lógica de negocio.
const twoFactorService = require('../services/twofactor.service');
const { ok } = require('../utils/response');

async function setup(req, res) {
  ok(res, await twoFactorService.startSetup(req.auth.user));
}

async function enable(req, res) {
  ok(res, await twoFactorService.enable(req.auth.user, req.valid.body));
}

async function disable(req, res) {
  ok(res, await twoFactorService.disable(req.auth.user, req.valid.body));
}

async function loginStep(req, res) {
  const { token, expiresAt, user } = await twoFactorService.completeLogin(req.valid.body);
  ok(res, { token, user }, { expiresAt });
}

module.exports = { setup, enable, disable, loginStep };
