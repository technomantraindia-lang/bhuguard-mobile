import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { CompanyPendingApproval } from '../../hooks/useCompanyDashboardData';
import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';

interface CompanyPendingApprovalsProps {
  items: CompanyPendingApproval[];
  onViewAll?: () => void;
  onReview?: (item: CompanyPendingApproval) => void;
}

export function CompanyPendingApprovals({ items, onViewAll, onReview }: CompanyPendingApprovalsProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Pending Approvals</Text>
        <Pressable onPress={onViewAll} style={({ pressed }) => pressed && styles.linkPressed}>
          <Text style={styles.viewAll}>View All</Text>
        </Pressable>
      </View>

      <View style={styles.list}>
        {items.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No pending approvals</Text>
            <Text style={styles.emptyText}>Service submissions awaiting review will appear here.</Text>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.left}>
                <View style={styles.iconWrap}>
                  <BhuguardMaterialIcon
                    name={item.icon}
                    size={22}
                    color={dashboardTheme.onPrimaryFixedVariant}
                  />
                </View>
                <View style={styles.textBlock}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [styles.reviewButton, pressed && styles.reviewButtonPressed]}
                onPress={() => onReview?.(item)}
              >
                <Text style={styles.reviewText}>Review</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 24,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  viewAll: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: dashboardTheme.primary,
  },
  linkPressed: {
    opacity: 0.7,
  },
  list: {
    gap: 8,
  },
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    ...dashboardShadow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: dashboardTheme.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  itemSubtitle: {
    fontSize: 11,
    lineHeight: 14,
    color: dashboardTheme.onSurfaceVariant,
  },
  reviewButton: {
    backgroundColor: dashboardTheme.surfaceLow,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  reviewButtonPressed: {
    backgroundColor: dashboardTheme.surfaceContainer,
    transform: [{ scale: 0.95 }],
  },
  reviewText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: dashboardTheme.primary,
  },
  emptyCard: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    gap: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: dashboardTheme.onSurfaceVariant,
  },
});
