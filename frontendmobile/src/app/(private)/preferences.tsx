import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import type { Preferences, PreferencesPatch } from '@/api/preferences';
import { usePreferences } from '@/preferences/PreferencesContext';
import { t } from '@/i18n';
import { useTheme } from '@/theme/ThemeContext';
import type { Palette } from '@/theme/ThemeContext';

type SwitchRowProps = {
  label: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
  styles: ReturnType<typeof makeStyles>;
  colors: Palette;
};

// Fila con interruptor y una frase corta que explica qué hace la opción.
function SwitchRow({ label, hint, value, onChange, styles, colors }: SwitchRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.hint}>{hint}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.primary, false: colors.secondary }}
      />
    </View>
  );
}

export default function PreferencesScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const { prefs, update } = usePreferences();
  const [error, setError] = useState<string | null>(null);

  // El cambio se ve al instante; si no se puede guardar, vuelve atrás y se avisa.
  const change = async (patch: PreferencesPatch) => {
    setError(null);
    try {
      await update(patch);
    } catch {
      setError(t.prefs.saveError);
    }
  };

  // Si hay algún aviso activado, se explica qué permiso necesita el teléfono y se ofrece abrir sus ajustes.
  const anyNotificationOn = Object.values(prefs.notifications).some(Boolean);
  const openPhoneSettings = () => {
    Linking.openSettings().catch(() => setError(t.prefs.openSettingsError));
  };

  const themes: { value: Preferences['theme']; label: string }[] = [
    { value: 'light', label: t.prefs.themeLight },
    { value: 'dark', label: t.prefs.themeDark },
    { value: 'system', label: t.prefs.themeSystem },
  ];

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t.prefs.title}</Text>
      <Text style={styles.hint}>{t.prefs.autoSave}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.section}>{t.prefs.languageTitle}</Text>
      <Text style={styles.hint}>{t.prefs.languageHint}</Text>
      <View style={styles.chips}>
        <View style={[styles.chip, styles.chipActive]}>
          <Text style={[styles.chipText, styles.chipTextActive]}>{t.prefs.languageEs}</Text>
        </View>
      </View>
      <Text style={styles.hint}>{t.prefs.languageMore}</Text>

      <Text style={styles.section}>{t.prefs.themeTitle}</Text>
      <Text style={styles.hint}>{t.prefs.themeHint}</Text>
      <View style={styles.chips}>
        {themes.map((o) => {
          const active = prefs.theme === o.value;
          return (
            <Pressable
              key={o.value}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => change({ theme: o.value })}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.section}>{t.prefs.notificationsTitle}</Text>
      <Text style={styles.hint}>{t.prefs.notificationsHint}</Text>
      <SwitchRow
        styles={styles}
        colors={colors}
        label={t.prefs.notifServiceAlerts}
        hint={t.prefs.notifServiceAlertsHint}
        value={prefs.notifications.serviceAlerts}
        onChange={(v) => change({ notifications: { serviceAlerts: v } })}
      />
      <SwitchRow
        styles={styles}
        colors={colors}
        label={t.prefs.notifFavoriteLines}
        hint={t.prefs.notifFavoriteLinesHint}
        value={prefs.notifications.favoriteLines}
        onChange={(v) => change({ notifications: { favoriteLines: v } })}
      />
      <SwitchRow
        styles={styles}
        colors={colors}
        label={t.prefs.notifTips}
        hint={t.prefs.notifTipsHint}
        value={prefs.notifications.tips}
        onChange={(v) => change({ notifications: { tips: v } })}
      />
      {anyNotificationOn ? (
        <View style={styles.permCard}>
          <Text style={styles.permTitle}>{t.prefs.notifPermissionTitle}</Text>
          <Text style={styles.permText}>{t.prefs.notifPermissionText}</Text>
          <Pressable style={styles.permButton} onPress={openPhoneSettings}>
            <Text style={styles.permButtonText}>{t.prefs.openSettings}</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.note}>{t.prefs.notificationsDeviceNote}</Text>
      )}

      <Text style={styles.section}>{t.prefs.privacyTitle}</Text>
      <Text style={styles.hint}>{t.prefs.privacyHint}</Text>
      <SwitchRow
        styles={styles}
        colors={colors}
        label={t.prefs.privShowRecent}
        hint={t.prefs.privShowRecentHint}
        value={prefs.privacy.showRecentActivity}
        onChange={(v) => change({ privacy: { showRecentActivity: v } })}
      />
      <SwitchRow
        styles={styles}
        colors={colors}
        label={t.prefs.privAnalytics}
        hint={t.prefs.privAnalyticsHint}
        value={prefs.privacy.allowAnalytics}
        onChange={(v) => change({ privacy: { allowAnalytics: v } })}
      />

      <Pressable style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>{t.auth.back}</Text>
      </Pressable>
    </ScrollView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    container: { padding: 24, paddingBottom: 48 },
    title: { fontSize: 26, fontWeight: '700', color: colors.text },
    section: { marginTop: 28, fontSize: 18, fontWeight: '700', color: colors.text },
    hint: { marginTop: 4, color: colors.text, opacity: 0.7 },
    note: { marginTop: 12, color: colors.text, opacity: 0.7, fontStyle: 'italic' },
    error: { marginTop: 12, color: colors.error },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 10 },
    chip: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.white,
    },
    chipActive: { backgroundColor: colors.primary },
    chipText: { color: colors.primary, fontWeight: '600' },
    chipTextActive: { color: colors.onPrimary },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
    rowText: { flex: 1 },
    rowLabel: { fontWeight: '600', color: colors.text },
    permCard: {
      marginTop: 10,
      padding: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.accent,
      backgroundColor: colors.white,
      gap: 6,
    },
    permTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
    permText: { fontSize: 13, color: colors.text, opacity: 0.85 },
    permButton: {
      alignSelf: 'flex-start',
      marginTop: 4,
      backgroundColor: colors.accent,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 9,
    },
    permButtonText: { color: colors.onAccent, fontWeight: '700', fontSize: 13 },
    back: { marginTop: 32, alignItems: 'center' },
    backText: { color: colors.primary, fontWeight: '600' },
  });
