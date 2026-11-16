const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Registro del historial personal (ACC-07): una solicitud de parada hecha por el pasajero.
// Los textos son una copia de lo que existía en ese momento (ver la migración).
const HistoryRecord = sequelize.define('HistoryRecord', {
  userId: { type: DataTypes.INTEGER, allowNull: false },
  lineId: { type: DataTypes.INTEGER, allowNull: true },
  stopId: { type: DataTypes.INTEGER, allowNull: true },
  lineCode: { type: DataTypes.STRING(10), allowNull: false },
  lineName: { type: DataTypes.STRING(100), allowNull: false },
  routeDirection: { type: DataTypes.STRING(100), allowNull: false },
  stopName: { type: DataTypes.STRING(100), allowNull: false },
  status: { type: DataTypes.STRING(20), allowNull: false },
  closeReason: { type: DataTypes.STRING(200), allowNull: false },
  occurredAt: { type: DataTypes.DATE, allowNull: false },
});

module.exports = HistoryRecord;
