import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import {
  DEFAULT_PREFERENCES,
  getPreferences,
  updatePreferences,
} from '@/api/preferences';
import type { Preferences, PreferencesPatch } from '@/api/preferences';
import { useAuth } from '@/auth/AuthContext';

type PreferencesState = {
  prefs: Preferences;
  // Aplica el cambio al instante y lo guarda; si el servidor falla, vuelve al valor anterior y lanza el error.
  update: (patch: PreferencesPatch) => Promise<void>;
};

const PreferencesContext = createContext<PreferencesState | null>(null);

function merge(base: Preferences, patch: PreferencesPatch): Preferences {
  return {
    language: patch.language ?? base.language,
    theme: patch.theme ?? base.theme,
    notifications: { ...base.notifications, ...patch.notifications },
    privacy: { ...base.privacy, ...patch.privacy },
  };
}

// Las preferencias viven en la cuenta: se cargan al iniciar sesión y vuelven a los valores
// por defecto al cerrarla.
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [prefs, setPrefsState] = useState<Preferences>(DEFAULT_PREFERENCES);
  const latest = useRef<Preferences>(DEFAULT_PREFERENCES);

  const apply = useCallback((next: Preferences) => {
    latest.current = next;
    setPrefsState(next);
  }, []);

  const userId = user?.id;
  useEffect(() => {
    if (!userId) {
      apply(DEFAULT_PREFERENCES);
      return;
    }
    let cancelled = false;
    getPreferences()
      .then((p) => {
        if (!cancelled) apply(p);
      })
      .catch(() => {
        // Sin conexión: se mantienen los valores por defecto.
      });
    return () => {
      cancelled = true;
    };
  }, [userId, apply]);

  const update = useCallback(
    async (patch: PreferencesPatch) => {
      const before = latest.current;
      apply(merge(before, patch));
      try {
        apply(await updatePreferences(patch));
      } catch (e) {
        apply(before);
        throw e;
      }
    },
    [apply],
  );

  const value = useMemo(() => ({ prefs, update }), [prefs, update]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences debe usarse dentro de PreferencesProvider');
  return ctx;
}
