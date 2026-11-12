// Archivo compartido: cada módulo agrega aquí su línea router.use(...)
const { Router } = require('express');
const { ok } = require('../utils/response');

const router = Router();

router.get('/health', (req, res) => ok(res, { status: 'ok' }));

module.exports = router;