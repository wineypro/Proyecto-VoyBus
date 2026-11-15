const { Router } = require('express');
const controller = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const { requireAuth } = require('../middlewares/auth');
const {
  registerBody,
  loginBody,
  verifyEmailBody,
  resendCodeBody,
  forgotPasswordBody,
  resetPasswordBody,
  changePasswordBody,
} = require('../validators/auth.validators');

const router = Router();

// Express 5 captura solo los errores de funciones async: no hace falta try/catch.
router.post('/register', validate(registerBody, 'body'), controller.register);
router.post('/verify-email', validate(verifyEmailBody, 'body'), controller.verifyEmail);
router.post('/resend-code', validate(resendCodeBody, 'body'), controller.resendCode);
router.post('/forgot-password', validate(forgotPasswordBody, 'body'), controller.forgotPassword);
router.post('/reset-password', validate(resetPasswordBody, 'body'), controller.resetPassword);
router.post('/login', validate(loginBody, 'body'), controller.login);
router.get('/me', requireAuth, controller.me);
router.post('/logout', requireAuth, controller.logout);
router.post('/change-password', requireAuth, validate(changePasswordBody, 'body'), controller.changePassword);

module.exports = router;
