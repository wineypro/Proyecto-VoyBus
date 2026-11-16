import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { addFavoriteStop, getMyFavorites, removeFavoriteStop } from '@/api/me';
import { getStop } from '@/api/stops';
import { useAuth } from '@/auth/AuthContext';
import { StopsMap } from '@/components/StopsMap';
import { useAsync } from '@/hooks/useAsync';
import { t } from '@/i18n';
import { useTheme } from '@/theme/ThemeContext';
import type { Palette } from '@/theme/ThemeContext';

export default function StopDetailScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const stopId = Number(id);

  const { data: stop, error, loading, reload } = useAsync(() => getStop(stopId));
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsFavorite(false);
      return;
    }
    getMyFavorites()
      .then((favs) => setIsFavorite(favs.stops.some((s) => s.id === stopId)))
      .catch(() => setIsFavorite(false));
  }, [stopId, user]);

  const toggleFavorite = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    try {
      if (isFavorite) {
        await removeFavoriteStop(stopId);
        setIsFavorite(false);
      } else {
        await addFavoriteStop(stopId);
        setIsFavorite(true);
      }
    } catch {
      // Silencioso si falla momentáneamente
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.text}>{t.common.loading}</Text>
      </View>
    );
  }

  if (error || !stop) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>{error ?? t.common.error}</Text>
        <Pressable style={styles.button} onPress={reload}>
          <Text style={styles.buttonText}>{t.common.retry}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topRow}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>{t.common.back}</Text>
        </Pressable>
        <Pressable
          style={[styles.favButton, isFavorite && styles.favButtonActive]}
          onPress={toggleFavorite}
        >
          <Text style={[styles.favButtonText, isFavorite && styles.favButtonTextActive]}>
            {isFavorite ? t.stops.removeFavorite : t.stops.addFavorite}
          </Text>
        </Pressable>
      </View>

      <View style={styles.headerCard}>
        <View style={styles.codeBadge}>
          <Text style={styles.codeBadgeText}>{stop.code}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{stop.name}</Text>
          <Text style={styles.coords}>
            {t.stops.coordinatesLabel} {stop.latitude.toFixed(4)},{' '}
            {stop.longitude.toFixed(4)}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>{t.stops.locationTitle}</Text>
      <StopsMap stops={[stop]} selectedStopId={stop.id} />

      <Text style={styles.sectionTitle}>{t.stops.linesPassingLabel}</Text>
      {stop.lines.length === 0 ? (
        <Text style={styles.text}>{t.stops.noLinesPassing}</Text>
      ) : (
        stop.lines.map((line) => (
          <View key={line.id} style={styles.lineCard}>
            <View style={styles.lineHeader}>
              <View style={[styles.lineBadge, { backgroundColor: line.color }]}>
                <Text style={styles.lineBadgeText}>{line.code}</Text>
              </View>
              <Text style={styles.lineName}>{line.name}</Text>
            </View>

            <Text style={styles.directionsTitle}>{t.stops.directionsLabel}</Text>
            {line.directions.map((dir) => (
              <View key={dir.routeId} style={styles.directionItem}>
                <Text style={styles.directionText}>• {dir.direction}</Text>
                <Text style={styles.directionMeta}>
                  {t.stops.stopOrderLabel} {dir.sequence} · {dir.operatingDays} ({dir.schedule})
                </Text>
              </View>
            ))}

            <Pressable
              style={styles.routeLinkButton}
              onPress={() => router.push(`../lines/${line.id}`)}
            >
              <Text style={styles.routeLinkText}>{t.stops.viewLineRoute}</Text>
            </Pressable>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingTop: 50, paddingBottom: 40 },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      backgroundColor: colors.background,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
      gap: 10,
    },
    backButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: colors.secondary,
    },
    backText: { color: colors.text, fontWeight: '700', fontSize: 14 },
    favButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    favButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    favButtonText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
    favButtonTextActive: { color: colors.onPrimary },
    headerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.white,
      padding: 16,
      borderRadius: 12,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.secondary,
    },
    codeBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
      minWidth: 52,
      alignItems: 'center',
    },
    codeBadgeText: { color: colors.onPrimary, fontWeight: '700', fontSize: 16 },
    headerInfo: { flex: 1, gap: 4 },
    title: { fontSize: 20, fontWeight: '700', color: colors.text },
    coords: { fontSize: 13, color: colors.primary },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.primary,
      marginTop: 6,
      marginBottom: 8,
    },
    lineCard: {
      backgroundColor: colors.white,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.secondary,
      gap: 8,
    },
    lineHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    lineBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    lineBadgeText: { color: colors.onPrimary, fontWeight: '700', fontSize: 14 },
    lineName: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
    directionsTitle: { fontSize: 13, fontWeight: '700', color: colors.primary, marginTop: 4 },
    directionItem: {
      backgroundColor: colors.background,
      padding: 10,
      borderRadius: 8,
      gap: 2,
    },
    directionText: { fontSize: 14, fontWeight: '600', color: colors.text },
    directionMeta: { fontSize: 12, color: colors.primary },
    routeLinkButton: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primary,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      marginTop: 4,
    },
    routeLinkText: { color: colors.onPrimary, fontWeight: '600', fontSize: 13 },
    text: { color: colors.text, fontSize: 16 },
    button: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
    },
    buttonText: { color: colors.onPrimary, fontWeight: '600' },
  });