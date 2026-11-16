import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { RouteStopItem } from '@/api/lines';
import { OsmMap } from '@/components/OsmMap';
import { t } from '@/i18n';
import { useTheme } from '@/theme/ThemeContext';
import type { Palette } from '@/theme/ThemeContext';

type Props = {
  stops: RouteStopItem[];
  lineColor: string;
  selectedStopId?: number | null;
  onSelectStop?: (stop: RouteStopItem) => void;
};

const MAP_HEIGHT = 300;

export function RouteMap({ stops, lineColor, selectedStopId, onSelectStop }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (stops.length === 0) {
    return null;
  }

  const selectedStop = stops.find((s) => s.id === selectedStopId) ?? stops[0];

  return (
    <View style={styles.wrapper}>
      <OsmMap
        height={MAP_HEIGHT}
        markers={stops.map((s) => ({
          id: s.id,
          label: String(s.sequence),
          latitude: s.latitude,
          longitude: s.longitude,
        }))}
        path={stops.map((s) => ({ latitude: s.latitude, longitude: s.longitude }))}
        pathColor={lineColor}
        markerColor={lineColor}
        selectedColor={colors.accent}
        textColor={colors.text}
        selectedId={selectedStop?.id ?? null}
        onSelect={(id) => {
          const stop = stops.find((s) => s.id === id);
          if (stop) onSelectStop?.(stop);
        }}
      />

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

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: colors.white,
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.secondary,
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
