const { DataTypes } = require('sequelize');

module.exports = {
  async up({ context: qi }) {
    await qi.createTable('RouteStops', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      lineRouteId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'LineRoutes', key: 'id' },
        onDelete: 'CASCADE',
      },
      stopId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Stops', key: 'id' },
        onDelete: 'CASCADE',
      },
      sequence: { type: DataTypes.INTEGER, allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
  },
  async down({ context: qi }) {
    await qi.dropTable('RouteStops');
  },
};