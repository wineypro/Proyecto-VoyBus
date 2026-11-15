// Capa de controladores: traduce HTTP ↔ servicios. Sin lógica de negocio.
const stopsService = require('../services/stops.service');
const { ok } = require('../utils/response');

async function list(req, res) {
  const stops = await stopsService.listStops(req.query.q);
  ok(res, stops, { total: stops.length });
}

async function detail(req, res) {
  const stop = await stopsService.getStop(req.valid.params.id);
  ok(res, stop);
}

module.exports = { list, detail };