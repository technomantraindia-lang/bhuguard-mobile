import { StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '../../i18n/I18nContext';
import { farmerCycleToneColor, farmerTheme, type FarmerCycleTone } from '../../theme/farmerTheme';
import { BhuguardMaterialIcon, type BhuguardIconName } from '../shared/BhuguardMaterialIcon';
import { DashboardPressable } from '../shared/DashboardPressable';

interface StatCardProps {
  icon: BhuguardIconName;
  value: string;
  label: string;
  tone?: FarmerCycleTone;
  onPress?: () => void;
  loading?: boolean;
}

function StatCard({ icon, value, label, tone = 'default', onPress, loading = false }: StatCardProps) {
  const toneColor = farmerCycleToneColor(tone);

  const body = (
    <>
      <View style={[styles.iconCircle, { backgroundColor: `${toneColor}22` }]}>
        <BhuguardMaterialIcon name={icon} size={20} color={toneColor} />
      </View>
      <Text style={[styles.value, { color: tone === 'default' ? farmerTheme.deepText : toneColor }]} numberOfLines={2}>
        {loading ? '…' : value}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </>
  );

  if (!onPress) {
    return <View style={styles.card}>{body}</View>;
  }

  return (
    <DashboardPressable onPress={onPress} style={styles.card}>
      {body}
    </DashboardPressable>
  );
}

export interface FarmerBiocharDashboardStatsProps {
  serviceStatusLabel: string;
  nextUpdateLabel: string;
  cycleStatusLabel: string;
  cycleTone: FarmerCycleTone;
  walletAmountLabel: string;
  cycleLoading?: boolean;
  onServicePress?: () => void;
  onUpdatesPress?: () => void;
  onWalletPress?: () => void;
}

export function FarmerBiocharDashboardStats({
  serviceStatusLabel,
  nextUpdateLabel,
  cycleStatusLabel,
  cycleTone,
  walletAmountLabel,
  cycleLoading = false,
  onServicePress,
  onUpdatesPress,
  onWalletPress,
}: FarmerBiocharDashboardStatsProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        <StatCard
          icon="eco"
          value={serviceStatusLabel || 'Biochar'}
          label={t('farmer.dashboard.activeService')}
          tone="success"
          onPress={onServicePress}
        />
        <StatCard
          icon="event_note"
          value={nextUpdateLabel}
          label={t('farmer.dashboard.nextFarmPhotoUploadDate')}
          tone={cycleTone}
          loading={cycleLoading}
          onPress={onUpdatesPress}
        />
      </View>
      <View style={styles.grid}>
        <StatCard
          icon="schedule"
          value={cycleStatusLabel}
          label={t('farmer.dashboard.currentUpdateStatus')}
          tone={cycleTone}
          loading={cycleLoading}
          onPress={onUpdatesPress}
        />
        <StatCard
          icon="payments"
          value={walletAmountLabel}
          label={t('farmer.dashboard.wallet')}
          onPress={onWalletPress}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  grid: { flexDirection: 'row', gap: 12 },
  card: {
    flex: 1,
    backgroundColor: farmerTheme.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: farmerTheme.softBorder,
    padding: 12,
    minHeight: 108,
    justifyContent: 'space-between',
    ...farmerTheme.cardShadow,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  value: { fontSize: 16, fontWeight: '800', color: farmerTheme.deepText },
  label: { fontSize: 12, fontWeight: '600', color: farmerTheme.secondaryText, marginTop: 4 },
});
