import { StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon, type BhuguardIconName } from '../shared/BhuguardMaterialIcon';
import { DashboardPressable } from '../shared/DashboardPressable';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';

interface StatCardProps {
  icon: BhuguardIconName;
  value: string;
  label: string;
  tone?: 'default' | 'warning' | 'danger';
  onPress?: () => void;
}

function StatCard({ icon, value, label, tone = 'default', onPress }: StatCardProps) {
  const toneColor =
    tone === 'danger' ? dashboardTheme.error : tone === 'warning' ? '#CA8A04' : dashboardTheme.primaryContainer;

  const body = (
    <>
      <View style={[styles.iconCircle, tone === 'danger' && styles.iconDanger]}>
        <BhuguardMaterialIcon name={icon} size={20} color={toneColor} />
      </View>
      <Text style={[styles.value, tone === 'danger' && styles.valueDanger]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </>
  );

  if (!onPress) {
    return <View style={[styles.card, dashboardShadow]}>{body}</View>;
  }

  return (
    <DashboardPressable onPress={onPress} style={[styles.card, dashboardShadow]}>
      {body}
    </DashboardPressable>
  );
}

export interface FarmerBiocharDashboardStatsProps {
  serviceStatusLabel: string;
  daysRemainingLabel: string;
  cycleStatusLabel: string;
  cycleTone: 'default' | 'warning' | 'danger';
  walletAmountLabel: string;
  evidenceCount: number;
  onServicePress?: () => void;
  onUpdatesPress?: () => void;
  onWalletPress?: () => void;
  onEvidencePress?: () => void;
}

export function FarmerBiocharDashboardStats({
  serviceStatusLabel,
  daysRemainingLabel,
  cycleStatusLabel,
  cycleTone,
  walletAmountLabel,
  evidenceCount,
  onServicePress,
  onUpdatesPress,
  onWalletPress,
  onEvidencePress,
}: FarmerBiocharDashboardStatsProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        <StatCard icon="eco" value={serviceStatusLabel} label="Biochar Service Status" onPress={onServicePress} />
        <StatCard
          icon="event_note"
          value={daysRemainingLabel}
          label="Biochar Update Countdown"
          tone={cycleTone}
          onPress={onUpdatesPress}
        />
      </View>
      <View style={styles.grid}>
        <StatCard icon="schedule" value={cycleStatusLabel} label="Next Biochar Update Due" tone={cycleTone} onPress={onUpdatesPress} />
        <StatCard icon="payments" value={walletAmountLabel} label="Wallet Amount" onPress={onWalletPress} />
      </View>
      <StatCard icon="photo_camera" value={String(evidenceCount)} label="Evidence Uploaded" onPress={onEvidencePress} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  grid: { flexDirection: 'row', gap: 12 },
  card: {
    flex: 1,
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 12,
    gap: 8,
    minHeight: 108,
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: dashboardTheme.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDanger: { backgroundColor: dashboardTheme.errorContainer },
  value: { fontSize: 18, fontWeight: '700', color: dashboardTheme.onSurface },
  valueDanger: { color: dashboardTheme.error },
  label: { fontSize: 12, fontWeight: '600', color: dashboardTheme.textMuted },
});
