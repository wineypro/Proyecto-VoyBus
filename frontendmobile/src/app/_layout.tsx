import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// Layout raíz. Más adelante aquí se agregan los grupos (auth) y (rider)
// con Stack.Protected según haya sesión (lo hace Israel con ACC-02).
export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}