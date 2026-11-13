import { Redirect } from 'expo-router';

// Pantalla inicial: por ahora redirige a la lista de líneas (ejemplo).
export default function Index() {
  return <Redirect href="/lines" />;
}