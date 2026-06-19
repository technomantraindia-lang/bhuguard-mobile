import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';
import { officerCardShadow, officerTheme } from '../../../theme/officerDashboardTheme';

interface OfficerProfileAppBarProps {
  onBack?: () => void;
  onNotificationsPress?: () => void;
}

export function OfficerProfileAppBar({ onBack, onNotificationsPress }: OfficerProfileAppBarProps) {
  return (
    <View style={[styles.bar, officerCardShadow]}>
      <Pressable style={styles.iconButton} onPress={onBack} accessibilityLabel="Go back">
        <Text style={styles.backText}>←</Text>
      </Pressable>

      <Text style={styles.brand}>Bhuguard MRV</Text>

      <Pressable style={styles.iconButton} onPress={onNotificationsPress} accessibilityLabel="Notifications">
        <BhuguardMaterialIcon name="notifications" size={22} color={officerTheme.primary} />
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
    backgroundColor: officerTheme.surface,
    borderBottomWidth: 1,
    borderBottomColor: officerTheme.outlineVariant,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  backText: {
    fontSize: 22,
    fontWeight: '700',
    color: officerTheme.onSurfaceVariant,
  },
  brand: {
    fontSize: 20,
    fontWeight: '700',
    color: officerTheme.primary,
  },
});
