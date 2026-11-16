const { DataTypes } = require('sequelize');

// Regla: una migración subida NUNCA se edita; si hay que cambiar algo, se crea otra nueva.
module.exports = {
  async up({ context: qi }) {
    await qi.createTable('Users', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(80), allowNull: false },
      email: { type: DataTypes.STRING(120), allowNull: false, unique: true },
      phone: { type: DataTypes.STRING(20), allowNull: true, unique: true },
      passwordHash: { type: DataTypes.STRING(200), allowNull: false },
      roleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Roles', key: 'id' },
      },
      // 'pending' = registrada pero sin verificar · 'active' · 'disabled'
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'pending' },
      emailVerifiedAt: { type: DataTypes.DATE, allowNull: true },
      privacyAcceptedAt: { type: DataTypes.DATE, allowNull: true },
      failedLoginAttempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      lockedUntil: { type: DataTypes.DATE, allowNull: true },
      // Campos para el perfil (ACC-05) y las preferencias (ACC-06)
      alias: { type: DataTypes.STRING(15), allowNull: true, unique: true },
      photoUrl: { type: DataTypes.STRING(255), allowNull: true },
      preferences: { type: DataTypes.JSON, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
  },
  async down({ context: qi }) {
    await qi.dropTable('Users');
  },
};