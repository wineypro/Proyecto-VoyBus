import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Stop } from '@/api/stops';
import { OsmMap } from '@/components/OsmMap';
import { t } from '@/i18n';
import { useTheme } from '@/theme/ThemeContext';
import type { Palette } from '@/theme/ThemeContext';

type Props = {
  stops: Stop[];
  selectedStopId?: number | null;
  onSelectStop?: (stop: Stop) => void;
  onOpenStopDetail?: (stop: Stop) => void;
};

const MAP_HEIGHT = 300;

export function StopsMap({
  stops,
  selectedStopId,
  onSelectStop,
  onOpenStopDetail,
}: Props) {
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
          label: s.code,
          latitude: s.latitude,
          longitude: s.longitude,
        }))}
        markerColor={colors.primary}
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
      color: colors.onPrimary,
      fontSize: 12,
      fontWeight: '600',
    },
  });