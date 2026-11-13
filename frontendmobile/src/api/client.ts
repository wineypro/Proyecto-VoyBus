import { API_PREFIX, API_URL, REQUEST_TIMEOUT_MS } from './config';

// Error que el resto de la app puede reconocer y mostrar.
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

// El token de sesión se guarda aquí en memoria. Israel lo conecta con
// SecureStore cuando implemente el inicio de sesión (ACC-02).
let sessionToken: string | null = null;
export const setSessionToken = (token: string | null) => {
  sessionToken = token;
};

type Options = { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown };

// ÚNICO lugar donde se hace fetch. Todas las funciones de src/api/ usan esta.
// Devuelve directamente el campo "data" de la respuesta { data, meta }.
export async function request<T>(path: string, options: Options = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_URL}${API_PREFIX}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const e = json?.error;
      throw new ApiError(res.status, e?.code ?? 'UNKNOWN', e?.message ?? 'Error inesperado', e?.details);
    }
    return json.data as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(0, 'SERVER_UNAVAILABLE', 'No se pudo conectar con el servidor');
  } finally {
    clearTimeout(timer);
  }
}