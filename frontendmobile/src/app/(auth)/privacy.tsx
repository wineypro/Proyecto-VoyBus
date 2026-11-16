import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { privacyTerms } from '@/i18n/privacy';
import { useTheme } from '@/theme/ThemeContext';
import type { Palette } from '@/theme/ThemeContext';

// Términos de privacidad: pantalla de solo lectura, enlazada desde el registro.
export default function PrivacyScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Text style={styles.title}>{privacyTerms.title}</Text>
      <Text style={styles.updated}>{privacyTerms.updated}</Text>
      <Text style={styles.body}>{privacyTerms.intro}</Text>

      {privacyTerms.sections.map((s) => (
        <Text key={s.title} style={styles.body}>
          <Text style={styles.sectionTitle}>{s.title}{'\n'}</Text>
          {s.body}
        </Text>
      ))}

      <Pressable style={styles.button} onPress={() => router.back()}>
        <Text style={styles.buttonText}>{privacyTerms.close}</Text>
      </Pressable>
    </ScrollView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    container: { padding: 24, paddingBottom: 48 },
    title: { fontSize: 26, fontWeight: '700', color: colors.text },
    updated: { marginTop: 4, color: colors.text, opacity: 0.7 },
    body: { marginTop: 18, color: colors.text, lineHeight: 22 },
    sectionTitle: { fontWeight: '700', fontSize: 16 },
    button: { marginTop: 32, backgroundColor: colors.primary, borderRadius: 8, padding: 14, alignItems: 'center' },
    buttonText: { color: colors.onPrimary, fontWeight: '700' },
  });
