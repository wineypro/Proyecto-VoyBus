import { useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';

import { describeError, forgotPassword } from '@/api/auth';
import { useTheme } from '@/theme/ThemeContext';
import type { Palette } from '@/theme/ThemeContext';
import { t } from '@/i18n';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError(t.auth.emailInvalid);

    setError(null);
    setSubmitting(true);
    try {
      await forgotPassword(email.trim());
      // La respuesta es siempre la misma, exista o no la cuenta.
      router.replace({ pathname: '/reset-password', params: { email: email.trim().toLowerCase() } });
    } catch (e) {
      setError(describeError(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t.auth.forgotTitle}</Text>
        <Text style={styles.subtitle}>{t.auth.forgotSubtitle}</Text>

        <Text style={styles.label}>{t.auth.email}</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={[styles.button, submitting && styles.buttonDisabled]} onPress={onSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.buttonText}>{t.auth.forgotButton}</Text>
          )}
        </Pressable>

        <Pressable style={styles.footer} onPress={() => router.replace('/login')}>
          <Text style={styles.link}>{t.auth.backToLogin}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text },
  subtitle: { marginTop: 8, marginBottom: 8, color: colors.text },
  label: { marginBottom: 6, marginTop: 12, fontWeight: '600', color: colors.text },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.secondary,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
  },
  error: { marginTop: 12, color: colors.error },
  button: { marginTop: 20, backgroundColor: colors.primary, borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.onPrimary, fontWeight: '700' },
  footer: { marginTop: 20, alignItems: 'center' },
  link: { color: colors.primary, fontWeight: '600' },
});
