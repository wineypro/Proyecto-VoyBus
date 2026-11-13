const { sequelize, Role, Line } = require('../models');

// El seed es idempotente: se puede ejecutar varias veces sin duplicar datos.
async function seed() {
  for (const name of ['pasajero', 'conductor', 'administrador']) {
    await Role.findOrCreate({ where: { name } });
  }

  const lines = [
    { code: 'L1', name: 'Línea 1 · Centro - Costanera', color: '#1B7F5C' },
    { code: 'L2', name: 'Línea 2 · Terminal - Universidad', color: '#F2994A' },
    { code: 'L3', name: 'Línea 3 · Hospital - Plaza', color: '#2D9CDB' },
  ];
  for (const line of lines) {
    await Line.findOrCreate({ where: { code: line.code }, defaults: line });
  }

  console.log('Seed completado');
}

seed()
  .then(() => sequelize.close())
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });