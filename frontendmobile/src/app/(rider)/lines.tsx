import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { getLines } from '@/api/lines';
import { colors } from '@/constants/colors';
import { useAsync } from '@/hooks/useAsync';
import { t } from '@/i18n';

// PANTALLA DE EJEMPLO (patrón a copiar): API → hook → textos i18n → colores del tema.
export default function LinesScreen() {
  const { data, error, loading, reload } = useAsync(getLines);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.text}>{t.common.loading}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>{error}</Text>
        <Pressable style={styles.button} onPress={reload}>
          <Text style={styles.buttonText}>{t.common.retry}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.lines.title}</Text>
      <FlatList
        data={data ?? []}
        keyExtractor={(l) => String(l.id)}
        ListEmptyComponent={<Text style={styles.text}>{t.lines.empty}</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text style={styles.text}>{item.name}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: '700', color: colors.primary, marginBottom: 16 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, padding: 16, borderRadius: 12, marginBottom: 10 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  text: { color: colors.text, fontSize: 16 },
  button: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  buttonText: { color: colors.white, fontWeight: '600' },
});