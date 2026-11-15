// Guarda en MEMORIA (nunca en disco) las credenciales recién registradas, solo el tiempo que dura
// el registro, para poder abrir sesión al verificar el correo y ofrecer activar el 2FA.
// Se borra apenas se usa, y desaparece si se cierra la app.
let draft: { email: string; password: string } | null = null;

export function setRegistrationDraft(email: string, password: string) {
  draft = { email, password };
}

// Entrega la contraseña solo si el correo coincide, y siempre borra lo guardado.
export function takeRegistrationDraft(email: string): string | null {
  const current = draft;
  draft = null;
  return current && current.email === email ? current.password : null;
}
