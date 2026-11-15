const { DataTypes } = require('sequelize');

// Regla: una migración subida NUNCA se edita; si hay que cambiar algo, se crea otra nueva.
module.exports = {
  async up({ context: qi }) {
    await qi.createTable('Sessions', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      },
      // Se guarda el hash del token, nunca el token: si se filtra la base, no sirve para entrar.
      tokenHash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      revokedAt: { type: DataTypes.DATE, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
  },
  async down({ context: qi }) {
    await qi.dropTable('Sessions');
  },
};
