import { Stack } from 'expo-router';

// Layout del grupo "(private)". Sin este archivo, Expo Router registra las
// pantallas sueltas ("(private)/account", ...) y el Stack.Protected del layout
// raíz no encuentra la ruta "(private)", así que no protegería nada.
export default function PrivateLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
