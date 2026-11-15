const { DataTypes } = require('sequelize');

// Regla: una migración subida NUNCA se edita; se crea esta nueva para ACC-05 (correo pendiente y favoritos).
module.exports = {
  async up({ context: qi }) {
    await qi.addColumn('Users', 'pendingEmail', {
      type: DataTypes.STRING(120),
      allowNull: true,
    });

    await qi.createTable('FavoriteLines', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      },
      lineId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Lines', key: 'id' },
        onDelete: 'CASCADE',
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    await qi.createTable('FavoriteStops', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      },
      stopId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Stops', key: 'id' },
        onDelete: 'CASCADE',
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
  },

  async down({ context: qi }) {
    await qi.dropTable('FavoriteStops');
    await qi.dropTable('FavoriteLines');
    await qi.removeColumn('Users', 'pendingEmail');
  },
};