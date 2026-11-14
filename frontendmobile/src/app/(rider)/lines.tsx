import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getLines } from '@/api/lines';
import { colors } from '@/constants/colors';
import { useAsync } from '@/hooks/useAsync';
import { t } from '@/i18n';

export default function LinesScreen() {
  const router = useRouter();
  const { data, error, loading, reload } = useAsync(getLines);
  const [query, setQuery] = useState('');

  const filteredLines = useMemo(() => {
    const list = data ?? [];
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return list;
    return list.filter(
      (line) =>
        line.code.toLowerCase().includes(trimmed) ||
        line.name.toLowerCase().includes(trimmed),
    );
  }, [data, query]);

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

      <TextInput
        style={styles.searchInput}
        placeholder={t.lines.searchPlaceholder}
        placeholderTextColor={colors.primary}
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
      />

      <FlatList
        data={filteredLines}
        keyExtractor={(l) => String(l.id)}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {query.trim() ? t.lines.noSearchResults : t.lines.empty}
          </Text>
        }
        renderItem={({ item }) => {
          const isSuspended = item.status === 'suspended';
          return (
            <Pressable
              style={styles.card}
              onPress={() => router.push(`./lines/${item.id}`)}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.badge, { backgroundColor: item.color }]}>
                  <Text style={styles.badgeText}>{item.code}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.routeText}>
                    {t.lines.routeLabel} {item.origin} → {item.destination}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.statusPill,
                  isSuspended ? styles.statusSuspended : styles.statusActive,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    isSuspended ? styles.statusTextSuspended : styles.statusTextActive,
                  ]}
                >
                  {isSuspended ? t.lines.statusSuspended : t.lines.statusActive}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.background,
  },
  title: { fontSize: 24, fontWeight: '700', color: colors.primary, marginBottom: 12 },
  searchInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badge: {
    minWidth: 44,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  cardInfo: { flex: 1, gap: 4 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  routeText: { color: colors.primary, fontSize: 13 },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusActive: { backgroundColor: colors.secondary },
  statusSuspended: { backgroundColor: colors.accent },
  statusText: { fontSize: 12, fontWeight: '700' },
  statusTextActive: { color: colors.text },
  statusTextSuspended: { color: colors.white },
  text: { color: colors.text, fontSize: 16 },
  emptyText: { color: colors.text, fontSize: 15, textAlign: 'center', marginTop: 24 },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  buttonText: { color: colors.white, fontWeight: '600' },
});