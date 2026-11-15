import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
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

import { describeError } from '@/api/auth';
import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/AuthContext';
import { t } from '@/i18n';
import { useTheme } from '@/theme/ThemeContext';
import type { Palette } from '@/theme/ThemeContext';

// Segundo paso del inicio de sesión: código de la app autenticadora.
export default function TwoFactorScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const { completeTwoFactor } = useAuth();
  const { challenge } = useLocalSearchParams<{ challenge?: string }>();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!/^[0-9]{6}$/.test(code)) return setError(t.twofa.codeInvalid);

    setError(null);
    setSubmitting(true);
    try {
      await completeTwoFactor((challenge ?? '').toString(), code);
      router.replace('/account');
    } catch (e) {
      setExpired(e instanceof ApiError && e.code === 'CHALLENGE_EXPIRED');
      setError(describeError(e));
      setCode('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t.twofa.loginTitle}</Text>
        <Text style={styles.subtitle}>{t.twofa.loginSubtitle}</Text>

        <Text style={styles.label}>{t.twofa.codeLabel}</Text>
        <TextInput
          style={[styles.input, styles.codeInput]}
          value={code}
          onChangeText={(v) => setCode(v.replace(/[^0-9]/g, '').slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          textContentType="oneTimeCode"
          autoFocus
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!expired ? (
          <Pressable style={[styles.button, submitting && styles.buttonDisabled]} onPress={onSubmit} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.buttonText}>{t.twofa.loginButton}</Text>
            )}
          </Pressable>
        ) : null}

        <Pressable style={styles.footer} onPress={() => router.replace('/login')}>
          <Text style={styles.link}>{t.twofa.expiredBack}</Text>
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
    subtitle: { marginTop: 8, color: colors.text, fontSize: 16 },
    label: { marginBottom: 6, marginTop: 24, fontWeight: '600', color: colors.text },
    input: {
      backgroundColor: colors.white,
      borderColor: colors.secondary,
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      color: colors.text,
    },
    codeInput: { fontSize: 24, letterSpacing: 8, textAlign: 'center' },
    error: { marginTop: 12, color: colors.error },
    button: { marginTop: 20, backgroundColor: colors.primary, borderRadius: 8, padding: 14, alignItems: 'center' },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: colors.onPrimary, fontWeight: '700' },
    footer: { marginTop: 20, alignItems: 'center' },
    link: { color: colors.primary, fontWeight: '600' },
  });
