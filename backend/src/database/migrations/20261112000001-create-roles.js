const { DataTypes } = require('sequelize');

// Regla: una migración subida NUNCA se edita; si hay que cambiar algo, se crea otra nueva.
module.exports = {
  async up({ context: qi }) {
    await qi.createTable('Roles', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(30), allowNull: false, unique: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
  },
  async down({ context: qi }) {
    await qi.dropTable('Roles');
  },
};