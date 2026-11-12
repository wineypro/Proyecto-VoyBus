const { Router } = require('express');
const controller = require('../controllers/lines.controller');
const validate = require('../middlewares/validate');
const { lineIdParams } = require('../validators/lines.validators');

const router = Router();

// Express 5 captura solo los errores de funciones async: no hace falta try/catch.
router.get('/', controller.list);
router.get('/:id', validate(lineIdParams, 'params'), controller.detail);

module.exports = router;