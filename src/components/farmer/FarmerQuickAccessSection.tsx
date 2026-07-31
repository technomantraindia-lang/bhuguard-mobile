import { StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '../../i18n/I18nContext';
import { farmerTheme } from '../../theme/farmerTheme';
import { BhuguardMaterialIcon, type BhuguardIconName } from '../shared/BhuguardMaterialIcon';
import { DashboardPressable } from '../shared/DashboardPressable';

interface QuickAccessRowProps {
  icon: BhuguardIconName;
  label: string;
  buttonLabel: string;
  onPress: () => void;
}

function QuickAccessRow({ icon, label, buttonLabel, onPress }: QuickAccessRowProps) {
  return (
    <DashboardPressable onPress={onPress} style={[styles.rowCard, farmerTheme.cardShadow]}>
      <View style={styles.rowLeft} pointerEvents="none">
        <View style={styles.iconCircle}>
          <BhuguardMaterialIcon name={icon} size={20} color={farmerTheme.actionGreen} />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <View style={styles.outlineButton} pointerEvents="none">
        <Text style={styles.outlineButtonText}>{buttonLabel}</Text>
      </View>
    </DashboardPressable>
  );
}

interface FarmerQuickAccessSectionProps {
  onServices: () => void;
  onBiocharUpdates: () => void;
  onWallet: () => void;
  onProfile: () => void;
  onSupport: () => void;
  onViewFarms?: () => void;
  onSubmitActivity?: () => void;
}

export function FarmerQuickAccessSection({
  onServices,
  onBiocharUpdates,
  onWallet,
  onProfile,
  onSupport,
  onViewFarms,
  onSubmitActivity,
}: FarmerQuickAccessSectionProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>{t('farmer.dashboard.quickAccess')}</Text>

      <QuickAccessRow
        icon="eco"
        label={t('farmer.dashboard.services')}
        buttonLabel={t('farmer.dashboard.viewServices')}
        onPress={onServices}
      />
      <QuickAccessRow
        icon="event_note"
        label={t('farmer.dashboard.biocharActivity')}
        buttonLabel={t('farmer.dashboard.viewActivities')}
        onPress={onBiocharUpdates}
      />
      <QuickAccessRow
        icon="payments"
        label={t('farmer.dashboard.wallet')}
        buttonLabel={t('farmer.dashboard.openWallet')}
        onPress={onWallet}
      />
      <QuickAccessRow
        icon="person"
        label={t('farmer.dashboard.profile')}
        buttonLabel={t('farmer.dashboard.openProfile')}
        onPress={onProfile}
      />
      <QuickAccessRow
        icon="support_agent"
        label={t('farmer.dashboard.helpSupport')}
        buttonLabel={t('farmer.dashboard.openChat')}
        onPress={onSupport}
      />

      {onViewFarms ? (
        <QuickAccessRow
          icon="map"
          label={t('farmer.dashboard.myFarms')}
          buttonLabel={t('farmer.dashboard.viewFarms')}
          onPress={onViewFarms}
        />
      ) : null}

      {onSubmitActivity ? (
        <DashboardPressable onPress={onSubmitActivity} style={[styles.highlightCard, farmerTheme.cardShadow]}>
          <View style={styles.rowLeft} pointerEvents="none">
            <View style={styles.highlightIconCircle}>
              <BhuguardMaterialIcon name="upload" size={20} color={farmerTheme.white} />
            </View>
            <View>
              <Text style={styles.highlightTitle}>{t('farmer.dashboard.addBiocharActivity')}</Text>
              <Text style={styles.highlightSubtitle}>{t('farmer.dashboard.activityEvery25Days')}</Text>
            </View>
          </View>
          <View style={styles.submitButton} pointerEvents="none">
            <Text style={styles.submitButtonText}>{t('farmer.dashboard.addBiocharActivity')}</Text>
          </View>
        </DashboardPressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: farmerTheme.headingGreen,
    paddingHorizontal: 4,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: farmerTheme.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: farmerTheme.softBorder,
    padding: 12,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: farmerTheme.lightGreenSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { fontSize: 14, lineHeight: 20, fontWeight: '500', color: farmerTheme.deepText },
  outlineButton: {
    backgroundColor: farmerTheme.lightGreenSurface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  outlineButtonText: { fontSize: 12, lineHeight: 16, fontWeight: '600', color: farmerTheme.actionGreen },
  highlightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: farmerTheme.actionGreen,
    borderRadius: 20,
    padding: 12,
    gap: 8,
  },
  highlightIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightTitle: { fontSize: 14, lineHeight: 20, fontWeight: '500', color: farmerTheme.white },
  highlightSubtitle: { fontSize: 12, lineHeight: 16, color: 'rgba(255,255,255,0.8)' },
  submitButton: {
    backgroundColor: farmerTheme.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitButtonText: { fontSize: 12, lineHeight: 16, fontWeight: '600', color: farmerTheme.actionGreen },
});
