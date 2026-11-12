// Punto único de importación de modelos. Las asociaciones (hasMany, belongsTo...) van aquí.
// Archivo compartido: avisar antes de editarlo y subirlo rápido a dev.
const sequelize = require('../config/database');
const Role = require('./Role');

module.exports = { sequelize, Role };