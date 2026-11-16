const { Sequelize } = require('sequelize');
const { dbPath } = require('./env');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false,
});

// Activa las llaves foráneas y el modo WAL en SQLite
sequelize.afterConnect(async (connection) => {
  await new Promise((resolve) => connection.run('PRAGMA foreign_keys = ON', resolve));
  await new Promise((resolve) => connection.run('PRAGMA journal_mode = WAL', resolve));
});

module.exports = sequelize;