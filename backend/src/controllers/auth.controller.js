// Capa de controladores: traduce HTTP ↔ servicios. Sin lógica de negocio.
const authService = require('../services/auth.service');
const { ok } = require('../utils/response');

async function register(req, res) {
  const { user, verification } = await authService.register(req.valid.body);
  ok(res, user, { verification }, 201);
}

module.exports = { register };