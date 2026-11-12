require('dotenv').config();

module.exports = {
  port: Number(process.env.PORT) || 3000,
  dbPath: process.env.DB_PATH || './database.sqlite',
};