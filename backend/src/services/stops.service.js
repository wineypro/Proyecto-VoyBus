// Capa de servicios: lógica de negocio y acceso a modelos. No sabe nada de req/res.
const { Op } = require('sequelize');
const { Stop, RouteStop, LineRoute, Line } = require('../models');
const AppError = require('../utils/AppError');

function formatStopWithLines(stopInstance) {
  const plain = stopInstance.toJSON();
  const routeStops = plain.routeStops ?? [];

  const linesMap = new Map();
  for (const rs of routeStops) {
    const lr = rs.lineRoute;
    if (!lr || !lr.line || !lr.line.isActive) continue;

    const line = lr.line;
    if (!linesMap.has(line.id)) {
      linesMap.set(line.id, {
        id: line.id,
        code: line.code,
        name: line.name,
        color: line.color,
        status: line.status,
        directions: [],
      });
    }

    const entry = linesMap.get(line.id);
    if (!entry.directions.some((d) => d.routeId === lr.id)) {
      entry.directions.push({
        routeId: lr.id,
        direction: lr.direction,
        operatingDays: lr.operatingDays,
        schedule: lr.schedule,
        sequence: rs.sequence,
      });
    }
  }

  return {
    id: plain.id,
    code: plain.code,
    name: plain.name,
    latitude: plain.latitude,
    longitude: plain.longitude,
    isActive: plain.isActive,
    lines: Array.from(linesMap.values()).sort((a, b) => a.code.localeCompare(b.code)),
  };
}

const stopInclude = [
  {
    model: RouteStop,
    as: 'routeStops',
    include: [
      {
        model: LineRoute,
        as: 'lineRoute',
        include: [{ model: Line, as: 'line' }],
      },
    ],
  },
];

async function listStops(searchQuery = '') {
  const trimmed = String(searchQuery ?? '').trim();
  const where = { isActive: true };

  if (trimmed) {
    where[Op.or] = [
      { code: { [Op.like]: `%${trimmed}%` } },
      { name: { [Op.like]: `%${trimmed}%` } },
    ];
  }

  const stops = await Stop.findAll({
    where,
    include: stopInclude,
    order: [['code', 'ASC']],
  });

  return stops.map(formatStopWithLines);
}

async function getStop(id) {
  const stop = await Stop.findByPk(id, { include: stopInclude });
  if (!stop || !stop.isActive) {
    throw new AppError(404, 'STOP_NOT_FOUND', 'El paradero no existe');
  }
  return formatStopWithLines(stop);
}

module.exports = { listStops, getStop };