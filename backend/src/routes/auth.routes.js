const { Router } = require('express');
const controller = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const { registerBody } = require('../validators/auth.validators');

const router = Router();

// Express 5 captura solo los errores de funciones async: no hace falta try/catch.
router.post('/register', validate(registerBody, 'body'), controller.register);

module.exports = router;