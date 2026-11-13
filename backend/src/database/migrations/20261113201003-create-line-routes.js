const { DataTypes } = require('sequelize');

module.exports = {
  async up({ context: qi }) {
    await qi.createTable('LineRoutes', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      lineId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Lines', key: 'id' },
        onDelete: 'CASCADE',
      },
      direction: { type: DataTypes.STRING(60), allowNull: false },
      operatingDays: { type: DataTypes.STRING(100), allowNull: false },
      schedule: { type: DataTypes.STRING(100), allowNull: false },
      origin: { type: DataTypes.STRING(100), allowNull: false },
      destination: { type: DataTypes.STRING(100), allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
  },
  async down({ context: qi }) {
    await qi.dropTable('LineRoutes');
  },
};