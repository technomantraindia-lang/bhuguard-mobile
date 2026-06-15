import { StyleSheet, Text, View } from 'react-native';

import { dashboardShadow, dashboardTheme } from '../../../../theme/bhuguardDashboardTheme';

interface FarmDetailHeroCardProps {
  farmName: string;
  farmCode: string;
  statusLabel: string;
  verificationLabel: string;
  projectName: string;
  areaLabel: string;
}

function HeroStat({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'success' }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, tone === 'success' && styles.statValueSuccess]}>{value}</Text>
    </View>
  );
}

export function FarmDetailHeroCard({
  farmName,
  farmCode,
  statusLabel,
  verificationLabel,
  projectName,
  areaLabel,
}: FarmDetailHeroCardProps) {
  return (
    <View style={[styles.card, dashboardShadow]}>
      <View style={styles.headerRow}>
        <View style={styles.copy}>
          <Text style={styles.farmName}>{farmName}</Text>
          <Text style={styles.farmCode}>{farmCode}</Text>
        </View>
        <View style={styles.badges}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{statusLabel}</Text>
          </View>
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedBadgeText}>{verificationLabel}</Text>
          </View>
        </View>
      </View>

      <View style={styles.grid}>
        <HeroStat label="Project" value={projectName} />
        <HeroStat label="Land Area" value={areaLabel} tone="success" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 16,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  farmName: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    color: dashboardTheme.headingGreen,
  },
  farmCode: {
    fontSize: 13,
    fontWeight: '600',
    color: dashboardTheme.textMuted,
    letterSpacing: 0.3,
  },
  badges: {
    gap: 6,
    alignItems: 'flex-end',
  },
  statusBadge: {
    backgroundColor: dashboardTheme.surfaceLow,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: dashboardTheme.primaryContainer,
  },
  verifiedBadge: {
    backgroundColor: dashboardTheme.primaryContainer,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: dashboardTheme.onPrimary,
  },
  grid: {
    flexDirection: 'row',
    gap: 10,
  },
  stat: {
    flex: 1,
    backgroundColor: dashboardTheme.surfaceLow,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: dashboardTheme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: dashboardTheme.onSurface,
  },
  statValueSuccess: {
    color: dashboardTheme.primaryContainer,
  },
});
