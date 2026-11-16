// Capa de controladores: traduce HTTP ↔ servicios. Sin lógica de negocio.
const meService = require('../services/me.service');
const { ok } = require('../utils/response');

async function getProfile(req, res) {
  const profile = await meService.getProfile(req.auth.user, req.auth.role);
  ok(res, profile);
}

async function updateProfile(req, res) {
  const { profile, emailVerification } = await meService.updateProfile(
    req.auth.user,
    req.auth.role,
    req.valid.body,
  );
  ok(res, profile, emailVerification ? { emailVerification } : {});
}

async function verifyNewEmail(req, res) {
  const profile = await meService.confirmNewEmail(
    req.auth.user,
    req.auth.role,
    req.valid.body.code,
  );
  ok(res, profile);
}

async function listFavorites(req, res) {
  const favorites = await meService.getFavoritesForUser(req.auth.user.id);
  ok(res, favorites);
}

async function addFavoriteLine(req, res) {
  const favorites = await meService.addFavoriteLine(req.auth.user.id, req.valid.params.id);
  ok(res, favorites, {}, 201);
}

async function removeFavoriteLine(req, res) {
  const favorites = await meService.removeFavoriteLine(req.auth.user.id, req.valid.params.id);
  ok(res, favorites);
}

async function addFavoriteStop(req, res) {
  const favorites = await meService.addFavoriteStop(req.auth.user.id, req.valid.params.id);
  ok(res, favorites, {}, 201);
}

async function removeFavoriteStop(req, res) {
  const favorites = await meService.removeFavoriteStop(req.auth.user.id, req.valid.params.id);
  ok(res, favorites);
}

async function listHistory(req, res) {
  const result = await meService.getHistory(req.auth.user.id, {
    date: req.query.date,
    lineId: req.query.lineId,
  });
  ok(res, result.items, { total: result.items.length, filters: result.filters });
}

module.exports = {
  getProfile,
  updateProfile,
  verifyNewEmail,
  listFavorites,
  addFavoriteLine,
  removeFavoriteLine,
  addFavoriteStop,
  removeFavoriteStop,
  listHistory,
};