const { Router } = require('express');
const controller = require('../controllers/auth.controller');
const preferences = require('../controllers/preferences.controller');
const twoFactor = require('../controllers/twofactor.controller');
const validate = require('../middlewares/validate');
const { requireAuth } = require('../middlewares/auth');
const { updatePreferencesBody } = require('../validators/preferences.validators');
const { loginStepBody, enableBody, disableBody } = require('../validators/twofactor.validators');
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

// Verificación en dos pasos con app autenticadora (ACC-01 / ACC-02)
router.post('/login/2fa', validate(loginStepBody, 'body'), twoFactor.loginStep);
router.post('/2fa/setup', requireAuth, twoFactor.setup);
router.post('/2fa/enable', requireAuth, validate(enableBody, 'body'), twoFactor.enable);
router.post('/2fa/disable', requireAuth, validate(disableBody, 'body'), twoFactor.disable);

// Preferencias de la cuenta (ACC-06)
router.get('/preferences', requireAuth, preferences.get);
router.patch('/preferences', requireAuth, validate(updatePreferencesBody, 'body'), preferences.update);

module.exports = router;
