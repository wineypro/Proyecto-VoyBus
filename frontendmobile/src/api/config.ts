// Única fuente de la dirección del backend. Se define en el archivo .env (ver .env.example).
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
export const API_PREFIX = '/api/v1';
export const REQUEST_TIMEOUT_MS = 10000;