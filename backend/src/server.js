const app = require('./app');
const { port } = require('./config/env');
const { sequelize } = require('./models');

async function start() {
  await sequelize.authenticate();
  console.log('Base de datos conectada');
  app.listen(port, '0.0.0.0', () => {
    console.log(`VoyBus API en http://localhost:${port}`);
  });
}

start().catch((err) => {
  console.error('No se pudo iniciar el servidor', err);
  process.exit(1);
});