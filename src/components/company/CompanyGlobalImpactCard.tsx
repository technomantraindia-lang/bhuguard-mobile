import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';

interface CompanyGlobalImpactCardProps {
  totalCarbonCredits: string;
  activeProjects: number;
  onDetailsPress?: () => void;
}

export function CompanyGlobalImpactCard({
  totalCarbonCredits,
  activeProjects,
  onDetailsPress,
}: CompanyGlobalImpactCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.decorAccent} />

      <View style={styles.content}>
        <Text style={styles.label}>Global Impact</Text>
        <View style={styles.valueRow}>
          <Text style={styles.value}>{totalCarbonCredits}</Text>
          <Text style={styles.unit}>tCO2e</Text>
        </View>
        <Text style={styles.caption}>Total Carbon Credits Issued</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.projectsBlock}>
          <View style={styles.projectsIcon}>
            <BhuguardMaterialIcon name="eco" size={18} color={dashboardTheme.primary} filled />
          </View>
          <View>
            <Text style={styles.projectsValue}>{activeProjects}</Text>
            <Text style={styles.projectsLabel}>Active Projects</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.detailsButton, pressed && styles.detailsButtonPressed]}
          onPress={onDetailsPress}
        >
          <Text style={styles.detailsText}>Details</Text>
          <BhuguardMaterialIcon name="chevron_right" size={14} color={dashboardTheme.primaryFixedDim} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dashboardTheme.primary,
    borderRadius: 12,
    padding: 16,
    minHeight: 160,
    justifyContent: 'space-between',
    overflow: 'hidden',
    ...dashboardShadow,
    marginBottom: 24,
  },
  decorAccent: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: dashboardTheme.onPrimary,
    opacity: 0.05,
  },
  content: {
    zIndex: 1,
    gap: 4,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: dashboardTheme.primaryFixedDim,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: dashboardTheme.onPrimary,
  },
  unit: {
    fontSize: 14,
    lineHeight: 20,
    color: dashboardTheme.primaryFixed,
  },
  caption: {
    fontSize: 11,
    lineHeight: 14,
    color: dashboardTheme.onPrimary,
    opacity: 0.8,
    marginTop: 4,
  },
  footer: {
    zIndex: 1,
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  projectsBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  projectsIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: dashboardTheme.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectsValue: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: dashboardTheme.onPrimary,
  },
  projectsLabel: {
    fontSize: 11,
    lineHeight: 14,
    color: dashboardTheme.onPrimary,
    opacity: 0.8,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  detailsButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  detailsText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: dashboardTheme.primaryFixedDim,
  },
});
