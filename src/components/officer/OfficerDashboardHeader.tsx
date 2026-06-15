import { Pressable, StyleSheet, Text, View } from 'react-native';

import { OfficerMaterialIcon } from './OfficerMaterialIcon';
import { officerShadow, officerTheme } from '../../theme/officerDashboardTheme';

interface OfficerDashboardHeaderProps {
  officerName: string;
  onSyncPress?: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return 'FO';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export function OfficerDashboardHeader({ officerName, onSyncPress }: OfficerDashboardHeaderProps) {
  return (
    <View style={styles.bar}>
      <View style={styles.leading}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(officerName)}</Text>
        </View>
      </View>

      <Text style={styles.brand}>Bhuguard</Text>

      <Pressable
        style={({ pressed }) => [styles.syncButton, pressed && styles.syncButtonPressed]}
        onPress={onSyncPress}
        accessibilityRole="button"
        accessibilityLabel="Sync dashboard"
      >
        <OfficerMaterialIcon name="sync" size={22} color={officerTheme.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: officerTheme.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: officerTheme.marginMobile,
    backgroundColor: officerTheme.surfaceLowest,
    borderBottomWidth: 1,
    borderBottomColor: officerTheme.outlineVariant,
    ...officerShadow,
  },
  leading: {
    width: 40,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: officerTheme.surfaceLow,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    color: officerTheme.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  brand: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    color: officerTheme.primary,
    letterSpacing: -0.24,
  },
  syncButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  syncButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
});
