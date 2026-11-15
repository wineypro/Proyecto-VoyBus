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

import { getStops } from '@/api/stops';
import { StopsMap } from '@/components/StopsMap';
import { colors } from '@/constants/colors';
import { useAsync } from '@/hooks/useAsync';
import { t } from '@/i18n';

export default function StopsScreen() {
  const router = useRouter();
  const { data, error, loading, reload } = useAsync(() => getStops());
  const [query, setQuery] = useState('');
  const [selectedStopId, setSelectedStopId] = useState<number | null>(null);

  const filteredStops = useMemo(() => {
    const list = data ?? [];
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return list;
    return list.filter(
      (stop) =>
        stop.code.toLowerCase().includes(trimmed) ||
        stop.name.toLowerCase().includes(trimmed),
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
      {/* Barra de navegación entre Líneas y Paraderos */}
      <View style={styles.navBar}>
        <Pressable style={styles.navTab} onPress={() => router.push('./lines')}>
          <Text style={styles.navTabText}>{t.nav.lines}</Text>
        </Pressable>
        <Pressable style={[styles.navTab, styles.navTabActive]}>
          <Text style={[styles.navTabText, styles.navTabTextActive]}>{t.nav.stops}</Text>
        </Pressable>
      </View>

      <Text style={styles.title}>{t.stops.title}</Text>

      <TextInput
        style={styles.searchInput}
        placeholder={t.stops.searchPlaceholder}
        placeholderTextColor={colors.primary}
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
      />

      <FlatList
        data={filteredStops}
        keyExtractor={(s) => String(s.id)}
        ListHeaderComponent={
          filteredStops.length > 0 ? (
            <View>
              <Text style={styles.sectionTitle}>{t.stops.mapTitle}</Text>
              <Text style={styles.hintText}>{t.stops.mapHint}</Text>
              <StopsMap
                stops={filteredStops}
                selectedStopId={selectedStopId}
                onSelectStop={(stop) => setSelectedStopId(stop.id)}
                onOpenStopDetail={(stop) => router.push(`./stops/${stop.id}`)}
              />
            </View>
          ) : undefined
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {query.trim() ? t.stops.noSearchResults : t.stops.empty}
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`./stops/${item.id}`)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.codeBadge}>
                <Text style={styles.codeBadgeText}>{item.code}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.coordsText}>
                  {t.stops.coordinatesLabel} {item.latitude.toFixed(4)},{' '}
                  {item.longitude.toFixed(4)}
                </Text>
              </View>
            </View>

            <Text style={styles.linesLabel}>{t.stops.linesPassingLabel}</Text>
            {item.lines.length === 0 ? (
              <Text style={styles.noLinesText}>{t.stops.noLinesPassing}</Text>
            ) : (
              <View style={styles.linesRow}>
                {item.lines.map((line) => (
                  <View
                    key={`${item.id}-${line.id}`}
                    style={[styles.linePill, { backgroundColor: line.color }]}
                  >
                    <Text style={styles.linePillText}>
                      {line.code} · {line.name}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50, backgroundColor: colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.background,
  },
  navBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  navTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.secondary,
    alignItems: 'center',
  },
  navTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  navTabText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  navTabTextActive: {
    color: colors.white,
  },
  title: { fontSize: 24, fontWeight: '700', color: colors.primary, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.primary, marginBottom: 4 },
  hintText: { fontSize: 12, color: colors.text, marginBottom: 8 },
  searchInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    marginBottom: 14,
  },
  card: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  codeBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 46,
    alignItems: 'center',
  },
  codeBadgeText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  cardInfo: { flex: 1, gap: 2 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  coordsText: { color: colors.primary, fontSize: 12 },
  linesLabel: { color: colors.text, fontSize: 12, fontWeight: '600', marginTop: 4 },
  noLinesText: { color: colors.primary, fontSize: 12 },
  linesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  linePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  linePillText: { color: colors.white, fontSize: 12, fontWeight: '700' },
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