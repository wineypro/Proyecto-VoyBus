import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/auth/AuthContext';
import { useTheme } from '@/theme/ThemeContext';

// Pantalla inicial: con sesión va a la cuenta; sin sesión, al inicio de sesión.
export default function Index() {
  const { colors } = useTheme();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  return <Redirect href={user ? '/account' : '/login'} />;
}
