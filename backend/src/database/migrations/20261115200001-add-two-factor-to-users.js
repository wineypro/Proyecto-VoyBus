const { DataTypes } = require('sequelize');

// Verificación en dos pasos con app autenticadora (ACC-01 / ACC-02).
// La clave secreta se guarda cifrada; "twoFactorLastStep" evita que un mismo código se use dos veces.
module.exports = {
  async up({ context: qi }) {
    await qi.addColumn('Users', 'twoFactorEnabled', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await qi.addColumn('Users', 'twoFactorSecret', { type: DataTypes.TEXT, allowNull: true });
    await qi.addColumn('Users', 'twoFactorLastStep', { type: DataTypes.INTEGER, allowNull: true });
  },

  async down({ context: qi }) {
    await qi.removeColumn('Users', 'twoFactorLastStep');
    await qi.removeColumn('Users', 'twoFactorSecret');
    await qi.removeColumn('Users', 'twoFactorEnabled');
  },
};
