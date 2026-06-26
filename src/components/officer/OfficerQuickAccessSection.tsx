import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon, type BhuguardIconName } from '../shared/BhuguardMaterialIcon';
import { officerCardShadow, officerTheme } from '../../theme/officerDashboardTheme';

interface OfficerQuickAccessRowProps {
  icon: BhuguardIconName;
  label: string;
  buttonLabel: string;
  onPress: () => void;
}

function OfficerQuickAccessRow({ icon, label, buttonLabel, onPress }: OfficerQuickAccessRowProps) {
  return (
    <View style={[styles.rowCard, officerCardShadow]}>
      <View style={styles.rowLeft}>
        <View style={styles.iconCircle}>
          <BhuguardMaterialIcon name={icon} size={20} color={officerTheme.primary} />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Pressable onPress={onPress}>
        <Text style={styles.linkButton}>{buttonLabel}</Text>
      </Pressable>
    </View>
  );
}

interface OfficerQuickAccessSectionProps {
  onAssignedVisits: () => void;
  onGpsCheckIn: () => void;
  onEvidenceUpload: () => void;
  onReports: () => void;
  onProfile: () => void;
  onSupport: () => void;
}

export function OfficerQuickAccessSection({
  onAssignedVisits,
  onGpsCheckIn,
  onEvidenceUpload,
  onReports,
  onProfile,
  onSupport,
}: OfficerQuickAccessSectionProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <OfficerQuickAccessRow icon="assignment" label="Assigned Visits" buttonLabel="Open" onPress={onAssignedVisits} />
      <OfficerQuickAccessRow icon="share_location" label="GPS Check-in" buttonLabel="Start" onPress={onGpsCheckIn} />
      <OfficerQuickAccessRow icon="photo_camera" label="Evidence Upload" buttonLabel="Upload" onPress={onEvidenceUpload} />
      <OfficerQuickAccessRow icon="analytics" label="Reports" buttonLabel="View" onPress={onReports} />
      <OfficerQuickAccessRow icon="support_agent" label="Help / Chat Support" buttonLabel="Open Chat" onPress={onSupport} />
      <OfficerQuickAccessRow icon="person" label="Profile" buttonLabel="Open" onPress={onProfile} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, marginTop: 4 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: officerTheme.onSurface,
    paddingHorizontal: 4,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(191, 201, 190, 0.25)',
    padding: 12,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: officerTheme.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { fontSize: 14, fontWeight: '500', color: officerTheme.onSurface },
  linkButton: {
    fontSize: 13,
    fontWeight: '700',
    color: officerTheme.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
