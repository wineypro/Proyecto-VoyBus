const { z } = require('zod');

const code = z.string().trim().regex(/^[0-9]{6}$/, 'El código debe tener 6 dígitos');

const loginStepBody = z.object({
  challengeToken: z.string().min(1, 'Falta el desafío de inicio de sesión'),
  code,
});

const enableBody = z.object({ code });

const disableBody = z.object({
  password: z.string().min(1, 'Ingresa tu contraseña'),
  code,
});

module.exports = { loginStepBody, enableBody, disableBody };
