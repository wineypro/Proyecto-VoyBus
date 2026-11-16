// Historial personal (ACC-07). No sabe nada de req/res.
const { HistoryRecord } = require('../models');
const AppError = require('../utils/AppError');

const TIME_ZONE = 'America/Santiago';

// El historial solo informa que se avisó al conductor: nunca afirma que el pasajero bajó ahí.
const STATUS_LABELS = {
  notified: 'Aviso enviado al conductor',
  cancelled: 'Solicitud cancelada',
  expired: 'Solicitud sin atender',
};

const dayFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const timeFormat = new Intl.DateTimeFormat('es-CL', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const localDay = (date) => dayFormat.format(date); // AAAA-MM-DD en hora de Chile

function parseFilters({ date, lineId } = {}) {
  const filters = { date: null, lineId: null };

  if (date !== undefined && String(date).trim() !== '') {
    const value = String(date).trim();
    const valid =
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
      new Date(`${value}T00:00:00Z`).toISOString().startsWith(value);
    if (!valid) {
      throw new AppError(400, 'INVALID_DATE', 'La fecha debe tener el formato AAAA-MM-DD, por ejemplo 2026-11-15');
    }
    filters.date = value;
  }

  if (lineId !== undefined && String(lineId).trim() !== '') {
    const id = Number(lineId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError(400, 'INVALID_LINE', 'La línea indicada no es válida');
    }
    filters.lineId = id;
  }

  return filters;
}

function toItem(record) {
  const when = record.occurredAt;
  return {
    id: record.id,
    date: `${localDay(when)} ${timeFormat.format(when)}`,
    lineCode: record.lineCode,
    lineName: record.lineName,
    routeDirection: record.routeDirection,
    requestedStopName: record.stopName,
    finalStatus: STATUS_LABELS[record.status] ?? record.status,
    closeReason: record.closeReason,
  };
}

// Solo devuelve registros de la cuenta indicada, del más reciente al más antiguo.
async function listHistory(userId, rawFilters) {
  const filters = parseFilters(rawFilters);

  const where = { userId };
  if (filters.lineId) where.lineId = filters.lineId;

  const records = await HistoryRecord.findAll({ where, order: [['occurredAt', 'DESC'], ['id', 'DESC']] });
  const filtered = filters.date ? records.filter((r) => localDay(r.occurredAt) === filters.date) : records;

  return { items: filtered.map(toItem), filters };
}

module.exports = { listHistory, STATUS_LABELS };
