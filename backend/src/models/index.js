// Punto único de importación de modelos. Las asociaciones (hasMany, belongsTo...) van aquí.
// Archivo compartido: avisar antes de editarlo y subirlo rápido a dev.
const sequelize = require('../config/database');
const Role = require('./Role');
const Line = require('./Line');

// Ejemplo de cómo se declara una asociación (cuando existan los modelos):
// User.belongsTo(Role, { foreignKey: 'roleId' });
// Role.hasMany(User, { foreignKey: 'roleId' });

module.exports = { sequelize, Role, Line };