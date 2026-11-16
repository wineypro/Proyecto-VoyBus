const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LineRoute = sequelize.define('LineRoute', {
  lineId: { type: DataTypes.INTEGER, allowNull: false },
  direction: { type: DataTypes.STRING(60), allowNull: false },
  operatingDays: { type: DataTypes.STRING(100), allowNull: false },
  schedule: { type: DataTypes.STRING(100), allowNull: false },
  origin: { type: DataTypes.STRING(100), allowNull: false },
  destination: { type: DataTypes.STRING(100), allowNull: false },
});

module.exports = LineRoute;