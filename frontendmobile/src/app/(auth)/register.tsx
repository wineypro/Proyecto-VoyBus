import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { describeError, register } from '@/api/auth';
import { colors } from '@/constants/colors';
import { t } from '@/i18n';

// Mismas reglas que el backend: 8 a 15 caracteres con minúscula, mayúscula, número y símbolo.
const passwordIsValid = (p: string) =>
  p.length >= 8 && p.length <= 15 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p);

const emailIsValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validate = (): string | null => {
    if (name.trim().length < 2) return t.auth.nameRequired;
    if (!emailIsValid(email.trim())) return t.auth.emailInvalid;
    if (!passwordIsValid(password)) return t.auth.passwordRules;
    if (password !== confirmPassword) return t.auth.passwordMismatch;
    if (!accepted) return t.auth.privacyRequired;
    return null;
  };

  const onSubmit = async () => {
    const problem = validate();
    if (problem) return setError(problem);

    setError(null);
    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        password,
        confirmPassword,
        acceptPrivacy: true,
      });
      router.replace({ pathname: '/verify', params: { email: email.trim().toLowerCase() } });
    } catch (e) {
      setError(describeError(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t.auth.registerTitle}</Text>
        <Text style={styles.subtitle}>{t.auth.registerSubtitle}</Text>

        <Text style={styles.label}>{t.auth.name}</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} textContentType="name" />

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

        <Text style={styles.label}>{t.auth.phone}</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
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
          />
          <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
            <Text style={styles.link}>{showPassword ? t.auth.hidePassword : t.auth.showPassword}</Text>
          </Pressable>
        </View>
        <Text style={styles.hint}>{t.auth.passwordHint}</Text>

        <Text style={styles.label}>{t.auth.confirmPassword}</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.privacyRow}>
          <Switch
            value={accepted}
            onValueChange={setAccepted}
            trackColor={{ true: colors.primary, false: colors.secondary }}
          />
          <Text style={styles.privacyText}>{t.auth.acceptPrivacy}</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={[styles.button, submitting && styles.buttonDisabled]} onPress={onSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>{t.auth.registerButton}</Text>
          )}
        </Pressable>

        <Pressable style={styles.footer} onPress={() => router.replace('/login')}>
          <Text style={styles.link}>{t.auth.haveAccount}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text },
  subtitle: { marginTop: 4, marginBottom: 16, color: colors.text },
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
  hint: { marginTop: 4, fontSize: 12, color: colors.text, opacity: 0.7 },
  privacyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  privacyText: { flex: 1, color: colors.text },
  error: { marginTop: 12, color: colors.error },
  button: { marginTop: 20, backgroundColor: colors.primary, borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.white, fontWeight: '700' },
  footer: { marginTop: 20, alignItems: 'center' },
  link: { color: colors.primary, fontWeight: '600' },
});
