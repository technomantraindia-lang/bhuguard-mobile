import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';

interface FarmerDashboardStatsProps {
  regenerativeScore: number;
  verifiedPlotsCount: number;
}

function ScoreRing({ score }: { score: number }) {
  const size = 80;
  const stroke = 3;
  const radius = 15.9155;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score / 100, 0), 1);
  const dash = circumference * progress;

  return (
    <Svg width={size} height={size} viewBox="0 0 36 36">
      <Circle
        cx="18"
        cy="18"
        r={radius}
        stroke={dashboardTheme.surfaceVariant}
        strokeWidth={stroke}
        fill="none"
      />
      <Circle
        cx="18"
        cy="18"
        r={radius}
        stroke={dashboardTheme.tertiaryContainer}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeLinecap="round"
        rotation={-90}
        origin="18, 18"
      />
    </Svg>
  );
}

export function FarmerDashboardStats({ regenerativeScore, verifiedPlotsCount }: FarmerDashboardStatsProps) {
  return (
    <View style={styles.row}>
      <View style={[styles.card, styles.scoreCard]}>
        <View style={styles.scoreDecor} />
        <Text style={styles.label}>Regenerative Score</Text>
        <View style={styles.scoreWrap}>
          <ScoreRing score={regenerativeScore} />
          <View style={styles.scoreCenter}>
            <Text style={styles.scoreValue}>{regenerativeScore}</Text>
            <Text style={styles.scoreSuffix}>/100</Text>
          </View>
        </View>
      </View>

      <View style={[styles.card, styles.plotsCard]}>
        <View style={styles.plotsDecor} />
        <Text style={styles.label}>Verified Plots</Text>
        <View style={styles.plotsRow}>
          <View style={styles.plotsIcon}>
            <BhuguardMaterialIcon name="map" size={20} color={dashboardTheme.secondary} filled />
          </View>
          <View>
            <Text style={styles.plotsValue}>{verifiedPlotsCount}</Text>
            <Text style={styles.plotsSub}>Active</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  card: {
    flex: 1,
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    ...dashboardShadow,
    minHeight: 148,
    overflow: 'hidden',
    position: 'relative',
  },
  scoreCard: {
    alignItems: 'center',
  },
  plotsCard: {
    justifyContent: 'space-between',
  },
  scoreDecor: {
    position: 'absolute',
    bottom: -24,
    left: -24,
    width: 96,
    height: 96,
    borderTopRightRadius: 96,
    backgroundColor: dashboardTheme.tertiary,
    opacity: 0.03,
  },
  plotsDecor: {
    position: 'absolute',
    top: -24,
    right: -24,
    width: 96,
    height: 96,
    borderBottomLeftRadius: 96,
    backgroundColor: dashboardTheme.secondary,
    opacity: 0.03,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    color: dashboardTheme.outline,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    alignSelf: 'flex-start',
    width: '100%',
  },
  scoreWrap: {
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
  },
  scoreCenter: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreValue: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  scoreSuffix: {
    fontSize: 10,
    color: dashboardTheme.outline,
  },
  plotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 'auto',
  },
  plotsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: dashboardTheme.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plotsValue: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  plotsSub: {
    fontSize: 11,
    lineHeight: 14,
    color: dashboardTheme.onSurfaceVariant,
    fontWeight: '500',
  },
});
