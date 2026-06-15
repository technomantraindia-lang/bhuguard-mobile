import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';

interface ProfileToggleRowProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function ProfileToggleRow({ label, value, onValueChange }: ProfileToggleRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: dashboardTheme.outlineVariant, true: dashboardTheme.secondaryContainer }}
        thumbColor={value ? dashboardTheme.primaryContainer : dashboardTheme.surfaceLowest}
      />
    </View>
  );
}

interface ProfileLinkRowProps {
  label: string;
  onPress: () => void;
}

export function ProfileLinkRow({ label, onPress }: ProfileLinkRowProps) {
  return (
    <Pressable style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]} onPress={onPress}>
      <Text style={styles.linkLabel}>{label}</Text>
      <Text style={styles.linkAction}>Open</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 4,
  },
  label: {
    fontSize: 15,
    lineHeight: 22,
    color: dashboardTheme.onSurface,
    flex: 1,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: dashboardTheme.outlineVariant,
  },
  pressed: {
    opacity: 0.9,
  },
  linkLabel: {
    fontSize: 15,
    color: dashboardTheme.onSurface,
  },
  linkAction: {
    fontSize: 14,
    fontWeight: '600',
    color: dashboardTheme.primaryContainer,
  },
});
