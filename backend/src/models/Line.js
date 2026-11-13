const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Line = sequelize.define('Line', {
  code: { type: DataTypes.STRING(10), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  color: { type: DataTypes.STRING(7), allowNull: false, defaultValue: '#1B7F5C' },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
});

module.exports = Line;