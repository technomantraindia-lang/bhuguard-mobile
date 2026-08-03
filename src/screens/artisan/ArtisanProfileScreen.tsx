import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getArtisanProfile } from '../../api/artisanApi';
import { LoadingState } from '../../components/LoadingState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { BhuguardMaterialIcon } from '../../components/shared/BhuguardMaterialIcon';
import { RoleEnvironmentalBackground } from '../../components/shared/RoleEnvironmentalBackground';
import { useAssignedLocations } from '../../hooks/useAssignedLocations';
import { useLogout } from '../../hooks/useLogout';
import { useTranslation } from '../../i18n/I18nContext';
import type { ArtisanStackParamList } from '../../navigation/types';
import { setBiocharSyncArtisanId } from '../../services/biocharProductionSyncService';
import { hasPendingOfflineSubmissions } from '../../storage/offlineBiocharProductionDb';
import { getAuthUser } from '../../utils/authStorage';
import { artisanTheme } from '../../theme/artisanTheme';
import { spacing } from '../../theme';
import { pickString, type ApiRecord } from '../../utils/apiHelpers';
import { formatArtisanDisplayId } from '../../utils/displayIds';
import { translateStatus } from '../../utils/translateStatus';

type Nav = NativeStackNavigationProp<ArtisanStackParamList, 'ArtisanProfile'>;

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return 'AR';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function ChipList({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
  if (items.length === 0) {
    return <Text style={styles.emptyChip}>{emptyLabel}</Text>;
  }

  return (
    <View style={styles.chipWrap}>
      {items.map((item) => (
        <View key={item} style={styles.chip}>
          <Text style={styles.chipText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export function ArtisanProfileScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const logoutUser = useLogout();
  const assigned = useAssignedLocations('artisan');
  const [profile, setProfile] = useState<ApiRecord | null>(null);
  const [userRecord, setUserRecord] = useState<ApiRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const data = await getArtisanProfile();
      const payload = data as ApiRecord;
      setProfile((payload.artisan ?? payload) as ApiRecord);
      setUserRecord((payload.user as ApiRecord) ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const performLogout = useCallback(async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      // Pause artisan sync before clearing the token — never sync after logout.
      // Offline Pending Sync packages/photos remain on device (scoped by artisan_id).
      setBiocharSyncArtisanId(null);

      if (__DEV__) {
        console.log('[Bhuguard] Artisan logout: sync paused, offline queue preserved');
      }

      await logoutUser();

      if (__DEV__) {
        console.log('[Bhuguard] Artisan logout: session cleared, navigation reset to login');
      }
      // Do not setLoggingOut(false) here — navigation reset unmounts this screen.
    } catch (error) {
      if (__DEV__) {
        console.warn('[Bhuguard] Artisan logout error (session still cleared by logout service):', error);
      }
      setLoggingOut(false);
    }
  }, [loggingOut, logoutUser]);

  const handleLogout = useCallback(async () => {
    if (loggingOut) {
      return;
    }

    try {
      // Static imports only — dynamic import() can hit Metro async chunk loading which
      // calls DevSettings.reload and rejects with "Cannot read property 'reload' of undefined".
      const user = await getAuthUser();
      const artisanId = user?.artisan_profile?.id;
      let hasPending = false;

      if (artisanId) {
        try {
          hasPending = await hasPendingOfflineSubmissions(artisanId);
        } catch {
          hasPending = false;
        }
      }

      if (__DEV__) {
        console.log('[Bhuguard] Artisan logout pressed', { hasPending, artisanId: artisanId ?? null });
      }

      Alert.alert(
        hasPending ? 'Pending Biochar Uploads' : 'Logout',
        hasPending
          ? 'You have Biochar Production records waiting to sync. They will remain safely stored on this device and will resume when you sign in again with the same Artisan Pro account.'
          : 'Sign out from the Artisan Pro app?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: () => {
              void performLogout();
            },
          },
        ],
      );
    } catch (error) {
      if (__DEV__) {
        console.warn('[Bhuguard] Artisan logout confirmation failed:', error);
      }
      Alert.alert('Logout', 'Sign out from the Artisan Pro app?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            void performLogout();
          },
        },
      ]);
    }
  }, [loggingOut, performLogout]);

  const name = pickString(profile ?? {}, 'name');
  const code = formatArtisanDisplayId(profile);
  const mobile = pickString(profile ?? {}, 'mobile');
  const status = pickString(profile ?? {}, 'status');
  const username = pickString(userRecord ?? {}, 'username', 'name');
  const email = pickString(userRecord ?? {}, 'email');

  const districts = useMemo(
    () => [...new Set((assigned.locations.districts ?? []).map((item) => item.name).filter(Boolean))],
    [assigned.locations.districts],
  );
  const talukas = useMemo(
    () => [...new Set((assigned.locations.talukas ?? []).map((item) => item.name).filter(Boolean))],
    [assigned.locations.talukas],
  );
  const villages = useMemo(
    () => [...new Set((assigned.locations.villages ?? []).map((item) => item.name).filter(Boolean))],
    [assigned.locations.villages],
  );

  if (loading && !profile) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <LoadingState message="Loading profile..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <RoleEnvironmentalBackground />
      <ScreenHeader
        title="Artisan Pro Profile"
        subtitle="Account & assigned area"
        showBrandLogo
        logoOnPress={() => navigation.navigate('ArtisanDashboard')}
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initialsFromName(name !== '-' ? name : 'Artisan Pro')}</Text>
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroName}>{name !== '-' ? name : 'Artisan Pro'}</Text>
            <Text style={styles.heroCode}>{code !== '-' ? code : '—'}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>
                  {status !== '-' ? translateStatus(status, t) : translateStatus('active', t)}
                </Text>
              </View>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>Artisan Pro</Text>
              </View>
            </View>
          </View>
        </View>

        <Pressable style={styles.card} onPress={() => navigation.navigate('ArtisanSettings')}>
          <View style={styles.cardHeader}>
            <BhuguardMaterialIcon name="person" size={18} color={artisanTheme.actionGreen} />
            <Text style={styles.cardTitle}>{t('language.settingsTitle')}</Text>
          </View>
          <Text style={styles.securityHint}>{t('language.settingsSubtitle')}</Text>
        </Pressable>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <BhuguardMaterialIcon name="person" size={18} color={artisanTheme.actionGreen} />
            <Text style={styles.cardTitle}>Personal information</Text>
          </View>
          <InfoRow label="Mobile" value={mobile !== '-' ? mobile : '—'} />
          <InfoRow label="Username" value={username !== '-' ? username : '—'} />
          <InfoRow label="Email" value={email !== '-' ? email : '—'} />
          <InfoRow label="Account status" value={status !== '-' ? status.replace(/_/g, ' ') : 'Active'} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <BhuguardMaterialIcon name="location_on" size={18} color={artisanTheme.actionGreen} />
            <Text style={styles.cardTitle}>Assigned working area</Text>
          </View>
          <Text style={styles.sectionLabel}>Assigned Districts</Text>
          <ChipList items={districts} emptyLabel="No districts assigned" />
          <Text style={styles.sectionLabel}>Assigned Talukas</Text>
          <ChipList items={talukas} emptyLabel="No talukas assigned" />
          <Text style={styles.sectionLabel}>Assigned Villages</Text>
          <ChipList items={villages} emptyLabel="No villages assigned" />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <BhuguardMaterialIcon name="lock" size={18} color={artisanTheme.actionGreen} />
            <Text style={styles.cardTitle}>Account security</Text>
          </View>
          <Text style={styles.securityHint}>
            Logout clears only your session. Local Biochar production photos and Pending Sync packages stay on this
            device and remain scoped to your account.
          </Text>
          <Pressable
            style={[styles.logoutButton, loggingOut && styles.logoutButtonDisabled]}
            onPress={() => {
              void handleLogout();
            }}
            disabled={loggingOut}
            accessibilityRole="button"
          >
            <Text style={styles.logoutText}>{loggingOut ? 'Logging out...' : 'Logout'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  heroCard: {
    backgroundColor: artisanTheme.white,
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: artisanTheme.softBorder,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    ...artisanTheme.cardShadow,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: artisanTheme.actionGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: artisanTheme.white, fontWeight: '800', fontSize: 20 },
  heroCopy: { flex: 1, minWidth: 0, gap: 4 },
  heroName: { fontSize: 22, fontWeight: '800', color: artisanTheme.deepText },
  heroCode: { fontSize: 13, color: artisanTheme.secondaryText, fontWeight: '600' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  activeBadge: {
    backgroundColor: artisanTheme.lightGreenSurface,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeBadgeText: { color: artisanTheme.actionGreen, fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },
  roleBadge: {
    backgroundColor: artisanTheme.cream,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: artisanTheme.softBorder,
  },
  roleBadgeText: { color: artisanTheme.tertiary, fontSize: 11, fontWeight: '800' },
  card: {
    backgroundColor: artisanTheme.white,
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: artisanTheme.softBorder,
    gap: 10,
    ...artisanTheme.cardShadow,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: artisanTheme.tertiary },
  infoRow: { gap: 2 },
  infoLabel: { fontSize: 12, color: artisanTheme.secondaryText, fontWeight: '600' },
  infoValue: { fontSize: 15, color: artisanTheme.deepText, fontWeight: '700' },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: artisanTheme.secondaryText, marginTop: 4 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: artisanTheme.lightGreenSurface,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: { fontSize: 12, fontWeight: '700', color: artisanTheme.tertiary },
  emptyChip: { fontSize: 13, color: artisanTheme.secondaryText },
  securityHint: { fontSize: 13, lineHeight: 18, color: artisanTheme.secondaryText },
  logoutButtonDisabled: { opacity: 0.6 },
  logoutButton: {
    marginTop: 4,
    borderWidth: 1.5,
    borderColor: artisanTheme.error,
    backgroundColor: 'rgba(220, 38, 38, 0.06)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: { color: artisanTheme.error, fontWeight: '800', fontSize: 15 },
});
