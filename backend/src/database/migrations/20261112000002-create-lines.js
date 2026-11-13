const { DataTypes } = require('sequelize');

module.exports = {
  async up({ context: qi }) {
    await qi.createTable('Lines', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      code: { type: DataTypes.STRING(10), allowNull: false, unique: true },
      name: { type: DataTypes.STRING(100), allowNull: false },
      color: { type: DataTypes.STRING(7), allowNull: false, defaultValue: '#1B7F5C' },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
  },
  async down({ context: qi }) {
    await qi.dropTable('Lines');
  },
};