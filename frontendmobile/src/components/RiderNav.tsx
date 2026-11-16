import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthContext';
import { t } from '@/i18n';
import { useTheme } from '@/theme/ThemeContext';
import type { Palette } from '@/theme/ThemeContext';

type ActiveTab = 'lines' | 'stops' | 'profile' | 'history' | 'account';

type Props = {
  active: ActiveTab;
  onNavigateAttempt?: (targetPath: string) => boolean;
};

export function RiderNav({ active, onNavigateAttempt }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const { user } = useAuth();

  const navigateTo = (tab: ActiveTab, path: string) => {
    if (tab === active) return;
    if (onNavigateAttempt && !onNavigateAttempt(path)) {
      return;
    }
    router.push(path as never);
  };

  return (
    <View style={styles.navBar}>
      {/* Íconos claros de la barra de estado sobre la franja verde */}
      <StatusBar style="light" />
      <Pressable
        style={[styles.navTab, active === 'lines' && styles.navTabActive]}
        onPress={() => navigateTo('lines', '/lines')}
      >
        <Text style={[styles.navTabText, active === 'lines' && styles.navTabTextActive]}>
          {t.nav.lines}
        </Text>
      </Pressable>

      <Pressable
        style={[styles.navTab, active === 'stops' && styles.navTabActive]}
        onPress={() => navigateTo('stops', '/stops')}
      >
        <Text style={[styles.navTabText, active === 'stops' && styles.navTabTextActive]}>
          {t.nav.stops}
        </Text>
      </Pressable>

      {user ? (
        <>
          <Pressable
            style={[styles.navTab, active === 'profile' && styles.navTabActive]}
            onPress={() => navigateTo('profile', '/profile')}
          >
            <Text style={[styles.navTabText, active === 'profile' && styles.navTabTextActive]}>
              {t.nav.profile}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.navTab, active === 'history' && styles.navTabActive]}
            onPress={() => navigateTo('history', '/history')}
          >
            <Text style={[styles.navTabText, active === 'history' && styles.navTabTextActive]}>
              {t.nav.history}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.navTab, active === 'account' && styles.navTabActive]}
            onPress={() => navigateTo('account', '/account')}
          >
            <Text style={[styles.navTabText, active === 'account' && styles.navTabTextActive]}>
              {t.nav.account}
            </Text>
          </Pressable>
        </>
      ) : (
        <Pressable
          style={styles.navTab}
          onPress={() => navigateTo('account', '/login')}
        >
          <Text style={styles.navTabText}>{t.nav.login}</Text>
        </Pressable>
      )}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    // Franja verde recta de borde a borde. Las pantallas usan padding 20 y paddingTop 50,
    // por eso los márgenes negativos: así la franja llega a los bordes y al tope.
    navBar: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginHorizontal: -20,
      marginTop: -50,
      marginBottom: 18,
      paddingTop: 50,
      paddingHorizontal: 20,
      paddingBottom: 16,
      backgroundColor: colors.primary,
    },
    navTab: {
      flexGrow: 1,
      minWidth: 68,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 10,
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.35)',
      alignItems: 'center',
    },
    navTabActive: {
      backgroundColor: '#FFFFFF',
      borderColor: '#FFFFFF',
    },
    navTabText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.onPrimary,
    },
    navTabTextActive: {
      color: colors.primary,
    },
  });
