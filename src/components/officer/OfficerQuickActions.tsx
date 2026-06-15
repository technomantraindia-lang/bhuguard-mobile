import { Pressable, StyleSheet, Text, View } from 'react-native';

import { OfficerMaterialIcon, type OfficerIconName } from './OfficerMaterialIcon';
import { officerTheme } from '../../theme/officerDashboardTheme';

interface OfficerQuickAction {
  key: string;
  label: string;
  icon: OfficerIconName;
  onPress: () => void;
}

interface OfficerQuickActionsProps {
  actions: OfficerQuickAction[];
}

export function OfficerQuickActions({ actions }: OfficerQuickActionsProps) {
  return (
    <View style={styles.row}>
      {actions.map((action) => (
        <Pressable
          key={action.key}
          style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
          onPress={action.onPress}
        >
          <View style={styles.circle}>
            <OfficerMaterialIcon name={action.icon} size={24} color={officerTheme.primary} />
          </View>
          <Text style={styles.label}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 24,
  },
  item: {
    flex: 1,
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
    backgroundColor: officerTheme.surfaceLow,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    color: officerTheme.onSurface,
    textAlign: 'center',
  },
});
