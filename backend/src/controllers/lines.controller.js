// Capa de controladores: traduce HTTP ↔ servicios. Sin lógica de negocio.
const linesService = require('../services/lines.service');
const { ok } = require('../utils/response');

async function list(req, res) {
  const lines = await linesService.listLines();
  ok(res, lines, { total: lines.length });
}

async function detail(req, res) {
  const line = await linesService.getLine(req.valid.params.id);
  ok(res, line);
}

module.exports = { list, detail };