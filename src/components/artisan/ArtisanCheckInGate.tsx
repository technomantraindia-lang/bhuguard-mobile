import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEffect } from 'react';
import { BackHandler } from 'react-native';

import { AppButton } from '../AppButton';
import { OfficerScreenChrome } from '../officer/OfficerScreenChrome';
import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { useLogout } from '../../hooks/useLogout';
import { useArtisanMandatoryCheckIn } from '../../hooks/useArtisanMandatoryCheckIn';
import { useArtisanWorkSession } from '../../context/ArtisanWorkSessionContext';
import { useServerTimeSync } from '../../hooks/useServerTimeSync';
import { officerCardShadow, officerTheme } from '../../theme/officerDashboardTheme';

type Props = {
  children: React.ReactNode;
};

/**
 * Blocks Artisan / Artisan Pro dashboard until an active work check-in exists.
 * Fail-closed; Check In / Retry / Logout only. Children never mount while blocked.
 */
export function ArtisanCheckInGate({ children }: Props) {
  const checkIn = useArtisanMandatoryCheckIn();
  const logout = useLogout();
  const workSession = useArtisanWorkSession();
  const serverTime = useServerTimeSync();

  useEffect(() => {
    if (checkIn.phase === 'granted') {
      return;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [checkIn.phase]);

  useEffect(() => {
    // ArtisanWorkSessionProvider hydrates independently at mount time (before this
    // gate has granted access), so it can still believe the artisan is not checked
    // in even though the mandatory gate just confirmed an active session. Force a
    // refresh once granted so per-activity prompts (ensureCheckedInOrPrompt) agree.
    if (checkIn.phase === 'granted') {
      void workSession.hydrate(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIn.phase]);

  if (checkIn.phase === 'granted') {
    return <>{children}</>;
  }

  if (checkIn.phase === 'checkingStatus') {
    return (
      <OfficerScreenChrome>
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={officerTheme.primary} />
          <Text style={styles.loadingText}>Checking your check-in status…</Text>
        </View>
      </OfficerScreenChrome>
    );
  }

  const stageLabel =
    checkIn.stage === 'locating'
      ? 'Capturing high-accuracy GPS…'
      : checkIn.stage === 'submitting'
        ? 'Submitting check-in…'
        : null;

  return (
    <OfficerScreenChrome>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.iconWrap}>
          <BhuguardMaterialIcon name="share_location" size={40} color={officerTheme.onPrimary} filled />
        </View>

        <Text style={styles.roleTitle}>{checkIn.roleTitle}</Text>
        <Text style={styles.title}>Daily Check-in Required</Text>
        <Text style={styles.subtitle}>
          Complete your {checkIn.roleTitle} check-in before using the dashboard. Bhuguard uses high-accuracy
          GPS and server time.
        </Text>

        <View style={[styles.card, officerCardShadow]}>
          <View style={styles.identityBlock}>
            <Text style={styles.identityLabel}>Name</Text>
            <Text style={styles.identityValue}>{checkIn.userName}</Text>
            <Text style={styles.identityLabel}>User ID</Text>
            <Text style={styles.identityValue}>{checkIn.userId}</Text>
            {checkIn.assignedAreaSummary ? (
              <>
                <Text style={styles.identityLabel}>Assigned area</Text>
                <Text style={styles.identityValue}>{checkIn.assignedAreaSummary}</Text>
              </>
            ) : null}
          </View>

          {checkIn.statusMessage || checkIn.submitError ? (
            <View style={styles.banner}>
              <BhuguardMaterialIcon name="cloud_off" size={18} color={officerTheme.error} />
              <Text style={styles.bannerText}>{checkIn.submitError || checkIn.statusMessage}</Text>
            </View>
          ) : null}

          {stageLabel ? (
            <View style={styles.stageRow}>
              <ActivityIndicator size="small" color={officerTheme.primary} />
              <Text style={styles.stageText}>{stageLabel}</Text>
            </View>
          ) : null}

          {serverTime.isSuspiciousSkew ? (
            <View style={styles.skewBanner}>
              <BhuguardMaterialIcon name="schedule" size={18} color="#92400E" />
              <View style={styles.skewBannerCopy}>
                <Text style={styles.skewBannerTitle}>Device clock looks incorrect</Text>
                <Text style={styles.skewBannerBody}>
                  Your device time is off from the Bhuguard server. Fix date/time or retry sync before
                  continuing.
                </Text>
              </View>
            </View>
          ) : null}

          <AppButton
            label={checkIn.submitting ? 'Checking in…' : 'Check in now'}
            onPress={() => {
              void checkIn.submitCheckIn();
            }}
            loading={checkIn.submitting}
            disabled={checkIn.submitting}
          />
          <AppButton
            label="Retry"
            variant="secondary"
            onPress={() => {
              void checkIn.submitCheckIn();
            }}
            disabled={checkIn.submitting}
            style={styles.gap}
          />
          <AppButton
            label="Logout"
            variant="ghost"
            onPress={() => {
              Alert.alert('Log out?', `You must check in to use the ${checkIn.roleTitle} app.`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: () => void logout() },
              ]);
            }}
            disabled={checkIn.submitting}
            style={styles.gap}
          />
        </View>
      </ScrollView>
    </OfficerScreenChrome>
  );
}

const styles = StyleSheet.create({
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  loadingText: { fontSize: 14, color: officerTheme.onSurfaceVariant },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: officerTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  roleTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: officerTheme.primary,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: officerTheme.onSurface,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: officerTheme.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 4,
  },
  card: {
    width: '100%',
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    padding: 20,
    gap: 12,
  },
  identityBlock: { gap: 2, marginBottom: 4 },
  identityLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '600',
    color: officerTheme.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  identityValue: {
    fontSize: 14,
    fontWeight: '600',
    color: officerTheme.onSurface,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: officerTheme.errorContainer,
    borderRadius: 12,
    padding: 10,
  },
  bannerText: { flex: 1, fontSize: 13, lineHeight: 18, color: officerTheme.onErrorContainer },
  skewBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 10,
  },
  skewBannerCopy: { flex: 1, gap: 2 },
  skewBannerTitle: { fontSize: 13, fontWeight: '700', color: '#92400E' },
  skewBannerBody: { fontSize: 12, lineHeight: 17, color: '#92400E' },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stageText: { fontSize: 13, color: officerTheme.onSurfaceVariant },
  gap: { marginTop: 2 },
});
