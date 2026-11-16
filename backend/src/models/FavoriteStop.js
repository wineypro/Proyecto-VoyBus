const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FavoriteStop = sequelize.define('FavoriteStop', {
  userId: { type: DataTypes.INTEGER, allowNull: false },
  stopId: { type: DataTypes.INTEGER, allowNull: false },
});

module.exports = FavoriteStop;