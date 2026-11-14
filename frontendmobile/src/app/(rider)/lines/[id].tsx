import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getLine } from '@/api/lines';
import { RouteMap } from '@/components/RouteMap';
import { colors } from '@/constants/colors';
import { useAsync } from '@/hooks/useAsync';
import { t } from '@/i18n';

export default function LineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const lineId = Number(id);

  const { data: line, error, loading, reload } = useAsync(() => getLine(lineId));
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [selectedStopId, setSelectedStopId] = useState<number | null>(null);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.text}>{t.common.loading}</Text>
      </View>
    );
  }

  if (error || !line) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>{error ?? t.common.error}</Text>
        <Pressable style={styles.button} onPress={reload}>
          <Text style={styles.buttonText}>{t.common.retry}</Text>
        </Pressable>
      </View>
    );
  }

  const routes = line.routes ?? [];
  const activeRoute = routes[selectedRouteIndex] ?? routes[0];
  const isSuspended = line.status === 'suspended';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>{t.common.back}</Text>
      </Pressable>

      {/* Cabecera de la línea */}
      <View style={styles.headerCard}>
        <View style={[styles.badge, { backgroundColor: line.color }]}>
          <Text style={styles.badgeText}>{line.code}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{line.name}</Text>
          <Text style={styles.subtitle}>
            {t.lines.routeLabel} {line.origin} → {line.destination}
          </Text>
        </View>
      </View>

      {/* Aviso si la línea está temporalmente suspendida */}
      {isSuspended && (
        <View style={styles.suspendedBanner}>
          <Text style={styles.suspendedBannerText}>{t.lines.suspendedNotice}</Text>
        </View>
      )}

      {routes.length === 0 || !activeRoute ? (
        <Text style={styles.text}>{t.lines.noRoutes}</Text>
      ) : (
        <>
          {/* Selector de recorrido / sentido */}
          <Text style={styles.sectionTitle}>{t.lines.directionsTitle}</Text>
          <View style={styles.tabsRow}>
            {routes.map((route, idx) => {
              const selected = idx === selectedRouteIndex;
              return (
                <Pressable
                  key={route.id}
                  style={[styles.tabButton, selected && styles.tabButtonActive]}
                  onPress={() => {
                    setSelectedRouteIndex(idx);
                    setSelectedStopId(route.stops[0]?.id ?? null);
                  }}
                >
                  <Text style={[styles.tabText, selected && styles.tabTextActive]}>
                    {route.direction}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Días y horarios de funcionamiento */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>{t.lines.scheduleTitle}</Text>
            <Text style={styles.infoText}>
              {activeRoute.operatingDays} · {activeRoute.schedule}
            </Text>
            <Text style={styles.infoSubtext}>
              {t.lines.routeLabel} {activeRoute.origin} → {activeRoute.destination}
            </Text>
          </View>

          {/* Recorrido en el mapa */}
          <Text style={styles.sectionTitle}>{t.lines.mapTitle}</Text>
          <Text style={styles.hintText}>{t.lines.mapInteractiveHint}</Text>
          <RouteMap
            stops={activeRoute.stops}
            lineColor={line.color}
            selectedStopId={selectedStopId}
            onSelectStop={(stop) => setSelectedStopId(stop.id)}
          />

          {/* Lista de paraderos ordenados según el sentido seleccionado */}
          <Text style={styles.sectionTitle}>{t.lines.stopsTitle}</Text>
          {activeRoute.stops.map((stop) => {
            const isSelected = stop.id === selectedStopId;
            return (
              <Pressable
                key={`${activeRoute.id}-${stop.id}-${stop.sequence}`}
                style={[styles.stopCard, isSelected && styles.stopCardSelected]}
                onPress={() => setSelectedStopId(stop.id)}
              >
                <View style={[styles.sequenceCircle, { backgroundColor: line.color }]}>
                  <Text style={styles.sequenceText}>{stop.sequence}</Text>
                </View>
                <View style={styles.stopInfo}>
                  <Text style={styles.stopName}>
                    {stop.code} · {stop.name}
                  </Text>
                  <Text style={styles.stopCoords}>
                    {t.lines.coordinatesLabel} {stop.latitude.toFixed(4)},{' '}
                    {stop.longitude.toFixed(4)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 50, paddingBottom: 40 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.background,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.secondary,
    marginBottom: 14,
  },
  backText: { color: colors.text, fontWeight: '700', fontSize: 14 },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  badge: {
    minWidth: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  badgeText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  headerInfo: { flex: 1, gap: 4 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: colors.primary },
  suspendedBanner: {
    backgroundColor: colors.accent,
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  suspendedBannerText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 8,
    marginBottom: 8,
  },
  hintText: { fontSize: 12, color: colors.text, marginBottom: 8 },
  tabsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  tabButton: {
    flex: 1,
    minWidth: 140,
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.secondary,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: { color: colors.text, fontWeight: '600', fontSize: 13, textAlign: 'center' },
  tabTextActive: { color: colors.white },
  infoBox: {
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.secondary,
    gap: 4,
  },
  infoTitle: { fontSize: 13, fontWeight: '700', color: colors.primary },
  infoText: { fontSize: 15, fontWeight: '600', color: colors.text },
  infoSubtext: { fontSize: 13, color: colors.primary },
  stopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  stopCardSelected: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  sequenceCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sequenceText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  stopInfo: { flex: 1, gap: 2 },
  stopName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  stopCoords: { color: colors.primary, fontSize: 12 },
  text: { color: colors.text, fontSize: 16 },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  buttonText: { color: colors.white, fontWeight: '600' },
});