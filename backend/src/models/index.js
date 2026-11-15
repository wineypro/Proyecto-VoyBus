// Punto único de importación de modelos. Las asociaciones (hasMany, belongsTo...) van aquí.
// Archivo compartido: avisar antes de editarlo y subirlo rápido a dev.
const sequelize = require('../config/database');
const Role = require('./Role');
const Line = require('./Line');
const Stop = require('./Stop');
const LineRoute = require('./LineRoute');
const RouteStop = require('./RouteStop');
const User = require('./User');
const Session = require('./Session');
const OneTimeCode = require('./OneTimeCode');

Line.hasMany(LineRoute, { foreignKey: 'lineId', as: 'routes' });
LineRoute.belongsTo(Line, { foreignKey: 'lineId', as: 'line' });

LineRoute.hasMany(RouteStop, { foreignKey: 'lineRouteId', as: 'routeStops' });
RouteStop.belongsTo(LineRoute, { foreignKey: 'lineRouteId', as: 'lineRoute' });

Stop.hasMany(RouteStop, { foreignKey: 'stopId', as: 'routeStops' });
RouteStop.belongsTo(Stop, { foreignKey: 'stopId', as: 'stop' });

Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });

User.hasMany(Session, { foreignKey: 'userId', as: 'sessions' });
Session.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(OneTimeCode, { foreignKey: 'userId', as: 'codes' });
OneTimeCode.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  Role,
  Line,
  Stop,
  LineRoute,
  RouteStop,
  User,
  Session,
  OneTimeCode,
};