const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  name: { type: DataTypes.STRING(80), allowNull: false },
  email: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  phone: { type: DataTypes.STRING(20), allowNull: true, unique: true },
  passwordHash: { type: DataTypes.STRING(200), allowNull: false },
  roleId: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'pending' },
  emailVerifiedAt: { type: DataTypes.DATE, allowNull: true },
  privacyAcceptedAt: { type: DataTypes.DATE, allowNull: true },
  failedLoginAttempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  lockedUntil: { type: DataTypes.DATE, allowNull: true },
  alias: { type: DataTypes.STRING(15), allowNull: true, unique: true },
  photoUrl: { type: DataTypes.STRING(255), allowNull: true },
  pendingEmail: { type: DataTypes.STRING(120), allowNull: true },
  preferences: { type: DataTypes.JSON, allowNull: true },
});

module.exports = User;