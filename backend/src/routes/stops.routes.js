const { Router } = require('express');
const controller = require('../controllers/stops.controller');
const validate = require('../middlewares/validate');
const { stopIdParams } = require('../validators/stops.validators');

const router = Router();

// Express 5 captura solo los errores de funciones async: no hace falta try/catch.
router.get('/', controller.list);
router.get('/:id', validate(stopIdParams, 'params'), controller.detail);

module.exports = router;