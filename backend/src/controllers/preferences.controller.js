// Capa de controladores: traduce HTTP ↔ servicios. Sin lógica de negocio.
const preferencesService = require('../services/preferences.service');
const { ok } = require('../utils/response');

async function get(req, res) {
  ok(res, preferencesService.getPreferences(req.auth.user));
}

async function update(req, res) {
  ok(res, await preferencesService.updatePreferences(req.auth.user, req.valid.body));
}

module.exports = { get, update };
