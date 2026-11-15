import { useLocalSearchParams, useRouter } from 'expo-router';
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

import { describeError, resetPassword } from '@/api/auth';
import { PasswordStrength, passwordIsValid } from '@/components/PasswordStrength';
import { colors } from '@/constants/colors';
import { t } from '@/i18n';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const email = (emailParam ?? '').toString();

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async () => {
    if (!/^[0-9]{6}$/.test(code.trim())) return setError(t.auth.codeInvalid);
    if (!passwordIsValid(newPassword)) return setError(t.auth.passwordRules);
    if (newPassword !== confirmPassword) return setError(t.auth.passwordMismatch);

    setError(null);
    setSubmitting(true);
    try {
      await resetPassword({ email, code: code.trim(), newPassword, confirmPassword });
      setDone(true);
    } catch (e) {
      setError(describeError(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <ScrollView contentContainerStyle={styles.container} style={styles.flex}>
        <Text style={styles.title}>{t.auth.resetDoneTitle}</Text>
        <Text style={styles.subtitle}>{t.auth.resetDoneMessage}</Text>
        <Pressable style={styles.button} onPress={() => router.replace('/login')}>
          <Text style={styles.buttonText}>{t.auth.verifiedAction}</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t.auth.resetTitle}</Text>
        <Text style={styles.subtitle}>
          {t.auth.resetSubtitle} {email}
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

        <Text style={styles.label}>{t.auth.newPassword}</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
            <Text style={styles.link}>{showPassword ? t.auth.hidePassword : t.auth.showPassword}</Text>
          </Pressable>
        </View>
        <PasswordStrength password={newPassword} />

        <Text style={styles.label}>{t.auth.confirmNewPassword}</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={[styles.button, submitting && styles.buttonDisabled]} onPress={onSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>{t.auth.resetButton}</Text>
          )}
        </Pressable>

        <Pressable style={styles.footer} onPress={() => router.replace('/login')}>
          <Text style={styles.link}>{t.auth.backToLogin}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text },
  subtitle: { marginTop: 8, color: colors.text, fontSize: 16 },
  hint: { marginTop: 4, fontSize: 12, color: colors.text, opacity: 0.7 },
  label: { marginBottom: 6, marginTop: 16, fontWeight: '600', color: colors.text },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.secondary,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
  },
  codeInput: { fontSize: 24, letterSpacing: 8, textAlign: 'center' },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  passwordInput: { flex: 1 },
  error: { marginTop: 12, color: colors.error },
  button: { marginTop: 20, backgroundColor: colors.primary, borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.white, fontWeight: '700' },
  footer: { marginTop: 20, alignItems: 'center' },
  link: { color: colors.primary, fontWeight: '600' },
});
