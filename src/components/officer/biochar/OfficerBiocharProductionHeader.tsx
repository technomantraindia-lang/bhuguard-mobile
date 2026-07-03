import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LOGO_SIZES } from '../../../constants/branding';
import { officerTheme } from '../../../theme/officerDashboardTheme';
import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';
import { ScreenHeader } from '../../ScreenHeader';

interface OfficerBiocharProductionHeaderProps {
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

export function OfficerBiocharProductionHeader({
  officerName,
  onBackPress,
  onNotificationsPress,
  onProfilePress,
}: OfficerBiocharProductionHeaderProps) {
  return (
    <ScreenHeader
      title="Biochar Process"
      showBack
      showBrandLogo
      onBackPress={onBackPress}
      rightSlot={
        <View style={styles.trailing}>
          <Pressable style={styles.iconButton} onPress={onNotificationsPress} accessibilityLabel="Notifications">
            <BhuguardMaterialIcon name="notifications" size={22} color={officerTheme.primaryContainer} />
          </Pressable>
          <Pressable style={styles.avatar} onPress={onProfilePress} accessibilityLabel="Profile">
            <Text style={styles.avatarText}>{getInitials(officerName)}</Text>
          </Pressable>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  trailing: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
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
