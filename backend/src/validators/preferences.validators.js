const { z } = require('zod');

// Solo se aceptan opciones que la app soporta; cualquier otra cosa se rechaza (strict).
const bool = z.boolean({ error: 'Debe ser verdadero o falso' });

const updatePreferencesBody = z
  .object({
    language: z.enum(['es'], { error: 'Idioma no disponible' }).optional(),
    theme: z.enum(['light', 'dark', 'system'], { error: 'Tema no válido' }).optional(),
    notifications: z
      .object({
        serviceAlerts: bool.optional(),
        favoriteLines: bool.optional(),
        tips: bool.optional(),
      })
      .strict()
      .optional(),
    privacy: z
      .object({
        showRecentActivity: bool.optional(),
        allowAnalytics: bool.optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, { message: 'No hay cambios para guardar' });

module.exports = { updatePreferencesBody };
