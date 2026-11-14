const { z } = require('zod');

// Valida los parámetros de ruta de /stops/:id
const stopIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

module.exports = { stopIdParams };