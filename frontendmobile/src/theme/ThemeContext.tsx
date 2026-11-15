import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { colors as lightColors } from '@/constants/colors';
import { usePreferences } from '@/preferences/PreferencesContext';

export type Palette = typeof lightColors;

// Paleta oscura de "Verde urbano". Las claves son las mismas que en constants/colors.ts;
// "white" es el color de las superficies (campos, tarjetas).
export const darkColors: Palette = {
  primary: '#3DBE8B',
  secondary: '#2B4A3C',
  accent: '#F2994A',
  background: '#0F1A15',
  text: '#E6F2EC',
  white: '#18241E',
  error: '#FF6B5E',
};

type ThemeState = { colors: Palette; isDark: boolean };

const ThemeContext = createContext<ThemeState>({ colors: lightColors, isDark: false });

// Elige la paleta según la preferencia: claro, oscuro o el modo del teléfono (automático).
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { prefs } = usePreferences();
  const system = useColorScheme();
  const isDark = prefs.theme === 'dark' || (prefs.theme === 'system' && system === 'dark');

  const value = useMemo(() => ({ colors: isDark ? darkColors : lightColors, isDark }), [isDark]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
