import { StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon, type BhuguardIconName } from '../shared/BhuguardMaterialIcon';
import { DashboardPressable } from '../shared/DashboardPressable';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';

interface StatItem {
  key: string;
  icon: BhuguardIconName;
  value: string;
  valueSuffix?: string;
  label: string;
  tall?: boolean;
  iconBg?: string;
  iconColor?: string;
  onPress: () => void;
}

interface FarmerQuickStatsGridProps {
  totalFarms: number;
  activitiesSubmitted: number;
  estimatedCarbon: string;
  creditsEligible: string;
  onTotalFarmsPress: () => void;
  onActivitiesPress: () => void;
  onCarbonPress: () => void;
  onCreditsPress: () => void;
}

function StatCard({ icon, value, valueSuffix, label, tall, iconBg, iconColor, onPress }: Omit<StatItem, 'key'>) {
  return (
    <DashboardPressable onPress={onPress} style={[styles.card, dashboardShadow, tall ? styles.cardTall : styles.cardSquare]}>
      <View style={[styles.iconCircle, { backgroundColor: iconBg ?? dashboardTheme.surfaceLow }]}>
        <BhuguardMaterialIcon name={icon} size={20} color={iconColor ?? dashboardTheme.primaryContainer} />
      </View>
      <View>
        <Text style={styles.value}>
          {value}
          {valueSuffix ? <Text style={styles.valueSuffix}> {valueSuffix}</Text> : null}
        </Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </DashboardPressable>
  );
}

export function FarmerQuickStatsGrid({
  totalFarms,
  activitiesSubmitted,
  estimatedCarbon,
  creditsEligible,
  onTotalFarmsPress,
  onActivitiesPress,
  onCarbonPress,
  onCreditsPress,
}: FarmerQuickStatsGridProps) {
  return (
    <View style={styles.grid}>
      <StatCard icon="potted_plant" value={String(totalFarms)} label="Total Farms" onPress={onTotalFarmsPress} />
      <StatCard
        icon="assignment"
        value={String(activitiesSubmitted)}
        label="Activities Submitted"
        onPress={onActivitiesPress}
      />
      <StatCard
        icon="co2"
        value={estimatedCarbon}
        valueSuffix="tCO2e"
        label="Estimated Carbon"
        tall
        onPress={onCarbonPress}
      />
      <StatCard
        icon="payments"
        value={creditsEligible}
        label="Credits Eligible"
        tall
        iconBg={dashboardTheme.creditsSurface}
        iconColor={dashboardTheme.creditsAccent}
        onPress={onCreditsPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '47%',
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 12,
    justifyContent: 'space-between',
    gap: 8,
  },
  cardSquare: {
    aspectRatio: 1,
  },
  cardTall: {
    minHeight: 120,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  valueSuffix: {
    fontSize: 14,
    fontWeight: '400',
    color: dashboardTheme.textMuted,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: dashboardTheme.textMuted,
  },
});
