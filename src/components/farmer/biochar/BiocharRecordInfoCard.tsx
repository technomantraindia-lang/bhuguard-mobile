import { StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';
import { dashboardShadow, dashboardTheme } from '../../../theme/bhuguardDashboardTheme';

interface BiocharRecordInfoCardProps {
  fullName: string;
  farmerCode: string;
  projectName: string;
  farmName: string;
  statusLabel?: string;
}

function InfoLine({ icon, label, value }: { icon: 'person' | 'badge' | 'eco' | 'agriculture'; label: string; value: string }) {
  return (
    <View style={styles.infoLine}>
      <BhuguardMaterialIcon name={icon} size={20} color={dashboardTheme.primaryContainer} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export function BiocharRecordInfoCard({
  fullName,
  farmerCode,
  projectName,
  farmName,
  statusLabel = 'Draft',
}: BiocharRecordInfoCardProps) {
  return (
    <View style={[styles.card, dashboardShadow]}>
      <View style={styles.decor} pointerEvents="none" />
      <View style={styles.header}>
        <Text style={styles.title}>Biochar Record</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>
      </View>

      <View style={styles.infoBlock}>
        <InfoLine icon="person" label="Farmer:" value={fullName} />
        <InfoLine icon="badge" label="ID:" value={farmerCode} />
        <InfoLine icon="eco" label="Project:" value={projectName} />
        <InfoLine icon="agriculture" label="Farm:" value={farmName} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${dashboardTheme.surfaceVariant}80`,
    padding: 16,
    overflow: 'hidden',
    gap: 14,
  },
  decor: {
    position: 'absolute',
    top: -64,
    right: -64,
    width: 128,
    height: 128,
    borderBottomLeftRadius: 999,
    backgroundColor: `${dashboardTheme.secondaryContainer}33`,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: dashboardTheme.primary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: dashboardTheme.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: dashboardTheme.onSurfaceVariant,
  },
  infoBlock: {
    gap: 12,
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    width: 72,
    fontSize: 16,
    fontWeight: '500',
    color: dashboardTheme.onSurface,
  },
  infoValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: dashboardTheme.onSurfaceVariant,
  },
});
