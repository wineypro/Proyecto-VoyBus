import { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';

import { RouteStopItem } from '@/api/lines';
import { colors } from '@/constants/colors';
import { t } from '@/i18n';

type Props = {
  stops: RouteStopItem[];
  lineColor: string;
  selectedStopId?: number | null;
  onSelectStop?: (stop: RouteStopItem) => void;
};

const MAP_HEIGHT = 230;
const PADDING = 32;

export function RouteMap({ stops, lineColor, selectedStopId, onSelectStop }: Props) {
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
    const x = PADDING + ((stop.longitude - minLon) / lonRange) * usableWidth;
    const y = PADDING + ((maxLat - stop.latitude) / latRange) * usableHeight;
    return { ...stop, x, y };
  });

  const selectedStop = stops.find((s) => s.id === selectedStopId) ?? stops[0];

  return (
    <View style={styles.wrapper}>
      <View style={styles.mapCanvas} onLayout={handleLayout}>
        {/* Cuadrícula de referencia cartográfica */}
        <View style={[styles.gridLineH, { top: '25%' }]} />
        <View style={[styles.gridLineH, { top: '50%' }]} />
        <View style={[styles.gridLineH, { top: '75%' }]} />
        <View style={[styles.gridLineV, { left: '25%' }]} />
        <View style={[styles.gridLineV, { left: '50%' }]} />
        <View style={[styles.gridLineV, { left: '75%' }]} />

        {/* Segmentos del recorrido entre paraderos consecutivos */}
        {mapWidth > 0 &&
          points.map((pt, idx) => {
            if (idx === points.length - 1) return null;
            const next = points[idx + 1];
            const dx = next.x - pt.x;
            const dy = next.y - pt.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
            const cx = (pt.x + next.x) / 2;
            const cy = (pt.y + next.y) / 2;

            return (
              <View
                key={`seg-${pt.id}-${next.id}`}
                style={[
                  styles.segment,
                  {
                    width: length,
                    left: cx - length / 2,
                    top: cy - 2.5,
                    backgroundColor: lineColor,
                    transform: [{ rotate: `${angle}deg` }],
                  },
                ]}
              />
            );
          })}

        {/* Nodos de paraderos */}
        {mapWidth > 0 &&
          points.map((pt) => {
            const isSelected = pt.id === selectedStop?.id;
            return (
              <Pressable
                key={`node-${pt.id}-${pt.sequence}`}
                onPress={() => onSelectStop?.(pt)}
                style={[
                  styles.node,
                  {
                    left: pt.x - (isSelected ? 15 : 12),
                    top: pt.y - (isSelected ? 15 : 12),
                    width: isSelected ? 30 : 24,
                    height: isSelected ? 30 : 24,
                    borderRadius: isSelected ? 15 : 12,
                    backgroundColor: isSelected ? colors.accent : colors.white,
                    borderColor: lineColor,
                  },
                ]}
              >
                <Text style={[styles.nodeText, isSelected && styles.nodeTextSelected]}>
                  {pt.sequence}
                </Text>
              </Pressable>
            );
          })}
      </View>

      {selectedStop && (
        <View style={styles.footerInfo}>
          <Text style={styles.footerTitle}>
            {selectedStop.sequence}. {selectedStop.code} · {selectedStop.name}
          </Text>
          <Text style={styles.footerCoords}>
            {t.lines.coordinatesLabel} {selectedStop.latitude.toFixed(4)},{' '}
            {selectedStop.longitude.toFixed(4)}
          </Text>
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
  segment: {
    position: 'absolute',
    height: 5,
    borderRadius: 3,
  },
  node: {
    position: 'absolute',
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  nodeTextSelected: {
    color: colors.white,
  },
  footerInfo: {
    padding: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.secondary,
    gap: 2,
  },
  footerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  footerCoords: {
    fontSize: 12,
    color: colors.primary,
  },
});