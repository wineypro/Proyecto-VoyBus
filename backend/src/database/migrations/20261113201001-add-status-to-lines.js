const { DataTypes } = require('sequelize');

// Agrega estado del servicio ('active' | 'suspended') e inicio/término a Lines sin tocar la migración original.
module.exports = {
  async up({ context: qi }) {
    await qi.addColumn('Lines', 'status', {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
    });
    await qi.addColumn('Lines', 'origin', {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: '',
    });
    await qi.addColumn('Lines', 'destination', {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: '',
    });
  },
  async down({ context: qi }) {
    await qi.removeColumn('Lines', 'destination');
    await qi.removeColumn('Lines', 'origin');
    await qi.removeColumn('Lines', 'status');
  },
};