import { StyleSheet, Text, View } from 'react-native';

import { officerShadow, officerTheme } from '../../theme/officerDashboardTheme';

interface OfficerActiveDutyCardProps {
  assignedFarmersCount: number;
  pendingVerificationsCount: number;
  urgentPendingCount: number;
}

export function OfficerActiveDutyCard({
  assignedFarmersCount,
  pendingVerificationsCount,
  urgentPendingCount,
}: OfficerActiveDutyCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.decorAccent} />

      <Text style={styles.title}>Active Field Duty</Text>

      <View style={styles.syncRow}>
        <View style={styles.syncDot} />
        <Text style={styles.syncText}>Sync: Up to Date</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.farmersCard]}>
          <Text style={styles.statLabel}>Assigned Farmers</Text>
          <Text style={styles.farmersValue}>{assignedFarmersCount}</Text>
        </View>

        <View style={[styles.statCard, styles.pendingCard]}>
          {urgentPendingCount > 0 ? (
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentText}>Urgent</Text>
            </View>
          ) : null}
          <Text style={styles.pendingLabel}>Pending Verifications</Text>
          <Text style={styles.pendingValue}>{pendingVerificationsCount}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    ...officerShadow,
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  decorAccent: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: officerTheme.primary,
    opacity: 0.05,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: officerTheme.onSurface,
    marginBottom: 8,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: officerTheme.successGreen,
  },
  syncText: {
    fontSize: 14,
    lineHeight: 20,
    color: officerTheme.onSurfaceVariant,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 8,
    padding: 8,
    minHeight: 84,
    justifyContent: 'center',
    position: 'relative',
  },
  farmersCard: {
    backgroundColor: officerTheme.surface,
    borderWidth: 1,
    borderColor: officerTheme.surfaceVariant,
  },
  pendingCard: {
    backgroundColor: 'rgba(255, 218, 214, 0.2)',
    borderWidth: 1,
    borderColor: officerTheme.errorContainer,
  },
  statLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: officerTheme.onSurfaceVariant,
    marginBottom: 4,
  },
  pendingLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: officerTheme.error,
    marginBottom: 4,
  },
  urgentBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: officerTheme.error,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  urgentText: {
    color: officerTheme.onPrimary,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '500',
  },
  farmersValue: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    color: officerTheme.primary,
  },
  pendingValue: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    color: officerTheme.error,
  },
});
