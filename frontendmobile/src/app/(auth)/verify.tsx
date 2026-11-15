import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
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

import { describeError, resendCode, verifyEmail } from '@/api/auth';
import { useTheme } from '@/theme/ThemeContext';
import type { Palette } from '@/theme/ThemeContext';
import { t } from '@/i18n';

// Segundos de espera entre un envío y otro (el backend también lo exige).
const RESEND_SECONDS = 30;

export default function VerifyScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const email = (emailParam ?? '').toString();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [verified, setVerified] = useState(false);
  // Al llegar desde el registro ya se envió un código, así que el reenvío parte con espera.
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const onVerify = async () => {
    if (!/^[0-9]{6}$/.test(code.trim())) return setError(t.auth.codeInvalid);

    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      await verifyEmail(email, code.trim());
      setVerified(true);
    } catch (e) {
      setError(describeError(e));
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    setError(null);
    setInfo(null);
    try {
      await resendCode(email);
      setCode('');
      setInfo(t.auth.resentOk);
      setCooldown(RESEND_SECONDS);
    } catch (e) {
      setError(describeError(e));
    }
  };

  if (verified) {
    return (
      <ScrollView contentContainerStyle={styles.container} style={styles.flex}>
        <Text style={styles.title}>{t.auth.verifiedTitle}</Text>
        <Text style={styles.subtitle}>{t.auth.verifiedMessage}</Text>
        <Pressable style={styles.button} onPress={() => router.replace('/login')}>
          <Text style={styles.buttonText}>{t.auth.verifiedAction}</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t.auth.verifyTitle}</Text>
        <Text style={styles.subtitle}>
          {t.auth.verifySentTo} {email}
        </Text>
        <Text style={styles.hint}>{t.auth.verifyExpires}</Text>

        <Text style={styles.label}>{t.auth.codeLabel}</Text>
        <TextInput
          style={[styles.input, styles.codeInput]}
          value={code}
          onChangeText={(v) => setCode(v.replace(/[^0-9]/g, '').slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          textContentType="oneTimeCode"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}

        <Pressable style={[styles.button, submitting && styles.buttonDisabled]} onPress={onVerify} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.buttonText}>{t.auth.verifyButton}</Text>
          )}
        </Pressable>

        <Pressable style={styles.footer} onPress={onResend} disabled={cooldown > 0}>
          <Text style={[styles.link, cooldown > 0 && styles.linkDisabled]}>
            {cooldown > 0 ? `${t.auth.resendIn} ${cooldown} s` : t.auth.resendCode}
          </Text>
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
  subtitle: { marginTop: 8, color: colors.text, fontSize: 16 },
  hint: { marginTop: 4, fontSize: 12, color: colors.text, opacity: 0.7 },
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
  info: { marginTop: 12, color: colors.primary },
  button: { marginTop: 20, backgroundColor: colors.primary, borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.onPrimary, fontWeight: '700' },
  footer: { marginTop: 20, alignItems: 'center' },
  link: { color: colors.primary, fontWeight: '600' },
  linkDisabled: { opacity: 0.5 },
});
