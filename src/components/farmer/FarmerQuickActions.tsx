import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon, type BhuguardIconName } from '../shared/BhuguardMaterialIcon';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';

interface QuickAction {
  key: string;
  label: string;
  icon: BhuguardIconName;
  primary?: boolean;
  onPress: () => void;
}

interface FarmerQuickActionsProps {
  actions: QuickAction[];
}

export function FarmerQuickActions({ actions }: FarmerQuickActionsProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Quick Actions</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {actions.map((action) => (
          <Pressable
            key={action.key}
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            onPress={action.onPress}
          >
            <View style={[styles.circle, action.primary ? styles.circlePrimary : styles.circleSecondary]}>
              <BhuguardMaterialIcon
                name={action.icon}
                size={24}
                color={action.primary ? dashboardTheme.onPrimary : dashboardTheme.primary}
              />
            </View>
            <Text style={styles.label}>{action.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 24,
    gap: 8,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: dashboardTheme.onBackground,
    paddingHorizontal: 4,
  },
  scrollContent: {
    gap: 16,
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  item: {
    minWidth: 80,
    alignItems: 'center',
    gap: 8,
  },
  itemPressed: {
    transform: [{ scale: 0.95 }],
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circlePrimary: {
    backgroundColor: dashboardTheme.primary,
    ...dashboardShadow,
  },
  circleSecondary: {
    backgroundColor: dashboardTheme.surfaceContainer,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    shadowColor: '#10251A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    color: dashboardTheme.onSurfaceVariant,
    textAlign: 'center',
  },
});
