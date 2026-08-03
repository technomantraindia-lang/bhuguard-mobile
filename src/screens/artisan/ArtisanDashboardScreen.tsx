import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../../api/authApi';
import {
  defaultArtisanDashboard,
  getArtisanAllocatedLocations,
  getArtisanDashboard,
  getArtisanProfile,
} from '../../api/artisanApi';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { LiveWorkCheckinCard } from '../../components/artisan/LiveWorkCheckinCard';
import { BhuguardLogo } from '../../components/shared/BhuguardLogo';
import { BhuguardMaterialIcon, type BhuguardIconName } from '../../components/shared/BhuguardMaterialIcon';
import { useArtisanWorkSession } from '../../context/ArtisanWorkSessionContext';
import { useAssignedLocations } from '../../hooks/useAssignedLocations';
import { useUnreadNotificationCount } from '../../hooks/useUnreadNotificationCount';
import { LOGO_SIZES } from '../../constants/branding';
import type { ArtisanStackParamList } from '../../navigation/types';
import { countOfflineSubmissionsByStatus } from '../../storage/offlineBiocharProductionDb';
import {
  findIncompleteBiocharProductionDraft,
  type IncompleteBiocharProductionDraftSummary,
} from '../../storage/biocharProductionDraftStorage';
import {
  startBiocharProductionSyncListeners,
  syncPendingBiocharProductions,
} from '../../services/biocharProductionSyncService';
import { artisanTheme } from '../../theme/artisanTheme';
import { spacing } from '../../theme';
import { pickString, type ApiRecord } from '../../utils/apiHelpers';
import { getAuthUser } from '../../utils/authStorage';
import { formatArtisanDisplayId } from '../../utils/displayIds';

function resolveArtisanDashboardError(err: unknown): string {
  const message = getApiErrorMessage(err, 'Dashboard data could not be loaded. Please retry.');
  const lower = message.toLowerCase();

  if (
    lower.includes('403') ||
    lower.includes('401') ||
    lower.includes('permission') ||
    lower.includes('not authorized') ||
    lower.includes('artisan profile not found') ||
    lower.includes('session expired')
  ) {
    return 'Your Artisan Pro access is not configured. Please contact Admin.';
  }

  if (
    lower.includes('server error') ||
    lower.includes('500') ||
    lower.includes('cannot read property') ||
    lower.includes("cannot read properties of")
  ) {
    return 'Dashboard data could not be loaded. Please retry.';
  }

  return message || 'Dashboard data could not be loaded. Please retry.';
}

type Nav = NativeStackNavigationProp<ArtisanStackParamList, 'ArtisanDashboard'>;

const CARD_ACCENTS = {
  find: {
    accent: artisanTheme.tertiary,
    bubble: 'rgba(11, 46, 31, 0.10)',
  },
  production: {
    accent: artisanTheme.primary,
    bubble: 'rgba(133, 201, 92, 0.18)',
  },
  application: {
    accent: artisanTheme.actionGreen,
    bubble: 'rgba(133, 201, 92, 0.18)',
  },
  submitted: {
    accent: artisanTheme.tealAccent,
    bubble: 'rgba(42, 157, 143, 0.14)',
  },
  support: {
    accent: artisanTheme.tertiary,
    bubble: 'rgba(11, 46, 31, 0.10)',
  },
} as const;

interface DashboardCardProps {
  title: string;
  description: string;
  icon: BhuguardIconName;
  accent: string;
  bubble: string;
  onPress: () => void;
  accessibilityLabel: string;
  fullWidth?: boolean;
}

function DashboardCard({
  title,
  description,
  icon,
  accent,
  bubble,
  onPress,
  accessibilityLabel,
  fullWidth = false,
}: DashboardCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        fullWidth ? styles.cardFull : styles.cardHalf,
        pressed ? styles.cardPressed : null,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={[styles.cardAccent, { backgroundColor: accent }]} />
      <View style={[styles.iconBubble, { backgroundColor: bubble }]}>
        <BhuguardMaterialIcon name={icon} size={22} color={accent} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
      <View style={styles.cardFooter}>
        <Text style={[styles.cardAction, { color: accent }]}>Open</Text>
        <BhuguardMaterialIcon name="chevron_right" size={18} color={accent} />
      </View>
    </Pressable>
  );
}

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

