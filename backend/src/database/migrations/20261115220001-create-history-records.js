const { DataTypes } = require('sequelize');

// ACC-07: historial personal. Regla del proyecto: una migración subida NUNCA se edita.
// Cada registro guarda una copia (snapshot) del nombre de la línea, del recorrido y del
// paradero. Así, si después se desactiva o se borra una línea o un paradero, el registro
// anterior se conserva intacto (lineId y stopId pasan a NULL, el texto queda).
module.exports = {
  async up({ context: qi }) {
    await qi.createTable('HistoryRecords', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      },
      lineId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Lines', key: 'id' },
        onDelete: 'SET NULL',
      },
      stopId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Stops', key: 'id' },
        onDelete: 'SET NULL',
      },
      lineCode: { type: DataTypes.STRING(10), allowNull: false },
      lineName: { type: DataTypes.STRING(100), allowNull: false },
      routeDirection: { type: DataTypes.STRING(100), allowNull: false },
      stopName: { type: DataTypes.STRING(100), allowNull: false },
      status: { type: DataTypes.STRING(20), allowNull: false },
      closeReason: { type: DataTypes.STRING(200), allowNull: false },
      occurredAt: { type: DataTypes.DATE, allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await qi.addIndex('HistoryRecords', ['userId', 'occurredAt']);
  },

  async down({ context: qi }) {
    await qi.dropTable('HistoryRecords');
  },
};
