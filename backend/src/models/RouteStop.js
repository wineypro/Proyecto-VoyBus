const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RouteStop = sequelize.define('RouteStop', {
  lineRouteId: { type: DataTypes.INTEGER, allowNull: false },
  stopId: { type: DataTypes.INTEGER, allowNull: false },
  sequence: { type: DataTypes.INTEGER, allowNull: false },
});

module.exports = RouteStop;