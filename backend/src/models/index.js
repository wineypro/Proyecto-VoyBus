// Punto único de importación de modelos. Las asociaciones (hasMany, belongsTo...) van aquí.
// Archivo compartido: avisar antes de editarlo y subirlo rápido a dev.
const sequelize = require('../config/database');
const Role = require('./Role');
const Line = require('./Line');
const Stop = require('./Stop');
const LineRoute = require('./LineRoute');
const RouteStop = require('./RouteStop');

Line.hasMany(LineRoute, { foreignKey: 'lineId', as: 'routes' });
LineRoute.belongsTo(Line, { foreignKey: 'lineId', as: 'line' });

LineRoute.hasMany(RouteStop, { foreignKey: 'lineRouteId', as: 'routeStops' });
RouteStop.belongsTo(LineRoute, { foreignKey: 'lineRouteId', as: 'lineRoute' });

Stop.hasMany(RouteStop, { foreignKey: 'stopId', as: 'routeStops' });
RouteStop.belongsTo(Stop, { foreignKey: 'stopId', as: 'stop' });

module.exports = { sequelize, Role, Line, Stop, LineRoute, RouteStop };