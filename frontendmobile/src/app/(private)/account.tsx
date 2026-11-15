import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthContext';
import { RiderNav } from '@/components/RiderNav';
import { useTheme } from '@/theme/ThemeContext';
import type { Palette } from '@/theme/ThemeContext';
import { t } from '@/i18n';

export default function AccountScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const { user, signOut } = useAuth();

  // Pide confirmación antes de cerrar la sesión.
  const confirmLogout = () => {
    Alert.alert(t.auth.logoutConfirmTitle, t.auth.logoutConfirmMessage, [
      { text: t.auth.logoutConfirmNo, style: 'cancel' },
      {
        text: t.auth.logoutConfirmYes,
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <RiderNav active="account" />

      <View style={styles.content}>
        <Text style={styles.title}>{t.auth.accountTitle}</Text>
        <Text style={styles.text}>
          {t.auth.welcome} {user?.name}
        </Text>
        <Text style={styles.muted}>{user?.email}</Text>

        <Pressable style={styles.button} onPress={() => router.push('/lines')}>
          <Text style={styles.buttonText}>{t.auth.goToLines}</Text>
        </Pressable>

        <Pressable style={styles.secondary} onPress={() => router.push('/profile')}>
          <Text style={styles.secondaryText}>{t.auth.profileButton}</Text>
        </Pressable>

        <Pressable style={styles.secondary} onPress={() => router.push('/history')}>
          <Text style={styles.secondaryText}>{t.auth.historyButton}</Text>
        </Pressable>

        <Pressable style={styles.secondary} onPress={() => router.push('/preferences')}>
          <Text style={styles.secondaryText}>{t.auth.preferencesButton}</Text>
        </Pressable>

        <Pressable style={styles.secondary} onPress={() => router.push('/change-password')}>
          <Text style={styles.secondaryText}>{t.auth.changePasswordButton}</Text>
        </Pressable>

        <Pressable style={styles.logout} onPress={confirmLogout}>
          <Text style={styles.logoutText}>{t.auth.logoutButton}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    container: { flex: 1, padding: 20, paddingTop: 50, backgroundColor: colors.background },
    content: { flex: 1, justifyContent: 'center' },
    title: { fontSize: 26, fontWeight: '700', color: colors.text, marginBottom: 12 },
    text: { fontSize: 18, color: colors.text },
    muted: { marginTop: 4, color: colors.text, opacity: 0.7 },
    button: {
      marginTop: 24,
      backgroundColor: colors.primary,
      borderRadius: 8,
      padding: 14,
      alignItems: 'center',
    },
    buttonText: { color: colors.onPrimary, fontWeight: '700' },
    secondary: {
      marginTop: 12,
      borderColor: colors.primary,
      borderWidth: 1,
      borderRadius: 8,
      padding: 14,
      alignItems: 'center',
    },
    secondaryText: { color: colors.primary, fontWeight: '700' },
    logout: {
      marginTop: 14,
      borderColor: colors.error,
      borderWidth: 1,
      borderRadius: 8,
      padding: 14,
      alignItems: 'center',
    },
    logoutText: { color: colors.error, fontWeight: '700' },
  });