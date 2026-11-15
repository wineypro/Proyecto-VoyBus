import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'voybus_session_token';

// En el teléfono el token va al almacenamiento seguro (Keychain / Keystore).
// En el navegador (web) SecureStore no existe, así que se usa localStorage.
// Si el guardado falla, nunca debe romper el inicio de sesión: la sesión sigue en memoria.

export async function loadToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(TOKEN_KEY) ?? null;
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function saveToken(token: string): Promise<void> {
  try {
    if (Platform.OS === 'web') globalThis.localStorage?.setItem(TOKEN_KEY, token);
    else await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch {
    // Sin almacenamiento: el usuario tendrá que iniciar sesión la próxima vez.
  }
}

export async function clearToken(): Promise<void> {
  try {
    if (Platform.OS === 'web') globalThis.localStorage?.removeItem(TOKEN_KEY);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // Nada que borrar o no disponible.
  }
}