export function ArtisanDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { width } = useWindowDimensions();
  const twoColumn = width >= 360;
  const assigned = useAssignedLocations('artisan');
  const { unreadCount } = useUnreadNotificationCount();
  const { ensureCheckedInOrPrompt } = useArtisanWorkSession();
  const [dashboard, setDashboard] = useState<ApiRecord>(defaultArtisanDashboard);
  const [profile, setProfile] = useState<ApiRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emptyNotice, setEmptyNotice] = useState(false);
  const hasLoadedRef = useRef(false);
  const dashboardLoadingRef = useRef(false);
  const lastDashboardLoadAtRef = useRef(0);
  const syncStartedRef = useRef(false);

  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [syncFailedCount, setSyncFailedCount] = useState(0);
  const [incompleteDraft, setIncompleteDraft] = useState<IncompleteBiocharProductionDraftSummary | null>(null);

  const load = useCallback(async (options?: { force?: boolean; silent?: boolean }) => {
    const force = options?.force === true;
    const silent = options?.silent === true || hasLoadedRef.current;

    if (dashboardLoadingRef.current) {
      return;
    }

    const now = Date.now();
    // Avoid focus thrash / repeated silent reloads while staying on the screen.
    if (!force && hasLoadedRef.current && now - lastDashboardLoadAtRef.current < 45_000) {
      return;
    }

    dashboardLoadingRef.current = true;
    if (!silent) {
      setLoading(true);
    }

    setError(null);

    try {
      const authUser = await getAuthUser();
      const artisanId = authUser?.artisan_profile?.id ?? null;

      if (!syncStartedRef.current) {
        syncStartedRef.current = true;
        try {
          startBiocharProductionSyncListeners(artisanId);
          void syncPendingBiocharProductions(artisanId);
        } catch {
          // Offline sync is optional on older native builds.
        }
      }

      const [dashboardResult, profileData, allocated] = await Promise.all([
        getArtisanDashboard(),
        getArtisanProfile().catch(() => null),
        getArtisanAllocatedLocations().catch(() => null),
      ]);

      let safeDashboard = dashboardResult?.dashboard ?? defaultArtisanDashboard;
      const area = safeDashboard.assigned_area as ApiRecord | undefined;
      const areaHasPlaces =
        (Array.isArray(area?.villages) && area.villages.length > 0) ||
        (Array.isArray(area?.talukas) && area.talukas.length > 0) ||
        (Array.isArray(area?.districts) && area.districts.length > 0) ||
        area?.has_assignment === true;

      if (
        allocated &&
        (allocated.villages.length > 0 ||
          allocated.talukas.length > 0 ||
          allocated.districts.length > 0 ||
          allocated.has_assignment)
      ) {
        safeDashboard = {
          ...safeDashboard,
          assigned_area: allocated,
          has_assignment: allocated.has_assignment,
        };
      }

      setDashboard(safeDashboard);

      const hasIdentity =
        Boolean(safeDashboard.artisan_name) ||
        Boolean(safeDashboard.artisan_code) ||
        Boolean(profileData);
      const hasAssignmentSignal =
        areaHasPlaces ||
        Boolean(safeDashboard.has_assignment) ||
        Boolean(allocated?.has_assignment) ||
        (allocated?.villages.length ?? 0) > 0;
      // Only show empty notice when API truly returned nothing useful.
      setEmptyNotice(!dashboardResult?.hasData && !hasIdentity && !hasAssignmentSignal);

      if (profileData) {
        const profileRoot = (profileData as ApiRecord) ?? {};
        setProfile((profileRoot.artisan as ApiRecord | undefined) ?? (profileRoot as ApiRecord));
      }

      // Do not call assigned.refresh() here — that caused duplicate allocated-locations
      // fetches and focus-effect churn. Seed hook state only when we already have places.
      if (
        allocated &&
        (allocated.villages.length > 0 ||
          allocated.talukas.length > 0 ||
          allocated.districts.length > 0)
      ) {
        // no-op seed: locationSummary already reads dashboard.assigned_area
      }

      if (artisanId) {
        try {
          const counts = await countOfflineSubmissionsByStatus(artisanId);
          setPendingSyncCount((counts.pending_sync ?? 0) + (counts.syncing ?? 0));
          setSyncFailedCount(counts.sync_failed ?? 0);
        } catch {
          setPendingSyncCount(0);
          setSyncFailedCount(0);
        }
      } else {
        setPendingSyncCount(0);
        setSyncFailedCount(0);
      }

      try {
        const draft = await findIncompleteBiocharProductionDraft({
          apiMode: 'artisan',
          userId: authUser?.id ?? null,
        });
        setIncompleteDraft(draft);
      } catch {
        setIncompleteDraft(null);
      }

      hasLoadedRef.current = true;
      lastDashboardLoadAtRef.current = Date.now();
    } catch (err) {
      if (!silent) {
        // Keep previous dashboard if we already had one; avoid blanking assigned area.
        if (!hasLoadedRef.current) {
          setDashboard(defaultArtisanDashboard);
        }
        setEmptyNotice(false);
        setError(resolveArtisanDashboardError(err));
      } else if (hasLoadedRef.current) {
        setError(resolveArtisanDashboardError(err));
      }
    } finally {
      dashboardLoadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load({ force: !hasLoadedRef.current, silent: hasLoadedRef.current });
      return () => {};
    }, [load]),
  );

  const artisanName = useMemo(() => {
    const fromProfile = pickString(profile ?? {}, 'name');
    const fromDashboard = pickString(dashboard ?? {}, 'artisan_name', 'artisanName');

    if (fromProfile !== '-') {
      return fromProfile;
    }

    if (fromDashboard !== '-') {
      return fromDashboard;
    }

    return 'Artisan Pro';
  }, [dashboard, profile]);

  const artisanCode = formatArtisanDisplayId(profile);
  const submittedCount = Number(dashboard?.submitted_production_count ?? 0);
  const pendingLabel =
    pendingSyncCount + syncFailedCount > 0
      ? ` · ${pendingSyncCount} pending sync${syncFailedCount > 0 ? `, ${syncFailedCount} failed` : ''}`
      : '';

  const locationSummary = useMemo(() => {
    const districts = Array.isArray(assigned?.locations?.districts)
      ? assigned.locations.districts.map((item) => item.name).filter(Boolean)
      : [];
    const talukas = Array.isArray(assigned?.locations?.talukas)
      ? assigned.locations.talukas.map((item) => item.name).filter(Boolean)
      : [];
    const villages = Array.isArray(assigned?.locations?.villages)
      ? assigned.locations.villages.map((item) => item.name).filter(Boolean)
      : [];

    // Prefer dashboard assigned_area when allocated-locations is empty.
    const fromDashboard = (dashboard?.assigned_area ?? dashboard?.assignedArea) as
      | Record<string, unknown>
      | undefined;
    const dashDistricts = Array.isArray(fromDashboard?.districts)
      ? (fromDashboard.districts as Array<{ name?: string }>).map((item) => item.name).filter(Boolean)
      : [];
    const dashTalukas = Array.isArray(fromDashboard?.talukas)
      ? (fromDashboard.talukas as Array<{ name?: string }>).map((item) => item.name).filter(Boolean)
      : [];
    const dashVillages = Array.isArray(fromDashboard?.villages)
      ? (fromDashboard.villages as Array<{ name?: string }>).map((item) => item.name).filter(Boolean)
      : [];

    const resolvedDistricts = districts.length ? districts : (dashDistricts as string[]);
    const resolvedTalukas = talukas.length ? talukas : (dashTalukas as string[]);
    const resolvedVillages = villages.length ? villages : (dashVillages as string[]);

    if (resolvedDistricts.length || resolvedTalukas.length || resolvedVillages.length) {
      const parts = [
        resolvedDistricts.length
          ? `${resolvedDistricts.length} district${resolvedDistricts.length === 1 ? '' : 's'}: ${resolvedDistricts.slice(0, 2).join(', ')}`
          : '',
        resolvedTalukas.length
          ? `${resolvedTalukas.length} taluka${resolvedTalukas.length === 1 ? '' : 's'}: ${resolvedTalukas.slice(0, 2).join(', ')}`
          : '',
        resolvedVillages.length
          ? `${resolvedVillages.length} village${resolvedVillages.length === 1 ? '' : 's'}: ${resolvedVillages.slice(0, 3).join(', ')}`
          : '',
      ].filter(Boolean);

      return parts.join(' · ');
    }

    if (assigned.hasAssignment || Boolean(dashboard?.has_assignment)) {
      return 'Assigned area configured · villages syncing';
    }

    if (assigned.error) {
      return 'Unable to load assigned area · pull to refresh';
    }

    const village = pickString(profile ?? {}, 'village');

    return village !== '-' ? village : 'No assigned area yet';
  }, [assigned.error, assigned.hasAssignment, assigned.locations, dashboard, profile]);

  if (loading && !hasLoadedRef.current) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <LoadingState message="Loading Artisan Pro dashboard..." />
      </SafeAreaView>
    );
  }

  if (error && !hasLoadedRef.current) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ErrorState message={error} onRetry={() => void load({ force: true })} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <BhuguardLogo size={LOGO_SIZES.dashboardHeader} animation="none" />
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Artisan Pro Dashboard
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              Biochar Operations
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.iconButton}
            onPress={() => navigation.navigate('ArtisanNotifications')}
            accessibilityRole="button"
            accessibilityLabel={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
          >
            <BhuguardMaterialIcon name="notifications" size={22} color={artisanTheme.primary} />
            {unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : String(unreadCount)}</Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable
            style={styles.avatarButton}
            onPress={() => navigation.navigate('ArtisanProfile')}
            accessibilityRole="button"
            accessibilityLabel="Open Artisan Pro profile"
          >
            <Text style={styles.avatarText}>{initialsFromName(artisanName)}</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <LiveWorkCheckinCard />

        {error ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>{error}</Text>
            <Pressable
              style={styles.noticeRetry}
              onPress={() => void load({ force: true })}
              accessibilityRole="button"
              accessibilityLabel="Retry loading dashboard"
            >
              <Text style={styles.noticeRetryText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {incompleteDraft && (incompleteDraft.farmId || incompleteDraft.farmerId) ? (
          <Pressable
            style={styles.resumeCard}
            onPress={() => {
              if (!ensureCheckedInOrPrompt()) {
                return;
              }
              if (!incompleteDraft.farmId) {
                Alert.alert(
                  'Resume unavailable',
                  'This unfinished batch is missing a Farm ID. Open Biochar Production from farm lookup and continue the same farmer/farm.',
                );
                return;
              }
              navigation.navigate('ArtisanBiocharProduction', {
                farmId: incompleteDraft.farmId,
                farmerId: incompleteDraft.farmerId ?? undefined,
                batchId: incompleteDraft.batchId ?? undefined,
              });
            }}
            accessibilityRole="button"
            accessibilityLabel="Complete the Process — resume unfinished biochar production batch"
          >
            <View style={styles.resumeIconBubble}>
              <BhuguardMaterialIcon name="eco" size={22} color={artisanTheme.white} />
            </View>
            <View style={styles.resumeCopy}>
              <Text style={styles.resumeTitle}>Complete the Process</Text>
              <Text style={styles.resumeBody}>
                {incompleteDraft.batchCode?.trim()
                  ? `Batch ${incompleteDraft.batchCode} is unfinished. Tap to resume.`
                  : 'You have an unfinished Biochar Production batch. Tap to resume.'}
              </Text>
            </View>
            <BhuguardMaterialIcon name="chevron_right" size={20} color={artisanTheme.white} />
          </Pressable>
        ) : null}

        {emptyNotice && !error ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>No dashboard data available</Text>
            <Text style={styles.noticeBody}>
              Showing empty values. You can still open Artisan Pro modules below.
            </Text>
            <Pressable
              style={styles.noticeRetry}
              onPress={() => void load({ force: true })}
              accessibilityRole="button"
              accessibilityLabel="Retry loading dashboard"
            >
              <Text style={styles.noticeRetryText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeEyebrow}>Welcome</Text>
          <Text style={styles.welcomeName}>{artisanName}</Text>
          <Text style={styles.welcomeMeta}>
            {artisanCode !== '—' ? artisanCode : 'Artisan Pro'} · Onboarding, farm activity & biochar
          </Text>
          <Text style={styles.welcomeLocation} numberOfLines={2}>
            {locationSummary}
          </Text>
        </View>

        <View style={styles.grid}>
          <DashboardCard
            title="Farmer Onboarding"
            description="Register and complete farmer onboarding"
            icon="person_add"
            accent={CARD_ACCENTS.find.accent}
            bubble={CARD_ACCENTS.find.bubble}
            fullWidth={!twoColumn}
            onPress={() => navigation.navigate('FarmerOnboardingStart')}
            accessibilityLabel="Open farmer onboarding"
          />
          <DashboardCard
            title="Farm Activity"
            description="Record farm visit, activity and mapping details"
            icon="agriculture"
            accent={CARD_ACCENTS.application.accent}
            bubble={CARD_ACCENTS.application.bubble}
            fullWidth={!twoColumn}
            onPress={() => navigation.navigate('FieldOfficerFarmActivityStart')}
            accessibilityLabel="Open farm activity"
          />
          <DashboardCard
            title="Farm Navigator"
            description="Search Farm ID / Farmer Name and navigate"
            icon="map"
            accent={CARD_ACCENTS.find.accent}
            bubble={CARD_ACCENTS.find.bubble}
            fullWidth={!twoColumn}
            onPress={() => {
              if (!ensureCheckedInOrPrompt()) {
                return;
              }
              navigation.navigate('ArtisanFarmLookup', { purpose: 'navigate' });
            }}
            accessibilityLabel="Open farm navigator"
          />
          <DashboardCard
            title="Find Farmer / Farm"
            description="Search farms in your assigned area"
            icon="search"
            accent={CARD_ACCENTS.find.accent}
            bubble={CARD_ACCENTS.find.bubble}
            fullWidth={!twoColumn}
            onPress={() => {
              if (!ensureCheckedInOrPrompt()) {
                return;
              }
              navigation.navigate('ArtisanFarmLookup', { purpose: 'find' });
            }}
            accessibilityLabel="Find farmer or farm"
          />
          <DashboardCard
            title="Biochar Production"
            description={
              incompleteDraft && incompleteDraft.farmId
                ? 'Unfinished batch — tap Complete the Process above, or start a new one'
                : 'Start or continue a process batch'
            }
            icon="eco"
            accent={CARD_ACCENTS.production.accent}
            bubble={CARD_ACCENTS.production.bubble}
            fullWidth={!twoColumn}
            onPress={() => {
              if (!ensureCheckedInOrPrompt()) {
                return;
              }
              navigation.navigate('ArtisanFarmLookup', { purpose: 'production' });
            }}
            accessibilityLabel="Open biochar production"
          />
          <DashboardCard
            title="Biochar Mixing"
            description="Create a mixing record for a farm"
            icon="science"
            accent={CARD_ACCENTS.production.accent}
            bubble={CARD_ACCENTS.production.bubble}
            fullWidth={!twoColumn}
            onPress={() => {
              if (!ensureCheckedInOrPrompt()) {
                return;
              }
              navigation.navigate('ArtisanFarmLookup', { purpose: 'mixing' });
            }}
            accessibilityLabel="Open biochar mixing"
          />
          <DashboardCard
            title="Biochar Application"
            description="Apply mixed biochar to an assigned farm"
            icon="agriculture"
            accent={CARD_ACCENTS.application.accent}
            bubble={CARD_ACCENTS.application.bubble}
            fullWidth={!twoColumn}
            onPress={() => {
              if (!ensureCheckedInOrPrompt()) {
                return;
              }
              navigation.navigate('ArtisanFarmLookup', { purpose: 'application' });
            }}
            accessibilityLabel="Open biochar application"
          />
          <DashboardCard
            title="Wallet"
            description="View Artisan wallet when enabled"
            icon="payments"
            accent={CARD_ACCENTS.submitted.accent}
            bubble={CARD_ACCENTS.submitted.bubble}
            fullWidth={!twoColumn}
            onPress={() => navigation.navigate('ArtisanModuleUnavailable', { module: 'wallet' })}
            accessibilityLabel="Open artisan wallet"
          />
          <DashboardCard
            title="Help & Support"
            description="Contact Bhuguard support"
            icon="support_agent"
            accent={CARD_ACCENTS.find.accent}
            bubble={CARD_ACCENTS.find.bubble}
            fullWidth={!twoColumn}
            onPress={() => navigation.navigate('ArtisanHelpSupport')}
            accessibilityLabel="Open help and support"
          />
          <DashboardCard
            title="Biochar Training"
            description="Training modules when published"
            icon="assignment"
            accent={CARD_ACCENTS.production.accent}
            bubble={CARD_ACCENTS.production.bubble}
            fullWidth={!twoColumn}
            onPress={() => navigation.navigate('ArtisanModuleUnavailable', { module: 'training' })}
            accessibilityLabel="Open biochar training"
          />
          <DashboardCard
            title="Submitted Production"
            description={`${submittedCount} submitted record${submittedCount === 1 ? '' : 's'}${pendingLabel}`}
            icon="fact_check"
            accent={CARD_ACCENTS.submitted.accent}
            bubble={CARD_ACCENTS.submitted.bubble}
            fullWidth={!twoColumn}
            onPress={() => navigation.navigate('ArtisanProductionRecords', { status: 'submitted' })}
            accessibilityLabel={`Submitted production records, ${submittedCount}`}
          />
          <DashboardCard
            title="Farm Navigator"
            description="Open Google Maps directions to an assigned farm"
            icon="near_me"
            accent={CARD_ACCENTS.find.accent}
            bubble={CARD_ACCENTS.find.bubble}
            fullWidth={!twoColumn}
            onPress={() => {
              if (!ensureCheckedInOrPrompt()) {
                return;
              }
              navigation.navigate('ArtisanFarmLookup', { purpose: 'navigate' });
            }}
            accessibilityLabel="Open farm navigator"
          />
          <DashboardCard
            title="Wallet"
            description="View Artisan Pro wallet balance"
            icon="account_balance_wallet"
            accent={CARD_ACCENTS.submitted.accent}
            bubble={CARD_ACCENTS.submitted.bubble}
            fullWidth={!twoColumn}
            onPress={() => navigation.navigate('ArtisanModuleUnavailable', { module: 'wallet' })}
            accessibilityLabel="Open wallet"
          />
          <DashboardCard
            title="Biochar Training"
            description="Learn the Biochar production process"
            icon="school"
            accent={CARD_ACCENTS.production.accent}
            bubble={CARD_ACCENTS.production.bubble}
            fullWidth={!twoColumn}
            onPress={() => navigation.navigate('ArtisanModuleUnavailable', { module: 'training' })}
            accessibilityLabel="Open Biochar training"
          />
          <DashboardCard
            title="Help & Support"
            description="Contact Bhuguard support"
            icon="support_agent"
            accent={CARD_ACCENTS.support.accent}
            bubble={CARD_ACCENTS.support.bubble}
            fullWidth={!twoColumn}
            onPress={() => navigation.navigate('ArtisanHelpSupport')}
            accessibilityLabel="Open Help and Support"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: artisanTheme.creamBg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    backgroundColor: artisanTheme.white,
    borderBottomWidth: 1,
    borderBottomColor: artisanTheme.softBorder,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, marginRight: 12 },
  headerCopy: { flex: 1, minWidth: 0, marginLeft: 10 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: artisanTheme.deepText },
  headerSubtitle: { fontSize: 12, color: artisanTheme.secondaryText, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: artisanTheme.cream,
    borderWidth: 1,
    borderColor: artisanTheme.softBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: '#C62828',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '700', lineHeight: 11 },
  avatarButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: artisanTheme.actionGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: artisanTheme.white, fontWeight: '800', fontSize: 13 },
  container: { padding: spacing.lg, paddingBottom: 40 },
  welcomeCard: {
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: artisanTheme.softBorder,
    backgroundColor: artisanTheme.cream,
    marginBottom: 16,
    shadowColor: '#0B2E1F',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  welcomeEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: artisanTheme.actionGreen,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  welcomeName: { fontSize: 24, fontWeight: '800', color: artisanTheme.deepText },
  welcomeMeta: { fontSize: 13, color: artisanTheme.secondaryText, marginTop: 4 },
  welcomeLocation: { fontSize: 13, color: artisanTheme.tertiary, marginTop: 8, fontWeight: '600' },
  noticeCard: {
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: artisanTheme.softBorder,
    backgroundColor: artisanTheme.white,
    marginBottom: 12,
  },
  noticeTitle: { fontSize: 14, fontWeight: '800', color: artisanTheme.deepText, marginBottom: 4 },
  noticeBody: { fontSize: 12, lineHeight: 17, color: artisanTheme.secondaryText },
  noticeRetry: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: artisanTheme.actionGreen,
  },
  noticeRetryText: { color: artisanTheme.white, fontWeight: '700', fontSize: 12 },
  resumeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: spacing.md,
    backgroundColor: artisanTheme.actionGreen,
    marginBottom: 12,
    shadowColor: '#0B2E1F',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  resumeIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  resumeCopy: { flex: 1 },
  resumeTitle: { fontSize: 14, fontWeight: '800', color: artisanTheme.white },
  resumeBody: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 2, lineHeight: 16 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: artisanTheme.white,
    borderRadius: 18,
    paddingTop: 14,
    paddingRight: 14,
    paddingBottom: 14,
    paddingLeft: 18,
    borderWidth: 1,
    borderColor: artisanTheme.softBorder,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#0B2E1F',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHalf: { width: '48%' },
  cardFull: { width: '100%' },
  cardPressed: { opacity: 0.92 },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: artisanTheme.deepText, marginBottom: 6 },
  cardDescription: {
    fontSize: 12,
    lineHeight: 17,
    color: artisanTheme.secondaryText,
    minHeight: 34,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardAction: { fontSize: 12, fontWeight: '700' },
});
