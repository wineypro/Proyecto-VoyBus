const { DataTypes } = require('sequelize');

// Regla: una migración subida NUNCA se edita; si hay que cambiar algo, se crea otra nueva.
module.exports = {
  async up({ context: qi }) {
    await qi.createTable('OneTimeCodes', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      },
      // Para qué sirve el código: 'verify_email', 'login_2fa', 'reset_password'...
      purpose: { type: DataTypes.STRING(30), allowNull: false },
      // Se guarda un hash del código, nunca el código.
      codeHash: { type: DataTypes.STRING(64), allowNull: false },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      usedAt: { type: DataTypes.DATE, allowNull: true },
      attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
  },
  async down({ context: qi }) {
    await qi.dropTable('OneTimeCodes');
  },
};
