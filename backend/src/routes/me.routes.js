const { Router } = require('express');
const controller = require('../controllers/me.controller');
const validate = require('../middlewares/validate');
const { requireAuth } = require('../middlewares/auth');
const {
  updateProfileBody,
  verifyNewEmailBody,
  favoriteIdParams,
} = require('../validators/me.validators');

const router = Router();

// Todas las rutas de /me requieren sesión iniciada (requireAuth).
router.use(requireAuth);

router.get('/', controller.getProfile);
router.patch('/', validate(updateProfileBody, 'body'), controller.updateProfile);
router.post('/verify-email', validate(verifyNewEmailBody, 'body'), controller.verifyNewEmail);

router.get('/favorites', controller.listFavorites);
router.post('/favorites/lines/:id', validate(favoriteIdParams, 'params'), controller.addFavoriteLine);
router.delete('/favorites/lines/:id', validate(favoriteIdParams, 'params'), controller.removeFavoriteLine);
router.post('/favorites/stops/:id', validate(favoriteIdParams, 'params'), controller.addFavoriteStop);
router.delete('/favorites/stops/:id', validate(favoriteIdParams, 'params'), controller.removeFavoriteStop);

router.get('/history', controller.listHistory);

module.exports = router;