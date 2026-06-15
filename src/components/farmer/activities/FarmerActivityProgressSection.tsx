import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { dashboardShadow, dashboardTheme } from '../../../theme/bhuguardDashboardTheme';
import type { FarmerActivitiesSummary } from '../../../utils/farmerActivityHelpers';

interface FarmerActivityProgressSectionProps {
  summary: FarmerActivitiesSummary;
}

export function FarmerActivityProgressSection({ summary }: FarmerActivityProgressSectionProps) {
  const progressPercent =
    summary.submitted > 0 ? Math.min(100, Math.round((summary.verified / summary.submitted) * 100)) : 0;
  const size = 112;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progressPercent / 100) * circumference;

  return (
    <View style={[styles.card, dashboardShadow]}>
      <Text style={styles.title}>Activity Progress</Text>

      <View style={styles.content}>
        <View style={styles.circleWrap}>
          <Svg width={size} height={size}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={dashboardTheme.surfaceLow}
              strokeWidth={stroke}
              fill="none"
            />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={dashboardTheme.primaryContainer}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${size / 2}, ${size / 2}`}
            />
          </Svg>

          <View style={styles.circleLabel}>
            <Text style={styles.percentValue}>{progressPercent}%</Text>
            <Text style={styles.percentHint}>Verified</Text>
          </View>
        </View>

        <View style={styles.stats}>
          <ProgressStat label="Submitted" value={summary.submitted} />
          <ProgressStat label="Verified" value={summary.verified} tone="success" />
          <ProgressStat label="Pending" value={summary.pending} tone="warning" />
        </View>
      </View>
    </View>
  );
}

function ProgressStat({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: number;
  tone?: 'default' | 'success' | 'warning';
}) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text
        style={[
          styles.statValue,
          tone === 'success' && styles.statValueSuccess,
          tone === 'warning' && styles.statValueWarning,
        ]}
      >
        {value}
      </Text>
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
    gap: 14,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: dashboardTheme.headingGreen,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  circleWrap: {
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleLabel: {
    position: 'absolute',
    alignItems: 'center',
  },
  percentValue: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700',
    color: dashboardTheme.primaryContainer,
  },
  percentHint: {
    fontSize: 11,
    fontWeight: '600',
    color: dashboardTheme.textMuted,
  },
  stats: {
    flex: 1,
    gap: 10,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: dashboardTheme.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: dashboardTheme.textMuted,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: dashboardTheme.onSurface,
  },
  statValueSuccess: {
    color: dashboardTheme.primaryContainer,
  },
  statValueWarning: {
    color: '#CA8A04',
  },
});
