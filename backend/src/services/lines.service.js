// Capa de servicios: lógica de negocio y acceso a modelos. No sabe nada de req/res.
const { Line, LineRoute, RouteStop, Stop } = require('../models');
const AppError = require('../utils/AppError');

async function listLines() {
  return Line.findAll({ where: { isActive: true }, order: [['code', 'ASC']] });
}

async function getLine(id) {
  const line = await Line.findByPk(id, {
    include: [
      {
        model: LineRoute,
        as: 'routes',
        include: [
          {
            model: RouteStop,
            as: 'routeStops',
            include: [{ model: Stop, as: 'stop' }],
          },
        ],
      },
    ],
    order: [
      [{ model: LineRoute, as: 'routes' }, 'id', 'ASC'],
      [{ model: LineRoute, as: 'routes' }, { model: RouteStop, as: 'routeStops' }, 'sequence', 'ASC'],
    ],
  });

  if (!line || !line.isActive) {
    throw new AppError(404, 'LINE_NOT_FOUND', 'La línea no existe');
  }

  const plain = line.toJSON();
  plain.routes = (plain.routes ?? []).map((route) => ({
    id: route.id,
    lineId: route.lineId,
    direction: route.direction,
    operatingDays: route.operatingDays,
    schedule: route.schedule,
    origin: route.origin,
    destination: route.destination,
    stops: (route.routeStops ?? [])
      .sort((a, b) => a.sequence - b.sequence)
      .map((rs) => ({
        id: rs.stop.id,
        code: rs.stop.code,
        name: rs.stop.name,
        latitude: rs.stop.latitude,
        longitude: rs.stop.longitude,
        sequence: rs.sequence,
      })),
  }));

  return plain;
}

module.exports = { listLines, getLine };