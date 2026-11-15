import { request } from './client';

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
