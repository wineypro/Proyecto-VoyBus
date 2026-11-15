const { Router } = require('express');
const controller = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const { requireAuth } = require('../middlewares/auth');
const { registerBody, loginBody, verifyEmailBody } = require('../validators/auth.validators');

const router = Router();

// Express 5 captura solo los errores de funciones async: no hace falta try/catch.
router.post('/register', validate(registerBody, 'body'), controller.register);
router.post('/verify-email', validate(verifyEmailBody, 'body'), controller.verifyEmail);
router.post('/login', validate(loginBody, 'body'), controller.login);
router.get('/me', requireAuth, controller.me);
router.post('/logout', requireAuth, controller.logout);

module.exports = router;
