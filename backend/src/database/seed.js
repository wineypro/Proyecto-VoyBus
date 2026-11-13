const { sequelize, Role, Line, Stop, LineRoute, RouteStop } = require('../models');

// El seed es idempotente: se puede ejecutar varias veces sin duplicar datos.
async function seed() {
  for (const name of ['pasajero', 'conductor', 'administrador']) {
    await Role.findOrCreate({ where: { name } });
  }

  const linesData = [
    {
      code: 'L1',
      name: 'Línea 1 · Centro - Costanera',
      color: '#1B7F5C',
      status: 'active',
      origin: 'Plaza Colón',
      destination: 'Mall Costanera',
      isActive: true,
    },
    {
      code: 'L2',
      name: 'Línea 2 · Terminal - Universidad',
      color: '#F2994A',
      status: 'active',
      origin: 'Terminal Norte',
      destination: 'Campus UCN',
      isActive: true,
    },
    {
      code: 'L3',
      name: 'Línea 3 · Hospital - Plaza',
      color: '#2D9CDB',
      status: 'suspended',
      origin: 'Hospital Regional',
      destination: 'Plaza Sotomayor',
      isActive: true,
    },
  ];

  const linesByCode = {};
  for (const item of linesData) {
    const [line] = await Line.findOrCreate({ where: { code: item.code }, defaults: item });
    await line.update(item);
    linesByCode[item.code] = line;
  }

  // Catálogo inicial con 10 paraderos (validación de RED-02: al menos 10 paraderos).
  const stopsData = [
    { code: 'P01', name: 'Plaza Colón', latitude: -23.6464, longitude: -70.398 },
    { code: 'P02', name: 'Mercado Central', latitude: -23.6485, longitude: -70.3965 },
    { code: 'P03', name: 'Avenida Brasil', latitude: -23.6542, longitude: -70.4001 },
    { code: 'P04', name: 'Balneario Municipal', latitude: -23.665, longitude: -70.4045 },
    { code: 'P05', name: 'Mall Costanera', latitude: -23.6412, longitude: -70.3995 },
    { code: 'P06', name: 'Terminal Norte', latitude: -23.619, longitude: -70.3885 },
    { code: 'P07', name: 'Hospital Regional', latitude: -23.6355, longitude: -70.392 },
    { code: 'P08', name: 'Estadio Regional', latitude: -23.6695, longitude: -70.402 },
    { code: 'P09', name: 'Campus UCN', latitude: -23.6805, longitude: -70.4095 },
    { code: 'P10', name: 'Plaza Sotomayor', latitude: -23.6498, longitude: -70.395 },
  ];

  const stopsByCode = {};
  for (const item of stopsData) {
    const [stop] = await Stop.findOrCreate({ where: { code: item.code }, defaults: item });
    await stop.update(item);
    stopsByCode[item.code] = stop;
  }

  // Recorridos por sentido (Ida y Regreso) para cada línea
  const routesData = [
    {
      lineCode: 'L1',
      direction: 'Ida · Centro → Costanera',
      operatingDays: 'Lunes a Domingo',
      schedule: '06:00 - 22:30',
      origin: 'Plaza Colón',
      destination: 'Mall Costanera',
      stops: ['P01', 'P02', 'P03', 'P04', 'P05'],
    },
    {
      lineCode: 'L1',
      direction: 'Regreso · Costanera → Centro',
      operatingDays: 'Lunes a Domingo',
      schedule: '06:30 - 23:00',
      origin: 'Mall Costanera',
      destination: 'Plaza Colón',
      stops: ['P05', 'P04', 'P03', 'P02', 'P01'],
    },
    {
      lineCode: 'L2',
      direction: 'Ida · Terminal → Universidad',
      operatingDays: 'Lunes a Sábado',
      schedule: '06:15 - 22:00',
      origin: 'Terminal Norte',
      destination: 'Campus UCN',
      stops: ['P06', 'P07', 'P01', 'P08', 'P09'],
    },
    {
      lineCode: 'L2',
      direction: 'Regreso · Universidad → Terminal',
      operatingDays: 'Lunes a Sábado',
      schedule: '06:45 - 22:30',
      origin: 'Campus UCN',
      destination: 'Terminal Norte',
      stops: ['P09', 'P08', 'P01', 'P07', 'P06'],
    },
    {
      lineCode: 'L3',
      direction: 'Ida · Hospital → Plaza',
      operatingDays: 'Lunes a Viernes',
      schedule: '07:00 - 21:00',
      origin: 'Hospital Regional',
      destination: 'Plaza Sotomayor',
      stops: ['P07', 'P05', 'P02', 'P10'],
    },
    {
      lineCode: 'L3',
      direction: 'Regreso · Plaza → Hospital',
      operatingDays: 'Lunes a Viernes',
      schedule: '07:30 - 21:30',
      origin: 'Plaza Sotomayor',
      destination: 'Hospital Regional',
      stops: ['P10', 'P02', 'P05', 'P07'],
    },
  ];

  for (const r of routesData) {
    const line = linesByCode[r.lineCode];
    const [lineRoute] = await LineRoute.findOrCreate({
      where: { lineId: line.id, direction: r.direction },
      defaults: {
        lineId: line.id,
        direction: r.direction,
        operatingDays: r.operatingDays,
        schedule: r.schedule,
        origin: r.origin,
        destination: r.destination,
      },
    });

    await RouteStop.destroy({ where: { lineRouteId: lineRoute.id } });
    for (let i = 0; i < r.stops.length; i++) {
      const stop = stopsByCode[r.stops[i]];
      await RouteStop.create({
        lineRouteId: lineRoute.id,
        stopId: stop.id,
        sequence: i + 1,
      });
    }
  }

  console.log('Seed completado');
}

seed()
  .then(() => sequelize.close())
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });