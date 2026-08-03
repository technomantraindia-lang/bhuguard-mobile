import { useEffect } from 'react';
import { ActivityIndicator, Alert, BackHandler, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../AppButton';
import { OfficerScreenChrome } from '../OfficerScreenChrome';
import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';
import type {
  MandatoryCheckInPhase,
  MandatoryCheckInStage,
} from '../../../hooks/useFieldOfficerMandatoryCheckIn';
import { useLogout } from '../../../hooks/useLogout';
import { useServerTimeSync } from '../../../hooks/useServerTimeSync';
import { useTranslation } from '../../../i18n/I18nContext';
import { officerCardShadow, officerTheme } from '../../../theme/officerDashboardTheme';

interface FieldOfficerMandatoryCheckInScreenProps {
  phase: MandatoryCheckInPhase;
  statusMessage: string | null;
  stage: MandatoryCheckInStage;
  submitting: boolean;
  submitError: string | null;
  onRetryStatus: () => void;
  onSubmitCheckIn: () => void;
}

/**
 * Mandatory gate rendered instead of the FO tab navigator until an active
 * duty check-in session exists on the server. Cannot be dismissed via back
 * navigation — only Retry or Logout are available, and the dashboard is
 * never revealed on a network/server failure (no fake success).
 */
export function FieldOfficerMandatoryCheckInScreen({
  phase,
  statusMessage,
  stage,
  submitting,
  submitError,
  onRetryStatus,
  onSubmitCheckIn,
}: FieldOfficerMandatoryCheckInScreenProps) {
  const { t } = useTranslation();
  const logout = useLogout();
  const serverTime = useServerTimeSync();

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, []);

  const confirmLogout = () => {
    Alert.alert(t('officer.checkIn.logoutConfirmTitle'), t('officer.checkIn.logoutConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.logout'), style: 'destructive', onPress: () => void logout() },
    ]);
  };

  if (phase === 'checkingStatus') {
    return (
      <OfficerScreenChrome>
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={officerTheme.primary} />
          <Text style={styles.loadingText}>{t('officer.checkIn.checkingStatus')}</Text>
        </View>
      </OfficerScreenChrome>
    );
  }

  const isStatusError = phase === 'statusError';
  const stageLabel =
    stage === 'locating'
      ? t('officer.checkIn.stageLocating')
      : stage === 'submitting'
        ? t('officer.checkIn.stageSubmitting')
        : null;

  return (
    <OfficerScreenChrome>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.iconWrap}>
          <BhuguardMaterialIcon name="share_location" size={40} color={officerTheme.onPrimary} filled />
        </View>

        <Text style={styles.title}>{t('officer.checkIn.title')}</Text>
        <Text style={styles.subtitle}>{t('officer.checkIn.subtitle')}</Text>

        <View style={[styles.card, officerCardShadow]}>
          {isStatusError ? (
            <View style={styles.banner}>
              <BhuguardMaterialIcon name="cloud_off" size={18} color={officerTheme.error} />
              <Text style={styles.bannerText}>{statusMessage ?? t('officer.checkIn.statusErrorFallback')}</Text>
            </View>
          ) : null}

          {submitError ? (
            <View style={styles.banner}>
              <BhuguardMaterialIcon name="cloud_off" size={18} color={officerTheme.error} />
              <Text style={styles.bannerText}>{submitError}</Text>
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
                <Text style={styles.skewBannerTitle}>{t('serverTime.skewWarningTitle')}</Text>
                <Text style={styles.skewBannerBody}>{t('serverTime.skewWarningBody')}</Text>
              </View>
            </View>
          ) : null}

          <Text style={styles.helperText}>{t('officer.checkIn.helper')}</Text>

          {serverTime.isSuspiciousSkew ? (
            <AppButton
              label={serverTime.syncing ? t('serverTime.syncing') : t('serverTime.retrySync')}
              variant="secondary"
              onPress={() => void serverTime.retrySync()}
              disabled={serverTime.syncing}
              style={styles.retryButton}
            />
          ) : null}

          <AppButton
            label={submitting ? t('officer.checkIn.checkingIn') : t('officer.checkIn.checkInNow')}
            onPress={onSubmitCheckIn}
            loading={submitting}
            disabled={submitting}
          />

          {isStatusError ? (
            <AppButton
              label={t('common.retry')}
              variant="secondary"
              onPress={onRetryStatus}
              disabled={submitting}
              style={styles.retryButton}
            />
          ) : null}

          <AppButton
            label={t('common.logout')}
            variant="ghost"
            onPress={confirmLogout}
            disabled={submitting}
            style={styles.logoutButton}
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
  helperText: { fontSize: 12, lineHeight: 17, color: officerTheme.onSurfaceVariant, textAlign: 'center' },
  retryButton: { marginTop: 2 },
  logoutButton: { marginTop: 2 },
});
