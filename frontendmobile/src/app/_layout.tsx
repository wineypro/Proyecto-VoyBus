import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from '@/auth/AuthContext';

// Las pantallas privadas (grupo "(private)") solo existen mientras hay sesión.
// Al cerrar sesión desaparecen del historial, así el botón "atrás" no las reabre.
function Routes() {
  const { user } = useAuth();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(private)" />
      </Stack.Protected>
    </Stack>
  );
}

// Layout raíz.
export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Routes />
    </AuthProvider>
  );
}
