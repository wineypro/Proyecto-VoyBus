const path = require('path');
const { Umzug, SequelizeStorage } = require('umzug');
const sequelize = require('../config/database');

// El glob exige "/" como separador, también en Windows
const migrationsGlob = path.join(__dirname, 'migrations', '*.js').replace(/\\/g, '/');

const umzug = new Umzug({
  migrations: { glob: migrationsGlob },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

async function main() {
  const command = process.argv[2];

  // Si no hay ninguna migración (ni pendiente ni ejecutada), algo está mal con la ruta
  const total = (await umzug.pending()).length + (await umzug.executed()).length;
  if (total === 0) {
    throw new Error(`No se encontraron migraciones en: ${migrationsGlob}`);
  }

  if (command === 'up') {
    await umzug.up();
  } else if (command === 'down') {
    await umzug.down(); // deshace solo la última
  } else if (command === 'reset') {
    await umzug.down({ to: 0 }); // deshace todas
    await umzug.up();
  } else {
    console.log('Uso: node src/database/migrate.js up|down|reset');
  }
  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});