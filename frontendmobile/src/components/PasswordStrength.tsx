import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeContext';
import type { Palette } from '@/theme/ThemeContext';
import { t } from '@/i18n';

// Cuenta cuántos requisitos cumple la contraseña (los mismos que valida el backend).
function checks(p: string) {
  return [
    { ok: p.length >= 8 && p.length <= 15, label: t.auth.tipLength },
    { ok: /[a-z]/.test(p), label: t.auth.tipLower },
    { ok: /[A-Z]/.test(p), label: t.auth.tipUpper },
    { ok: /[0-9]/.test(p), label: t.auth.tipDigit },
    { ok: /[^A-Za-z0-9]/.test(p), label: t.auth.tipSymbol },
  ];
}

export const passwordIsValid = (p: string) => checks(p).every((c) => c.ok);

// Recomendaciones para una contraseña segura + indicador de fortaleza.
export function PasswordStrength({ password }: { password: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const list = checks(password);
  const score = list.filter((c) => c.ok).length;
  const level = score <= 2 ? 0 : score <= 4 ? 1 : 2;
  const label = [t.auth.strengthWeak, t.auth.strengthMedium, t.auth.strengthStrong][level];
  const color = [colors.error, colors.accent, colors.primary][level];

  return (
    <View style={styles.box}>
      {password ? (
        <>
          <View style={styles.bar}>
            <View style={[styles.fill, { width: `${(score / list.length) * 100}%`, backgroundColor: color }]} />
          </View>
          <Text style={[styles.level, { color }]}>
            {t.auth.strengthLabel} {label}
          </Text>
        </>
      ) : null}
      <Text style={styles.title}>{t.auth.tipsTitle}</Text>
      {list.map((c) => (
        <Text key={c.label} style={[styles.tip, c.ok && styles.tipOk]}>
          {c.ok ? '✓' : '•'} {c.label}
        </Text>
      ))}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  box: { marginTop: 8 },
  bar: { height: 6, borderRadius: 3, backgroundColor: colors.secondary, overflow: 'hidden' },
  fill: { height: 6 },
  level: { marginTop: 4, fontWeight: '600' },
  title: { marginTop: 8, fontWeight: '600', color: colors.text },
  tip: { color: colors.text, opacity: 0.7, marginTop: 2 },
  tipOk: { color: colors.primary, opacity: 1 },
});
