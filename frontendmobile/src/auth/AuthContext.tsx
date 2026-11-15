import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import * as authApi from '@/api/auth';
import type { User } from '@/api/auth';
import { ApiError, setSessionToken } from '@/api/client';

const TOKEN_KEY = 'voybus_session_token';

type AuthState = {
  user: User | null;
  // true mientras se revisa si quedó una sesión guardada en el teléfono
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

// El token se guarda en el almacenamiento seguro del teléfono (Keychain / Keystore).
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Al abrir la app: si hay un token guardado, se valida con el backend.
  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(TOKEN_KEY);
        if (saved) {
          setSessionToken(saved);
          try {
            setUser(await authApi.getMe());
          } catch (e) {
            setSessionToken(null);
            // Token vencido o revocado: se borra. Si solo falló la conexión, se conserva.
            if (e instanceof ApiError && e.status !== 0) {
              await SecureStore.deleteItemAsync(TOKEN_KEY);
            }
          }
        }
      } catch {
        // Si el almacenamiento falla, la app simplemente parte sin sesión.
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    setSessionToken(result.token);
    await SecureStore.setItemAsync(TOKEN_KEY, result.token);
    setUser(result.user);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Aunque el servidor no responda, la sesión se cierra en este teléfono.
    }
    setSessionToken(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, signIn, signOut }), [user, loading, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
