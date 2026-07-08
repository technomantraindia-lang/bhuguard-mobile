import { StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon, type BhuguardIconName } from '../shared/BhuguardMaterialIcon';
import { DashboardPressable } from '../shared/DashboardPressable';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';

interface QuickAccessRowProps {
  icon: BhuguardIconName;
  label: string;
  buttonLabel: string;
  onPress: () => void;
}

function QuickAccessRow({ icon, label, buttonLabel, onPress }: QuickAccessRowProps) {
  return (
    <DashboardPressable onPress={onPress} style={[styles.rowCard, dashboardShadow]}>
      <View style={styles.rowLeft} pointerEvents="none">
        <View style={styles.iconCircle}>
          <BhuguardMaterialIcon name={icon} size={20} color={dashboardTheme.primaryContainer} />
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
  onEvidenceUpload: () => void;
  onWallet: () => void;
  onProfile: () => void;
  onSupport: () => void;
  onViewFarms?: () => void;
  onSubmitActivity?: () => void;
}

export function FarmerQuickAccessSection({
  onServices,
  onBiocharUpdates,
  onEvidenceUpload,
  onWallet,
  onProfile,
  onSupport,
  onViewFarms,
  onSubmitActivity,
}: FarmerQuickAccessSectionProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>Quick Access</Text>

      <QuickAccessRow icon="eco" label="Services" buttonLabel="View Services" onPress={onServices} />
      <QuickAccessRow icon="event_note" label="Farm Updates" buttonLabel="View Activity" onPress={onBiocharUpdates} />
      <QuickAccessRow icon="photo_camera" label="Evidence Upload" buttonLabel="Upload" onPress={onEvidenceUpload} />
      <QuickAccessRow icon="payments" label="Wallet" buttonLabel="Open Wallet" onPress={onWallet} />
      <QuickAccessRow icon="person" label="Profile" buttonLabel="Open Profile" onPress={onProfile} />
      <QuickAccessRow icon="support_agent" label="Help / Chat Support" buttonLabel="Open Chat" onPress={onSupport} />

      {onViewFarms ? (
        <QuickAccessRow icon="map" label="My Farms" buttonLabel="View Farms" onPress={onViewFarms} />
      ) : null}

      {onSubmitActivity ? (
        <DashboardPressable onPress={onSubmitActivity} style={[styles.highlightCard, dashboardShadow]}>
          <View style={styles.rowLeft} pointerEvents="none">
            <View style={styles.highlightIconCircle}>
              <BhuguardMaterialIcon name="upload" size={20} color={dashboardTheme.onPrimary} />
            </View>
            <View>
              <Text style={styles.highlightTitle}>Add Farm Activity</Text>
              <Text style={styles.highlightSubtitle}>Upload your farm activity photo every 20 days</Text>
            </View>
          </View>
          <View style={styles.submitButton} pointerEvents="none">
            <Text style={styles.submitButtonText}>Add Farm Activity</Text>
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
    color: dashboardTheme.onSurface,
    paddingHorizontal: 4,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 12,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: dashboardTheme.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { fontSize: 14, lineHeight: 20, fontWeight: '500', color: dashboardTheme.onSurface },
  outlineButton: {
    backgroundColor: dashboardTheme.surfaceLow,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  outlineButtonText: { fontSize: 12, lineHeight: 16, fontWeight: '600', color: dashboardTheme.primaryContainer },
  highlightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: dashboardTheme.primaryContainer,
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
  highlightTitle: { fontSize: 14, lineHeight: 20, fontWeight: '500', color: dashboardTheme.onPrimary },
  highlightSubtitle: { fontSize: 12, lineHeight: 16, color: 'rgba(255,255,255,0.8)' },
  submitButton: {
    backgroundColor: dashboardTheme.surfaceLowest,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitButtonText: { fontSize: 12, lineHeight: 16, fontWeight: '600', color: dashboardTheme.primaryContainer },
});
