import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import * as authApi from '@/api/auth';
import type { User } from '@/api/auth';
import { ApiError, setSessionToken } from '@/api/client';

import { clearToken, loadToken, saveToken } from './tokenStorage';

// Resultado del login: o ya hay sesión, o falta el código de la app autenticadora.
export type SignInResult = { status: 'ok' } | { status: 'two-factor'; challengeToken: string };

type AuthState = {
  user: User | null;
  // true mientras se revisa si quedó una sesión guardada en el teléfono
  loading: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  completeTwoFactor: (challengeToken: string, code: string) => Promise<void>;
  refreshUser: () => Promise<void>;
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
        const saved = await loadToken();
        if (saved) {
          setSessionToken(saved);
          try {
            setUser(await authApi.getMe());
          } catch (e) {
            setSessionToken(null);
            // Token vencido o revocado: se borra. Si solo falló la conexión, se conserva.
            if (e instanceof ApiError && e.status !== 0) {
              await clearToken();
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

  // Deja la sesión abierta: token en memoria, token guardado y usuario cargado.
  const finishLogin = useCallback(async (result: authApi.LoginResult) => {
    setSessionToken(result.token);
    await saveToken(result.token);
    setUser(result.user);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<SignInResult> => {
      const result = await authApi.login(email, password);
      if ('requiresTwoFactor' in result) {
        return { status: 'two-factor', challengeToken: result.challengeToken };
      }
      await finishLogin(result);
      return { status: 'ok' };
    },
    [finishLogin],
  );

  const completeTwoFactor = useCallback(
    async (challengeToken: string, code: string) => {
      await finishLogin(await authApi.loginTwoFactor(challengeToken, code));
    },
    [finishLogin],
  );

  // Vuelve a pedir los datos de la cuenta (por ejemplo, tras activar o desactivar el 2FA).
  const refreshUser = useCallback(async () => {
    setUser(await authApi.getMe());
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Aunque el servidor no responda, la sesión se cierra en este teléfono.
    }
    setSessionToken(null);
    await clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, completeTwoFactor, refreshUser, signOut }),
    [user, loading, signIn, completeTwoFactor, refreshUser, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
