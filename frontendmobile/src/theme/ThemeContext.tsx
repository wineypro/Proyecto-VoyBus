import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { colors as lightColors } from '@/constants/colors';
import { usePreferences } from '@/preferences/PreferencesContext';

// "onPrimary" es el color del texto sobre botones y chips de color primario.
export type Palette = typeof lightColors & { onPrimary: string };

const light: Palette = { ...lightColors, onPrimary: '#FFFFFF' };

// Paleta oscura de "Verde urbano" definida con el cliente: primario #28A778, secundario #243E35
// y acento #F5A65B. El fondo, el texto y la superficie se tomaron de la maqueta (aproximados).
// "white" es el color de las superficies (campos, tarjetas).
export const darkColors: Palette = {
  primary: '#28A778',
  secondary: '#243E35',
  accent: '#F5A65B',
  background: '#101B17',
  text: '#EAF4EF',
  white: '#16231E',
  error: '#FF6B5E',
  onPrimary: '#FFFFFF',
};

type ThemeState = { colors: Palette; isDark: boolean };

const ThemeContext = createContext<ThemeState>({ colors: light, isDark: false });

// Elige la paleta según la preferencia: claro, oscuro o el modo del teléfono (automático).
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { prefs } = usePreferences();
  const system = useColorScheme();
  const isDark = prefs.theme === 'dark' || (prefs.theme === 'system' && system === 'dark');

  const value = useMemo(() => ({ colors: isDark ? darkColors : light, isDark }), [isDark]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
