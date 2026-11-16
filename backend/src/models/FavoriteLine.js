const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FavoriteLine = sequelize.define('FavoriteLine', {
  userId: { type: DataTypes.INTEGER, allowNull: false },
  lineId: { type: DataTypes.INTEGER, allowNull: false },
});

module.exports = FavoriteLine;