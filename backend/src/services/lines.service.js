// Capa de servicios: lógica de negocio y acceso a modelos. No sabe nada de req/res.
const { Line } = require('../models');
const AppError = require('../utils/AppError');

async function listLines() {
  return Line.findAll({ where: { isActive: true }, order: [['code', 'ASC']] });
}

async function getLine(id) {
  const line = await Line.findByPk(id);
  if (!line || !line.isActive) {
    throw new AppError(404, 'LINE_NOT_FOUND', 'La línea no existe');
  }
  return line;
}

module.exports = { listLines, getLine };