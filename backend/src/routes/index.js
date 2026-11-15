// Archivo compartido: cada módulo agrega aquí su línea router.use(...)
const { Router } = require('express');
const { ok } = require('../utils/response');

const router = Router();

router.get('/health', (req, res) => ok(res, { status: 'ok' }));
router.use('/lines', require('./lines.routes'));
// router.use('/auth', require('./auth.routes'));       // Israel
router.use('/stops', require('./stops.routes'));
// router.use('/me', require('./me.routes'));           // compañero

module.exports = router;