import { ApiError, request } from './client';

// Usuario tal como lo entrega el backend (sin datos sensibles).
export type User = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  alias: string | null;
  photoUrl: string | null;
  createdAt: string;
};

export type LoginResult = { token: string; expiresAt: string; user: User };

export type RegisterInput = {
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  acceptPrivacy: boolean;
};

export const login = (email: string, password: string) =>
  request<LoginResult>('/auth/login', { method: 'POST', body: { email, password } });

export const getMe = () => request<User>('/auth/me');

export const logout = () => request<{ loggedOut: boolean }>('/auth/logout', { method: 'POST' });

export const register = (input: RegisterInput) =>
  request<User>('/auth/register', { method: 'POST', body: input });

export const verifyEmail = (email: string, code: string) =>
  request<User>('/auth/verify-email', { method: 'POST', body: { email, code } });

export const resendCode = (email: string) =>
  request<{ sent: boolean }>('/auth/resend-code', { method: 'POST', body: { email } });

export const forgotPassword = (email: string) =>
  request<{ sent: boolean }>('/auth/forgot-password', { method: 'POST', body: { email } });

export const resetPassword = (input: {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}) => request<{ updated: boolean }>('/auth/reset-password', { method: 'POST', body: input });

export const changePassword = (input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) => request<{ updated: boolean }>('/auth/change-password', { method: 'POST', body: input });

// Convierte cualquier error en un texto para mostrar en pantalla. Si el backend devolvió
// errores de validación por campo, se muestran todos los mensajes.
export function describeError(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.code === 'VALIDATION_ERROR' && Array.isArray(e.details)) {
      const messages = (e.details as { message?: string }[])
        .map((d) => d.message)
        .filter((m): m is string => Boolean(m));
      if (messages.length) return messages.join('\n');
    }
    return e.message;
  }
  return e instanceof Error ? e.message : 'Error inesperado';
}
