const { z } = require('zod');

// Valida los parámetros de ruta de /lines/:id
const lineIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

module.exports = { lineIdParams };