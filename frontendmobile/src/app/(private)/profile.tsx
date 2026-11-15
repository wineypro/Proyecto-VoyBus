import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { describeError } from '@/api/auth';
import {
  getMyProfile,
  removeFavoriteLine,
  removeFavoriteStop,
  updateMyProfile,
  UserProfile,
  verifyMyNewEmail,
} from '@/api/me';
import { RiderNav } from '@/components/RiderNav';
import { t } from '@/i18n';
import { useTheme } from '@/theme/ThemeContext';
import type { Palette } from '@/theme/ThemeContext';

const PRESET_AVATAR_1 = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200';
const PRESET_AVATAR_2 = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Campos editables del formulario (ACC-05)
  const [name, setName] = useState('');
  const [alias, setAlias] = useState('');
  const [email, setEmail] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Verificación de cambio de correo con código de 6 dígitos
  const [verificationCodeInput, setVerificationCodeInput] = useState('');

  // Control de cambios pendientes al intentar salir (validación ACC-05)
  const [pendingNavPath, setPendingNavPath] = useState<string | null>(null);

  const syncFormWithProfile = (p: UserProfile) => {
    setName(p.name);
    setAlias(p.alias ?? '');
    setEmail(p.email);
    setPhotoUrl(p.photoUrl ?? '');
  };

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyProfile();
      setProfile(data);
      syncFormWithProfile(data);
    } catch (e) {
      setError(describeError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasUnsavedChanges =
    !!profile &&
    (name.trim() !== profile.name ||
      alias.trim() !== (profile.alias ?? '') ||
      email.trim().toLowerCase() !== profile.email.toLowerCase() ||
      photoUrl.trim() !== (profile.photoUrl ?? ''));

  const handleNavigateAttempt = (targetPath: string) => {
    if (hasUnsavedChanges) {
      setPendingNavPath(targetPath);
      return false;
    }
    return true;
  };

  const handleSave = async (navigateAfter?: string | null) => {
    if (!profile) return;
    setError(null);
    setFeedback(null);

    const trimmedAlias = alias.trim();
    if (trimmedAlias && !/^[A-Za-z0-9]{1,15}$/.test(trimmedAlias)) {
      setError(t.profile.aliasError);
      return;
    }

    const emailChanged = email.trim().toLowerCase() !== profile.email.toLowerCase();

    setSubmitting(true);
    try {
      const updated = await updateMyProfile({
        name: name.trim(),
        alias: trimmedAlias || null,
        photoUrl: photoUrl.trim() || null,
        email: email.trim().toLowerCase(),
      });
      setProfile(updated);
      syncFormWithProfile(updated);
      setFeedback(
        emailChanged && updated.pendingEmail
          ? t.profile.emailCodeSentMessage
          : t.profile.savedMessage,
      );

      if (navigateAfter) {
        setPendingNavPath(null);
        router.push(navigateAfter as never);
      }
    } catch (e) {
      setError(describeError(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDiscardChanges = () => {
    if (profile) {
      syncFormWithProfile(profile);
    }
    const target = pendingNavPath;
    setPendingNavPath(null);
    if (target) {
      router.push(target as never);
    }
  };

  const handleVerifyNewEmail = async () => {
    setError(null);
    setFeedback(null);
    setSubmitting(true);
    try {
      const updated = await verifyMyNewEmail(verificationCodeInput.trim());
      setProfile(updated);
      syncFormWithProfile(updated);
      setVerificationCodeInput('');
      setFeedback(t.profile.savedMessage);
    } catch (e) {
      setError(describeError(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveFavLine = async (lineId: number) => {
    if (!profile) return;
    try {
      const favorites = await removeFavoriteLine(lineId);
      setProfile({ ...profile, favorites });
    } catch (e) {
      setError(describeError(e));
    }
  };

  const handleRemoveFavStop = async (stopId: number) => {
    if (!profile) return;
    try {
      const favorites = await removeFavoriteStop(stopId);
      setProfile({ ...profile, favorites });
    } catch (e) {
      setError(describeError(e));
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

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>{error ?? t.common.error}</Text>
        <Pressable style={styles.button} onPress={loadProfile}>
          <Text style={styles.buttonText}>{t.common.retry}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <RiderNav active="profile" onNavigateAttempt={handleNavigateAttempt} />

      <Text style={styles.title}>{t.profile.title}</Text>

      {/* Aviso si el usuario intenta salir con cambios pendientes (ACC-05) */}
      {pendingNavPath && (
        <View style={styles.unsavedBanner}>
          <Text style={styles.unsavedTitle}>{t.profile.unsavedBannerTitle}</Text>
          <Text style={styles.unsavedText}>{t.profile.unsavedBannerText}</Text>
          <View style={styles.unsavedActions}>
            <Pressable style={styles.button} onPress={() => handleSave(pendingNavPath)}>
              <Text style={styles.buttonText}>{t.common.save}</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={handleDiscardChanges}>
              <Text style={styles.secondaryButtonText}>{t.common.discard}</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => setPendingNavPath(null)}
            >
              <Text style={styles.secondaryButtonText}>{t.profile.continueEditing}</Text>
            </Pressable>
          </View>
        </View>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {feedback ? <Text style={styles.successText}>{feedback}</Text> : null}

      {/* Previsualización de imagen antes de guardarla y formulario de perfil (ACC-05) */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t.profile.photoPreviewTitle}</Text>
        <View style={styles.photoRow}>
          {photoUrl.trim() ? (
            <Image source={{ uri: photoUrl.trim() }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarPlaceholderText}>{t.profile.noPhoto}</Text>
            </View>
          )}
          <View style={styles.presetCol}>
            <Text style={styles.label}>{t.profile.presetPhotosLabel}</Text>
            <View style={styles.presetButtons}>
              <Pressable
                style={styles.presetBtn}
                onPress={() => setPhotoUrl(PRESET_AVATAR_1)}
              >
                <Text style={styles.presetBtnText}>{t.profile.photoPreset1}</Text>
              </Pressable>
              <Pressable
                style={styles.presetBtn}
                onPress={() => setPhotoUrl(PRESET_AVATAR_2)}
              >
                <Text style={styles.presetBtnText}>{t.profile.photoPreset2}</Text>
              </Pressable>
              <Pressable style={styles.presetBtn} onPress={() => setPhotoUrl('')}>
                <Text style={styles.presetBtnText}>{t.profile.photoPreset3}</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <Text style={styles.label}>{t.profile.photoUrlLabel}</Text>
        <TextInput
          style={styles.input}
          value={photoUrl}
          onChangeText={setPhotoUrl}
          placeholder={t.profile.photoUrlPlaceholder}
          placeholderTextColor={colors.primary}
          autoCapitalize="none"
        />

        <Text style={styles.label}>{t.profile.nameLabel}</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder={t.profile.namePlaceholder}
          placeholderTextColor={colors.primary}
        />

        <Text style={styles.label}>{t.profile.aliasLabel}</Text>
        <TextInput
          style={styles.input}
          value={alias}
          onChangeText={setAlias}
          placeholder={t.profile.aliasPlaceholder}
          placeholderTextColor={colors.primary}
          autoCapitalize="none"
          maxLength={15}
        />

        <Text style={styles.label}>{t.profile.emailLabel}</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder={t.profile.emailPlaceholder}
          placeholderTextColor={colors.primary}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={() => handleSave(null)}
            disabled={submitting}
          >
            <Text style={styles.buttonText}>{t.common.save}</Text>
          </Pressable>
          {hasUnsavedChanges && (
            <Pressable style={styles.secondaryButton} onPress={handleDiscardChanges}>
              <Text style={styles.secondaryButtonText}>{t.common.discard}</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Verificación de nuevo correo electrónico antes de reemplazar el anterior */}
      {profile.pendingEmail && (
        <View style={styles.pendingEmailCard}>
          <Text style={styles.sectionTitle}>
            {t.profile.pendingEmailTitle} {profile.pendingEmail}
          </Text>
          <Text style={styles.hintText}>{t.profile.pendingEmailHint}</Text>
          <TextInput
            style={styles.input}
            value={verificationCodeInput}
            onChangeText={(v) => setVerificationCodeInput(v.replace(/[^0-9]/g, '').slice(0, 6))}
            placeholder={t.profile.verifyCodePlaceholder}
            placeholderTextColor={colors.primary}
            keyboardType="number-pad"
            maxLength={6}
          />
          <Pressable
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleVerifyNewEmail}
            disabled={submitting}
          >
            <Text style={styles.buttonText}>{t.profile.verifyEmailButton}</Text>
          </Pressable>
        </View>
      )}

      {/* Consultar y quitar líneas o paraderos favoritos (ACC-05) */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t.profile.favoritesTitle}</Text>

        <Text style={styles.subtitle}>{t.profile.favoriteLinesSubtitle}</Text>
        {profile.favorites.lines.length === 0 ? (
          <Text style={styles.emptyText}>{t.profile.noFavoriteLines}</Text>
        ) : (
          profile.favorites.lines.map((line) => (
            <View key={line.id} style={styles.favRow}>
              <Pressable
                style={styles.favInfo}
                onPress={() => {
                  if (handleNavigateAttempt(`/lines/${line.id}`)) {
                    router.push(`/lines/${line.id}` as never);
                  }
                }}
              >
                <View style={[styles.badge, { backgroundColor: line.color }]}>
                  <Text style={styles.badgeText}>{line.code}</Text>
                </View>
                <Text style={styles.favName}>{line.name}</Text>
              </Pressable>
              <Pressable
                style={styles.removeBtn}
                onPress={() => handleRemoveFavLine(line.id)}
              >
                <Text style={styles.removeBtnText}>{t.profile.removeButton}</Text>
              </Pressable>
            </View>
          ))
        )}

        <Text style={styles.subtitle}>{t.profile.favoriteStopsSubtitle}</Text>
        {profile.favorites.stops.length === 0 ? (
          <Text style={styles.emptyText}>{t.profile.noFavoriteStops}</Text>
        ) : (
          profile.favorites.stops.map((stop) => (
            <View key={stop.id} style={styles.favRow}>
              <Pressable
                style={styles.favInfo}
                onPress={() => {
                  if (handleNavigateAttempt(`/stops/${stop.id}`)) {
                    router.push(`/stops/${stop.id}` as never);
                  }
                }}
              >
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>{stop.code}</Text>
                </View>
                <Text style={styles.favName}>{stop.name}</Text>
              </Pressable>
              <Pressable
                style={styles.removeBtn}
                onPress={() => handleRemoveFavStop(stop.id)}
              >
                <Text style={styles.removeBtnText}>{t.profile.removeButton}</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    scroll: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingTop: 50, paddingBottom: 40 },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      backgroundColor: colors.background,
    },
    title: { fontSize: 24, fontWeight: '700', color: colors.primary, marginBottom: 12 },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.primary, marginBottom: 8 },
    subtitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      marginTop: 10,
      marginBottom: 6,
    },
    card: {
      backgroundColor: colors.white,
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.secondary,
      gap: 8,
    },
    pendingEmailCard: {
      backgroundColor: colors.white,
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 2,
      borderColor: colors.accent,
      gap: 8,
    },
    unsavedBanner: {
      backgroundColor: colors.white,
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 2,
      borderColor: colors.accent,
      gap: 8,
    },
    unsavedTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
    unsavedText: { fontSize: 13, color: colors.primary },
    unsavedActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    photoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 6 },
    avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.secondary },
    avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
    avatarPlaceholderText: { fontSize: 11, fontWeight: '700', color: colors.text },
    presetCol: { flex: 1, gap: 6 },
    presetButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    presetBtn: {
      backgroundColor: colors.secondary,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    presetBtnText: { fontSize: 12, fontWeight: '600', color: colors.text },
    label: { fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 4 },
    input: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.secondary,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      color: colors.text,
    },
    actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
    button: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: 'center',
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: colors.onPrimary, fontWeight: '700', fontSize: 14 },
    secondaryButton: {
      backgroundColor: colors.secondary,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: 'center',
    },
    secondaryButtonText: { color: colors.text, fontWeight: '700', fontSize: 14 },
    favRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.background,
      padding: 10,
      borderRadius: 10,
      marginBottom: 6,
      gap: 8,
    },
    favInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      minWidth: 40,
      alignItems: 'center',
    },
    badgeText: { color: colors.onPrimary, fontWeight: '700', fontSize: 12 },
    favName: { fontSize: 14, fontWeight: '600', color: colors.text, flex: 1 },
    removeBtn: {
      backgroundColor: colors.error,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    removeBtnText: { color: colors.onPrimary, fontSize: 12, fontWeight: '700' },
    errorText: { color: colors.error, fontWeight: '700', fontSize: 14, marginBottom: 8 },
    successText: { color: colors.primary, fontWeight: '700', fontSize: 14, marginBottom: 8 },
    hintText: { fontSize: 12, color: colors.primary },
    emptyText: { fontSize: 13, color: colors.primary, marginBottom: 6 },
    text: { fontSize: 15, color: colors.text },
  });