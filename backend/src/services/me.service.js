// Capa de servicios: lógica de negocio de perfil, favoritos (ACC-05) e historial (ACC-07).
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User, Line, Stop, FavoriteLine, FavoriteStop } = require('../models');
const AppError = require('../utils/AppError');
const { toPublicUser, verificationCode } = require('./auth.service');

async function getFavoritesForUser(userId) {
  const [favLines, favStops] = await Promise.all([
    FavoriteLine.findAll({
      where: { userId },
      include: [{ model: Line, as: 'line' }],
      order: [['id', 'ASC']],
    }),
    FavoriteStop.findAll({
      where: { userId },
      include: [{ model: Stop, as: 'stop' }],
      order: [['id', 'ASC']],
    }),
  ]);

  return {
    lines: favLines
      .filter((fl) => fl.line && fl.line.isActive)
      .map((fl) => ({
        id: fl.line.id,
        code: fl.line.code,
        name: fl.line.name,
        color: fl.line.color,
        status: fl.line.status,
        origin: fl.line.origin,
        destination: fl.line.destination,
      })),
    stops: favStops
      .filter((fs) => fs.stop && fs.stop.isActive)
      .map((fs) => ({
        id: fs.stop.id,
        code: fs.stop.code,
        name: fs.stop.name,
        latitude: fs.stop.latitude,
        longitude: fs.stop.longitude,
      })),
  };
}

async function getProfile(user, roleName) {
  const favorites = await getFavoritesForUser(user.id);
  return {
    ...toPublicUser(user, roleName),
    pendingEmail: user.pendingEmail ?? null,
    favorites,
  };
}

async function updateProfile(user, roleName, payload) {
  const updates = {};
  let emailVerification = null;

  if (payload.name !== undefined) {
    updates.name = payload.name;
  }

  if (payload.alias !== undefined) {
    const cleanAlias = payload.alias ? payload.alias.trim() : null;
    if (cleanAlias) {
      const existingAlias = await User.findOne({
        where: { alias: cleanAlias, id: { [Op.ne]: user.id } },
      });
      if (existingAlias) {
        throw new AppError(409, 'ALIAS_ALREADY_IN_USE', 'Ese alias ya está en uso por otra cuenta');
      }
    }
    updates.alias = cleanAlias;
  }

  if (payload.photoUrl !== undefined) {
    updates.photoUrl = payload.photoUrl ? payload.photoUrl.trim() : null;
  }

  // Validación ACC-05: Un nuevo correo deberá verificarse antes de reemplazar al anterior.
  if (payload.email !== undefined && payload.email !== user.email) {
    const existingEmail = await User.findOne({
      where: { email: payload.email, id: { [Op.ne]: user.id } },
    });
    if (existingEmail) {
      throw new AppError(409, 'EMAIL_ALREADY_REGISTERED', 'Ya existe una cuenta con ese correo');
    }
    updates.pendingEmail = payload.email;
    emailVerification = {
      simulated: true,
      pendingEmail: payload.email,
      code: verificationCode(payload.email),
    };
  }

  await user.update(updates);
  const profile = await getProfile(user, roleName);

  return { profile, emailVerification };
}

async function confirmNewEmail(user, roleName, code) {
  if (!user.pendingEmail) {
    throw new AppError(400, 'NO_PENDING_EMAIL', 'No hay un cambio de correo pendiente de verificar');
  }

  const expected = Buffer.from(verificationCode(user.pendingEmail));
  const received = Buffer.from(code);
  const valid =
    expected.length === received.length && crypto.timingSafeEqual(expected, received);

  if (!valid) {
    throw new AppError(400, 'INVALID_CODE', 'El código de verificación no es válido');
  }

  await user.update({
    email: user.pendingEmail,
    pendingEmail: null,
    emailVerifiedAt: new Date(),
  });

  return getProfile(user, roleName);
}

async function addFavoriteLine(userId, lineId) {
  const line = await Line.findByPk(lineId);
  if (!line || !line.isActive) {
    throw new AppError(404, 'LINE_NOT_FOUND', 'La línea no existe');
  }
  await FavoriteLine.findOrCreate({ where: { userId, lineId } });
  return getFavoritesForUser(userId);
}

async function removeFavoriteLine(userId, lineId) {
  await FavoriteLine.destroy({ where: { userId, lineId } });
  return getFavoritesForUser(userId);
}

async function addFavoriteStop(userId, stopId) {
  const stop = await Stop.findByPk(stopId);
  if (!stop || !stop.isActive) {
    throw new AppError(404, 'STOP_NOT_FOUND', 'El paradero no existe');
  }
  await FavoriteStop.findOrCreate({ where: { userId, stopId } });
  return getFavoritesForUser(userId);
}

async function removeFavoriteStop(userId, stopId) {
  await FavoriteStop.destroy({ where: { userId, stopId } });
  return getFavoritesForUser(userId);
}

// ACC-07: Historial personal. Según la sección 7 de la guía, se entrega con estado vacío
// porque aún no hay viajes, soportando los filtros por fecha y línea.
async function getHistory(userId, filters = {}) {
  return {
    items: [],
    filters: {
      date: filters.date ?? null,
      lineId: filters.lineId ? Number(filters.lineId) : null,
    },
  };
}

module.exports = {
  getProfile,
  updateProfile,
  confirmNewEmail,
  getFavoritesForUser,
  addFavoriteLine,
  removeFavoriteLine,
  addFavoriteStop,
  removeFavoriteStop,
  getHistory,
};