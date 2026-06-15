import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';

interface FarmerCreditsCardProps {
  totalCredits: number;
  creditTrend: number | null;
  onViewDetails?: () => void;
}

const SPARKLINE_HEIGHTS = [0.3, 0.45, 0.4, 0.6, 0.55, 0.75, 0.9, 1];

export function FarmerCreditsCard({ totalCredits, creditTrend, onViewDetails }: FarmerCreditsCardProps) {
  const displayCredits = totalCredits > 0 ? Math.round(totalCredits) : 0;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onViewDetails}
    >
      <View style={styles.decorAccent} />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.creditsBlock}>
            <Text style={styles.label}>Total Estimated Credits</Text>
            <View style={styles.valueRow}>
              <Text style={styles.value}>{displayCredits > 0 ? displayCredits : '—'}</Text>
              <Text style={styles.unit}>tCO2e</Text>
            </View>
          </View>

          {creditTrend !== null ? (
            <View style={styles.trendBadge}>
              <BhuguardMaterialIcon name="trending_up" size={14} color={dashboardTheme.secondary} />
              <Text style={styles.trendText}>+{creditTrend}%</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.chartRow}>
          {SPARKLINE_HEIGHTS.map((ratio, index) => {
            const isLast = index === SPARKLINE_HEIGHTS.length - 1;
            const isSecondLast = index === SPARKLINE_HEIGHTS.length - 2;

            return (
              <View
                key={`bar-${index}`}
                style={[
                  styles.bar,
                  {
                    height: Math.max(8, 64 * ratio),
                    backgroundColor: isLast
                      ? dashboardTheme.primary
                      : isSecondLast
                        ? dashboardTheme.primaryFixedDim
                        : dashboardTheme.surfaceVariant,
                  },
                ]}
              />
            );
          })}
        </View>

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={onViewDetails}
        >
          <Text style={styles.buttonText}>View Details</Text>
          <BhuguardMaterialIcon name="arrow_forward" size={16} color={dashboardTheme.primary} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    ...dashboardShadow,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.995 }],
  },
  decorAccent: {
    position: 'absolute',
    top: -32,
    right: -32,
    width: 128,
    height: 128,
    borderBottomLeftRadius: 128,
    backgroundColor: dashboardTheme.primary,
    opacity: 0.03,
  },
  content: {
    position: 'relative',
    zIndex: 1,
    gap: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  creditsBlock: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    color: dashboardTheme.outline,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '700',
    color: dashboardTheme.primary,
  },
  unit: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: dashboardTheme.onSurfaceVariant,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: dashboardTheme.surfaceContainer,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(191, 201, 189, 0.3)',
  },
  trendText: {
    color: dashboardTheme.secondary,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 64,
    opacity: 0.8,
  },
  bar: {
    flex: 1,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  button: {
    backgroundColor: dashboardTheme.surfaceLow,
    borderRadius: 8,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
    backgroundColor: dashboardTheme.surfaceContainer,
  },
  buttonText: {
    color: dashboardTheme.primary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
