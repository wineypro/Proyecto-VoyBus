const path = require('path');
const { Umzug, SequelizeStorage } = require('umzug');
const sequelize = require('../config/database');

const umzug = new Umzug({
  migrations: { glob: path.join(__dirname, 'migrations', '*.js') },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

async function main() {
  const command = process.argv[2];
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