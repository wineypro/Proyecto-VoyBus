import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { describeError, disableTwoFactor, enableTwoFactor, setupTwoFactor } from '@/api/auth';
import type { TwoFactorSetup } from '@/api/auth';
import { useAuth } from '@/auth/AuthContext';
import { t } from '@/i18n';
import { useTheme } from '@/theme/ThemeContext';
import type { Palette } from '@/theme/ThemeContext';

// Clave manual en grupos de 4 letras para que sea fácil de copiar.
const groupKey = (key: string) => key.replace(/(.{4})/g, '$1 ').trim();

export default function SecurityScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const { welcome } = useLocalSearchParams<{ welcome?: string }>();
  const isWelcome = welcome === '1';
  const { user, refreshUser } = useAuth();

  const enabled = Boolean(user?.twoFactorEnabled);
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Al entrar, se pide el estado real a la cuenta.
  useEffect(() => {
    refreshUser().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onlyDigits = (v: string) => v.replace(/[^0-9]/g, '').slice(0, 6);

  const run = async (action: () => Promise<void>) => {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      await action();
    } catch (e) {
      setError(describeError(e));
    } finally {
      setBusy(false);
    }
  };

  const onStart = () =>
    run(async () => {
      setSetup(await setupTwoFactor());
      setCode('');
    });

  const onConfirm = () =>
    run(async () => {
      if (!/^[0-9]{6}$/.test(code)) throw new Error(t.twofa.codeInvalid);
      await enableTwoFactor(code);
      await refreshUser();
      setSetup(null);
      setCode('');
      setNotice(t.twofa.enabledOk);
    });

  const onDisable = () =>
    run(async () => {
      if (!password) throw new Error(t.twofa.passwordRequired);
      if (!/^[0-9]{6}$/.test(code)) throw new Error(t.twofa.codeInvalid);
      await disableTwoFactor(password, code);
      await refreshUser();
      setPassword('');
      setCode('');
      setNotice(t.twofa.disabledOk);
    });

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{isWelcome ? t.twofa.welcomeTitle : t.twofa.securityTitle}</Text>
        {isWelcome ? <Text style={styles.hint}>{t.twofa.welcomeHint}</Text> : null}

        <Text style={styles.section}>{t.twofa.statusTitle}</Text>
        <Text style={styles.hint}>{t.twofa.statusHint}</Text>
        <Text style={[styles.status, enabled ? styles.statusOn : styles.statusOff]}>
          {enabled ? t.twofa.statusOn : t.twofa.statusOff}
        </Text>

        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        {notice && enabled ? <Text style={styles.hint}>{t.twofa.enabledOkHint}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Desactivada y sin iniciar la activación */}
        {!enabled && !setup ? (
          <Pressable style={[styles.button, busy && styles.buttonDisabled]} onPress={onStart} disabled={busy}>
            {busy ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.buttonText}>{t.twofa.enableButton}</Text>
            )}
          </Pressable>
        ) : null}

        {/* Activación en curso: QR + confirmación */}
        {!enabled && setup ? (
          <View>
            <Text style={styles.section}>{t.twofa.stepsTitle}</Text>
            <Text style={styles.step}>{t.twofa.step1}</Text>
            <Text style={styles.step}>{t.twofa.step2}</Text>
            <View style={styles.qrBox}>
              <Image
                source={{ uri: setup.qrDataUrl }}
                style={styles.qr}
                accessibilityLabel={t.twofa.qrAlt}
              />
            </View>
            <Text style={styles.hint}>{t.twofa.manualKey}</Text>
            <Text selectable style={styles.manualKey}>
              {groupKey(setup.secret)}
            </Text>
            <Text style={styles.step}>{t.twofa.step3}</Text>

            <Text style={styles.label}>{t.twofa.codeLabel}</Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              value={code}
              onChangeText={(v) => setCode(onlyDigits(v))}
              keyboardType="number-pad"
              maxLength={6}
            />

            <Pressable style={[styles.button, busy && styles.buttonDisabled]} onPress={onConfirm} disabled={busy}>
              {busy ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={styles.buttonText}>{t.twofa.confirmButton}</Text>
              )}
            </Pressable>
            <Pressable
              style={styles.footer}
              onPress={() => {
                setSetup(null);
                setCode('');
                setError(null);
              }}
            >
              <Text style={styles.link}>{t.twofa.cancel}</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Activada: se puede desactivar con contraseña + código */}
        {enabled ? (
          <View>
            <Text style={styles.section}>{t.twofa.disableTitle}</Text>
            <Text style={styles.hint}>{t.twofa.disableHint}</Text>

            <Text style={styles.label}>{t.twofa.password}</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>{t.twofa.codeLabel}</Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              value={code}
              onChangeText={(v) => setCode(onlyDigits(v))}
              keyboardType="number-pad"
              maxLength={6}
            />

            <Pressable style={[styles.danger, busy && styles.buttonDisabled]} onPress={onDisable} disabled={busy}>
              {busy ? (
                <ActivityIndicator color={colors.error} />
              ) : (
                <Text style={styles.dangerText}>{t.twofa.disableButton}</Text>
              )}
            </Pressable>
          </View>
        ) : null}

        {isWelcome ? (
          <Pressable
            style={enabled ? styles.button : styles.footer}
            onPress={() => router.replace('/account')}
          >
            <Text style={enabled ? styles.buttonText : styles.link}>
              {enabled ? t.twofa.continueButton : t.twofa.skipForNow}
            </Text>
          </Pressable>
        ) : (
          <Pressable style={styles.footer} onPress={() => router.back()}>
            <Text style={styles.link}>{t.twofa.back}</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    container: { padding: 24, paddingBottom: 48 },
    title: { fontSize: 26, fontWeight: '700', color: colors.text },
    section: { marginTop: 24, fontSize: 18, fontWeight: '700', color: colors.text },
    hint: { marginTop: 4, color: colors.text, opacity: 0.7 },
    step: { marginTop: 10, color: colors.text },
    status: { marginTop: 8, fontWeight: '700', fontSize: 16 },
    statusOn: { color: colors.primary },
    statusOff: { color: colors.text, opacity: 0.7 },
    notice: { marginTop: 12, color: colors.primary, fontWeight: '600' },
    error: { marginTop: 12, color: colors.error },
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
    qrBox: {
      alignSelf: 'center',
      marginVertical: 16,
      padding: 12,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
    },
    qr: { width: 220, height: 220 },
    manualKey: {
      marginTop: 6,
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 1,
      color: colors.text,
    },
    button: { marginTop: 20, backgroundColor: colors.primary, borderRadius: 8, padding: 14, alignItems: 'center' },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: colors.onPrimary, fontWeight: '700' },
    danger: {
      marginTop: 20,
      borderColor: colors.error,
      borderWidth: 1,
      borderRadius: 8,
      padding: 14,
      alignItems: 'center',
    },
    dangerText: { color: colors.error, fontWeight: '700' },
    footer: { marginTop: 24, alignItems: 'center' },
    link: { color: colors.primary, fontWeight: '600' },
  });
