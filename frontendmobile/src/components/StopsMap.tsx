import { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';

import { Stop } from '@/api/stops';
import { colors } from '@/constants/colors';
import { t } from '@/i18n';

type Props = {
  stops: Stop[];
  selectedStopId?: number | null;
  onSelectStop?: (stop: Stop) => void;
  onOpenStopDetail?: (stop: Stop) => void;
};

const MAP_HEIGHT = 220;
const PADDING = 30;

export function StopsMap({
  stops,
  selectedStopId,
  onSelectStop,
  onOpenStopDetail,
}: Props) {
  const [mapWidth, setMapWidth] = useState(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    setMapWidth(e.nativeEvent.layout.width);
  };

  if (stops.length === 0) {
    return null;
  }

  const lats = stops.map((s) => s.latitude);
  const lons = stops.map((s) => s.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  const latRange = maxLat - minLat || 0.01;
  const lonRange = maxLon - minLon || 0.01;

  const usableWidth = Math.max(mapWidth - PADDING * 2, 100);
  const usableHeight = MAP_HEIGHT - PADDING * 2;

  const points = stops.map((stop) => {
    const x =
      stops.length === 1
        ? mapWidth / 2
        : PADDING + ((stop.longitude - minLon) / lonRange) * usableWidth;
    const y =
      stops.length === 1
        ? MAP_HEIGHT / 2
        : PADDING + ((maxLat - stop.latitude) / latRange) * usableHeight;
    return { ...stop, x, y };
  });

  const selectedStop = stops.find((s) => s.id === selectedStopId) ?? stops[0];

  return (
    <View style={styles.wrapper}>
      <View style={styles.mapCanvas} onLayout={handleLayout}>
        <View style={[styles.gridLineH, { top: '25%' }]} />
        <View style={[styles.gridLineH, { top: '50%' }]} />
        <View style={[styles.gridLineH, { top: '75%' }]} />
        <View style={[styles.gridLineV, { left: '25%' }]} />
        <View style={[styles.gridLineV, { left: '50%' }]} />
        <View style={[styles.gridLineV, { left: '75%' }]} />

        {mapWidth > 0 &&
          points.map((pt) => {
            const isSelected = pt.id === selectedStop?.id;
            return (
              <Pressable
                key={`stop-pin-${pt.id}`}
                onPress={() => onSelectStop?.(pt)}
                style={[
                  styles.pin,
                  {
                    left: pt.x - (isSelected ? 22 : 18),
                    top: pt.y - (isSelected ? 14 : 12),
                    backgroundColor: isSelected ? colors.accent : colors.primary,
                    borderColor: colors.white,
                  },
                ]}
              >
                <Text style={styles.pinText}>{pt.code}</Text>
              </Pressable>
            );
          })}
      </View>

      {selectedStop && (
        <View style={styles.footerInfo}>
          <View style={styles.footerTextCol}>
            <Text style={styles.footerTitle}>
              {selectedStop.code} · {selectedStop.name}
            </Text>
            <Text style={styles.footerCoords}>
              {t.stops.coordinatesLabel} {selectedStop.latitude.toFixed(4)},{' '}
              {selectedStop.longitude.toFixed(4)}
            </Text>
          </View>
          {onOpenStopDetail && (
            <Pressable
              style={styles.detailButton}
              onPress={() => onOpenStopDetail(selectedStop)}
            >
              <Text style={styles.detailButtonText}>{t.stops.openSelectedStop}</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  mapCanvas: {
    height: MAP_HEIGHT,
    backgroundColor: colors.background,
    position: 'relative',
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.secondary,
    opacity: 0.4,
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: colors.secondary,
    opacity: 0.4,
  },
  pin: {
    position: 'absolute',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },
  footerInfo: {
    padding: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.secondary,
    gap: 8,
  },
  footerTextCol: { gap: 2 },
  footerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  footerCoords: {
    fontSize: 12,
    color: colors.primary,
  },
  detailButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  detailButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});