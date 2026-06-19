import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LOGO_SIZES } from '../../../constants/branding';
import { officerTheme } from '../../../theme/officerDashboardTheme';
import { BhuguardLogo } from '../../shared/BhuguardLogo';
import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';

interface OfficerFeedstockVerificationHeaderProps {
  officerName: string;
  onBackPress: () => void;
  onNotificationsPress: () => void;
  onProfilePress: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return (parts[0] ?? 'FO').slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export function OfficerFeedstockVerificationHeader({
  officerName,
  onBackPress,
  onNotificationsPress,
  onProfilePress,
}: OfficerFeedstockVerificationHeaderProps) {
  return (
    <View style={styles.bar}>
      <Pressable style={styles.iconButton} onPress={onBackPress} accessibilityLabel="Go back">
        <View style={styles.backIcon}>
          <BhuguardMaterialIcon name="arrow_forward" size={20} color={officerTheme.primary} />
        </View>
      </Pressable>

      <View style={styles.center}>
        <BhuguardLogo size={LOGO_SIZES.moduleHeader} />
        <Text style={styles.title}>Feedstock Verification</Text>
      </View>

      <View style={styles.trailing}>
        <Pressable style={styles.iconButton} onPress={onNotificationsPress}>
          <BhuguardMaterialIcon name="notifications" size={22} color={officerTheme.primary} />
        </Pressable>
        <Pressable style={styles.avatar} onPress={onProfilePress}>
          <Text style={styles.avatarText}>{getInitials(officerName)}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: officerTheme.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: officerTheme.marginMobile,
    paddingVertical: 8,
    backgroundColor: officerTheme.surfaceLowest,
    borderBottomWidth: 1,
    borderBottomColor: officerTheme.outlineVariant,
  },
  center: { flex: 1, alignItems: 'center', gap: 2 },
  title: { fontSize: 14, fontWeight: '700', color: officerTheme.primary },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  backIcon: { transform: [{ rotate: '180deg' }] },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: officerTheme.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 12, fontWeight: '700', color: officerTheme.onPrimary },
});
