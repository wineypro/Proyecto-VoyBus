import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { describeError } from '@/api/auth';
import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/AuthContext';
import { colors } from '@/constants/colors';
import { t } from '@/i18n';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!email.trim()) return setError(t.auth.emailRequired);
    if (!password) return setError(t.auth.passwordRequired);

    setError(null);
    setNeedsVerification(false);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/account');
    } catch (e) {
      setNeedsVerification(e instanceof ApiError && e.code === 'ACCOUNT_NOT_VERIFIED');
      setError(describeError(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t.auth.loginTitle}</Text>
        <Text style={styles.subtitle}>{t.auth.loginSubtitle}</Text>

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

        <Text style={styles.label}>{t.auth.password}</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
          />
          <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
            <Text style={styles.link}>{showPassword ? t.auth.hidePassword : t.auth.showPassword}</Text>
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {needsVerification ? (
          <Pressable
            onPress={() => router.push({ pathname: '/verify', params: { email: email.trim().toLowerCase() } })}
          >
            <Text style={[styles.link, styles.verifyLink]}>{t.auth.verifyAccount}</Text>
          </Pressable>
        ) : null}

        <Pressable style={styles.forgot} onPress={() => router.push('/forgot-password')}>
          <Text style={styles.link}>{t.auth.forgotPassword}</Text>
        </Pressable>

        <Pressable style={[styles.button, submitting && styles.buttonDisabled]} onPress={onSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>{t.auth.loginButton}</Text>
          )}
        </Pressable>

        <Pressable style={styles.guest} onPress={() => router.push('/register')}>
          <Text style={styles.link}>
            {t.auth.noAccountYet} {t.auth.createAccount}
          </Text>
        </Pressable>

        <Pressable style={styles.guest} onPress={() => router.replace('/lines')}>
          <Text style={styles.link}>{t.auth.guestButton}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text },
  subtitle: { marginTop: 4, marginBottom: 24, color: colors.text },
  label: { marginBottom: 6, marginTop: 12, fontWeight: '600', color: colors.text },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.secondary,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  passwordInput: { flex: 1 },
  error: { marginTop: 12, color: colors.error },
  button: {
    marginTop: 24,
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.white, fontWeight: '700' },
  guest: { marginTop: 20, alignItems: 'center' },
  verifyLink: { marginTop: 8 },
  forgot: { marginTop: 12, alignItems: 'flex-end' },
  link: { color: colors.primary, fontWeight: '600' },
});
