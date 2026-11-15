const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OneTimeCode = sequelize.define('OneTimeCode', {
  userId: { type: DataTypes.INTEGER, allowNull: false },
  purpose: { type: DataTypes.STRING(30), allowNull: false },
  codeHash: { type: DataTypes.STRING(64), allowNull: false },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  usedAt: { type: DataTypes.DATE, allowNull: true },
  attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
});

module.exports = OneTimeCode;
