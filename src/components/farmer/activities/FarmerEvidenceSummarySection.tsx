import { StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';
import { dashboardShadow, dashboardTheme } from '../../../theme/bhuguardDashboardTheme';
import type { FarmerActivitiesSummary } from '../../../utils/farmerActivityHelpers';

interface FarmerEvidenceSummarySectionProps {
  summary: FarmerActivitiesSummary;
}

export function FarmerEvidenceSummarySection({ summary }: FarmerEvidenceSummarySectionProps) {
  return (
    <View style={[styles.card, dashboardShadow]}>
      <Text style={styles.title}>Evidence Summary</Text>

      <View style={styles.grid}>
        <EvidenceTile icon="photo_camera" label="Photos Uploaded" value={String(summary.photosUploaded)} />
        <EvidenceTile icon="assignment" label="Documents Uploaded" value={String(summary.documentsUploaded)} />
        <EvidenceTile icon="share_location" label="GPS Captured" value={`${summary.gpsCapturedPercent}%`} wide />
      </View>
    </View>
  );
}

function EvidenceTile({
  icon,
  label,
  value,
  wide = false,
}: {
  icon: 'photo_camera' | 'assignment' | 'share_location';
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <View style={[styles.tile, wide && styles.tileWide]}>
      <View style={styles.iconWrap}>
        <BhuguardMaterialIcon name={icon} size={20} color={dashboardTheme.primaryContainer} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: dashboardTheme.headingGreen,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    width: '47%',
    backgroundColor: dashboardTheme.background,
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  tileWide: {
    width: '100%',
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: dashboardTheme.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: dashboardTheme.textMuted,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: dashboardTheme.primary,
  },
});
