const { z } = require('zod');

// Alias (ACC-05): único, sin espacios y de hasta 15 caracteres alfanuméricos.
const aliasSchema = z
  .string()
  .trim()
  .max(15, 'El alias puede tener hasta 15 caracteres')
  .regex(/^[A-Za-z0-9]*$/, 'El alias solo puede contener letras y números sin espacios')
  .optional()
  .nullable();

const updateProfileBody = z.object({
  name: z.string().trim().min(2, 'El nombre visible es obligatorio').max(80).optional(),
  alias: aliasSchema,
  photoUrl: z.string().trim().max(255, 'La URL de la foto es demasiado larga').optional().nullable(),
  email: z.string().trim().toLowerCase().pipe(z.email('El correo no es válido')).optional(),
});

const verifyNewEmailBody = z.object({
  code: z.string().trim().regex(/^[0-9]{6}$/, 'El código debe tener 6 dígitos'),
});

const favoriteIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

module.exports = {
  updateProfileBody,
  verifyNewEmailBody,
  favoriteIdParams,
};