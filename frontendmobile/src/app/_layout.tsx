import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { PreferencesProvider } from '@/preferences/PreferencesContext';
import { ThemeProvider, useTheme } from '@/theme/ThemeContext';

// Las pantallas privadas (grupo "(private)") solo existen mientras hay sesión.
// Al cerrar sesión desaparecen del historial, así el botón "atrás" no las reabre.
function Routes() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!!user}>
          <Stack.Screen name="(private)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

// Layout raíz: sesión → preferencias de la cuenta → tema.
export default function RootLayout() {
  return (
    <AuthProvider>
      <PreferencesProvider>
        <ThemeProvider>
          <Routes />
        </ThemeProvider>
      </PreferencesProvider>
    </AuthProvider>
  );
}
