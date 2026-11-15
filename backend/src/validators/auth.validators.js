const { z } = require('zod');

// Contraseña (ACC-01): 8 a 15 caracteres con mayúscula, minúscula, número y símbolo.
const password = z
  .string()
  .min(8, 'La contraseña debe tener entre 8 y 15 caracteres')
  .max(15, 'La contraseña debe tener entre 8 y 15 caracteres')
  .regex(/[a-z]/, 'La contraseña debe incluir una minúscula')
  .regex(/[A-Z]/, 'La contraseña debe incluir una mayúscula')
  .regex(/[0-9]/, 'La contraseña debe incluir un número')
  .regex(/[^A-Za-z0-9]/, 'La contraseña debe incluir un símbolo');

// Teléfono opcional: se aceptan espacios, guiones y "+" al escribirlo, pero se guarda solo con
// dígitos para que "+56 9 1234-5678" y "56912345678" cuenten como el mismo número.
const phone = z
  .string()
  .transform((value) => value.replace(/[\s-]/g, '').replace(/^\+/, ''))
  .pipe(z.string().regex(/^[0-9]{8,15}$/, 'El teléfono no es válido'))
  .optional();

// El rol NO se recibe: el registro público siempre crea cuentas de pasajero.
const registerBody = z
  .object({
    name: z.string().trim().min(2, 'El nombre es obligatorio').max(80),
    email: z.string().trim().toLowerCase().pipe(z.email('El correo no es válido')),
    phone,
    password,
    confirmPassword: z.string(),
    acceptPrivacy: z.literal(true, { error: 'Debes aceptar los términos de privacidad' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden',
  });

module.exports = { registerBody };