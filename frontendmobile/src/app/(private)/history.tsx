import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { describeError } from '@/api/auth';
import { getLines, Line } from '@/api/lines';
import { getMyHistory, TripHistoryItem } from '@/api/me';
import { RiderNav } from '@/components/RiderNav';
import { t } from '@/i18n';
import { useTheme } from '@/theme/ThemeContext';
import type { Palette } from '@/theme/ThemeContext';

export default function HistoryScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [items, setItems] = useState<TripHistoryItem[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dateFilter, setDateFilter] = useState('');
  const [selectedLineId, setSelectedLineId] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<TripHistoryItem | null>(null);

  const loadData = async (date?: string, lineId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const [historyData, linesData] = await Promise.all([
        getMyHistory({ date, lineId }),
        getLines(),
      ]);
      setItems(historyData);
      setLines(linesData);
    } catch (e) {
      setError(describeError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(dateFilter, selectedLineId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLineId]);

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
        <Pressable
          style={styles.button}
          onPress={() => loadData(dateFilter, selectedLineId)}
        >
          <Text style={styles.buttonText}>{t.common.retry}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RiderNav active="history" />

      <Text style={styles.title}>{t.history.title}</Text>
      <Text style={styles.subtitle}>{t.history.subtitle}</Text>

      {/* Validación ACC-07: un paradero solicitado no se presenta como bajada confirmada */}
      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerText}>{t.history.disclaimer}</Text>
      </View>

      {/* Filtros por fecha y por línea (ACC-07) */}
      <View style={styles.filterCard}>
        <Text style={styles.filterLabel}>{t.history.filterDateLabel}</Text>
        <View style={styles.dateRow}>
          <TextInput
            style={styles.input}
            value={dateFilter}
            onChangeText={setDateFilter}
            placeholder={t.history.filterDatePlaceholder}
            placeholderTextColor={colors.primary}
          />
          <Pressable
            style={styles.smallButton}
            onPress={() => loadData(dateFilter, selectedLineId)}
          >
            <Text style={styles.buttonText}>{t.common.retry}</Text>
          </Pressable>
          {(dateFilter || selectedLineId) ? (
            <Pressable
              style={styles.clearButton}
              onPress={() => {
                setDateFilter('');
                setSelectedLineId('');
                loadData('', '');
              }}
            >
              <Text style={styles.clearButtonText}>{t.history.clearFilters}</Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.filterLabel}>{t.history.filterLineLabel}</Text>
        <View style={styles.linePillsRow}>
          <Pressable
            style={[styles.linePill, !selectedLineId && styles.linePillActive]}
            onPress={() => setSelectedLineId('')}
          >
            <Text
              style={[
                styles.linePillText,
                !selectedLineId && styles.linePillTextActive,
              ]}
            >
              {t.history.allLinesOption}
            </Text>
          </Pressable>
          {lines.map((line) => {
            const active = selectedLineId === String(line.id);
            return (
              <Pressable
                key={line.id}
                style={[styles.linePill, active && styles.linePillActive]}
                onPress={() => setSelectedLineId(String(line.id))}
              >
                <Text style={[styles.linePillText, active && styles.linePillTextActive]}>
                  {line.code}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {selectedRecord && (
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>{t.history.detailTitle}</Text>
          <Text style={styles.text}>
            {t.history.lineLabel} {selectedRecord.lineCode} · {selectedRecord.routeDirection}
          </Text>
          <Text style={styles.text}>
            {t.history.stopLabel} {selectedRecord.requestedStopName}
          </Text>
          <Text style={styles.text}>
            {t.history.statusLabel} {selectedRecord.finalStatus}
          </Text>
          <Text style={styles.text}>
            {t.history.reasonLabel} {selectedRecord.closeReason}
          </Text>
          <Pressable style={styles.smallButton} onPress={() => setSelectedRecord(null)}>
            <Text style={styles.buttonText}>{t.history.closeDetail}</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{t.history.emptyTitle}</Text>
            <Text style={styles.emptyText}>{t.history.emptyText}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.recordCard} onPress={() => setSelectedRecord(item)}>
            <Text style={styles.recordTitle}>
              {item.date} · {item.lineCode} ({item.routeDirection})
            </Text>
            <Text style={styles.text}>
              {t.history.stopLabel} {item.requestedStopName}
            </Text>
            <Text style={styles.recordStatus}>
              {item.finalStatus} — {item.closeReason}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    container: { flex: 1, padding: 20, paddingTop: 50, backgroundColor: colors.background },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      backgroundColor: colors.background,
    },
    title: { fontSize: 24, fontWeight: '700', color: colors.primary, marginBottom: 4 },
    subtitle: { fontSize: 13, color: colors.text, marginBottom: 10 },
    disclaimerBox: {
      backgroundColor: colors.secondary,
      padding: 10,
      borderRadius: 10,
      marginBottom: 12,
    },
    disclaimerText: { fontSize: 12, fontWeight: '600', color: colors.text },
    filterCard: {
      backgroundColor: colors.white,
      padding: 14,
      borderRadius: 12,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.secondary,
      gap: 8,
    },
    filterLabel: { fontSize: 13, fontWeight: '700', color: colors.primary },
    dateRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    input: {
      flex: 1,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.secondary,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: 14,
      color: colors.text,
    },
    linePillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    linePill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.secondary,
    },
    linePillActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    linePillText: { fontSize: 13, fontWeight: '600', color: colors.text },
    linePillTextActive: { color: colors.onPrimary },
    emptyCard: {
      backgroundColor: colors.white,
      padding: 24,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.secondary,
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
      textAlign: 'center',
    },
    emptyText: { fontSize: 14, color: colors.text, textAlign: 'center' },
    recordCard: {
      backgroundColor: colors.white,
      padding: 14,
      borderRadius: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.secondary,
      gap: 4,
    },
    recordTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
    recordStatus: { fontSize: 13, fontWeight: '600', color: colors.primary },
    detailCard: {
      backgroundColor: colors.white,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: colors.accent,
      gap: 6,
    },
    detailTitle: { fontSize: 16, fontWeight: '700', color: colors.primary },
    button: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: 'center',
    },
    smallButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
    },
    clearButton: {
      backgroundColor: colors.secondary,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
    },
    clearButtonText: { color: colors.text, fontWeight: '700', fontSize: 13 },
    buttonText: { color: colors.onPrimary, fontWeight: '700', fontSize: 13 },
    text: { fontSize: 14, color: colors.text },
  });