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
      <View style={styles.rowLeft}>
        <View style={styles.iconCircle}>
          <BhuguardMaterialIcon name={icon} size={20} color={dashboardTheme.primaryContainer} />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <DashboardPressable variant="button" onPress={onPress} style={styles.outlineButton}>
        <Text style={styles.outlineButtonText}>{buttonLabel}</Text>
      </DashboardPressable>
    </DashboardPressable>
  );
}

interface CompanyQuickAccessSectionProps {
  onSites: () => void;
  onServiceSubmissions: () => void;
  onWasteRecords: () => void;
  onBiocharRecords: () => void;
  onIndustrialCarbon: () => void;
  onEvidenceUpload: () => void;
  onReports: () => void;
  onProfile: () => void;
}

export function CompanyQuickAccessSection({
  onSites,
  onServiceSubmissions,
  onWasteRecords,
  onBiocharRecords,
  onIndustrialCarbon,
  onEvidenceUpload,
  onReports,
  onProfile,
}: CompanyQuickAccessSectionProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <QuickAccessRow icon="location_on" label="Sites" buttonLabel="View Sites" onPress={onSites} />
      <QuickAccessRow
        icon="assignment"
        label="Service Submissions"
        buttonLabel="View Submissions"
        onPress={onServiceSubmissions}
      />
      <QuickAccessRow icon="description" label="Waste Records" buttonLabel="View Records" onPress={onWasteRecords} />
      <QuickAccessRow icon="science" label="Biochar / Production" buttonLabel="View Records" onPress={onBiocharRecords} />
      <QuickAccessRow icon="co2" label="Industrial Carbon" buttonLabel="View Records" onPress={onIndustrialCarbon} />
      <QuickAccessRow icon="photo_camera" label="Evidence Upload" buttonLabel="Upload" onPress={onEvidenceUpload} />
      <QuickAccessRow icon="analytics" label="Reports" buttonLabel="Open Reports" onPress={onReports} />
      <QuickAccessRow icon="person" label="Profile" buttonLabel="Open Profile" onPress={onProfile} />
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
  outlineButtonText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: dashboardTheme.primaryContainer,
  },
});
