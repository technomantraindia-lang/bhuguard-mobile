import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { BrandedHeaderLogo } from '../shared/BrandedHeaderLogo';
import { getAuthUser } from '../../storage/authStorage';
import { officerCardShadow, officerTheme } from '../../theme/officerDashboardTheme';

interface OfficerReportsHeaderProps {
  onBack: () => void;
  onNotificationsPress: () => void;
  onProfilePress?: () => void;
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

export function OfficerReportsHeader({
  onBack,
  onNotificationsPress,
  onProfilePress,
}: OfficerReportsHeaderProps) {
  const [displayName, setDisplayName] = useState('Officer');

  useEffect(() => {
    void getAuthUser().then((user) => {
      if (user?.name) {
        setDisplayName(user.name);
      }
    });
  }, []);

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.backButton} onPress={onBack} accessibilityLabel="Go back">
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M15 18l-6-6 6-6"
            stroke={officerTheme.primary}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Pressable>

      <View style={styles.titleWrap}>
        <BrandedHeaderLogo />
        <View>
          <Text style={styles.title}>Reports</Text>
          <Text style={styles.subtitle}>View, submit and download verification reports</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.iconButton, officerCardShadow]} onPress={onNotificationsPress}>
          <BhuguardMaterialIcon name="notifications" size={22} color={officerTheme.primary} />
        </Pressable>

        <Pressable style={styles.avatarButton} onPress={onProfilePress}>
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: officerTheme.marginMobile,
    paddingVertical: 12,
    backgroundColor: officerTheme.surfaceLowest,
    borderBottomWidth: 1,
    borderBottomColor: officerTheme.outlineVariant,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: officerTheme.primary,
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 15,
    color: officerTheme.onSurfaceVariant,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: officerTheme.surfaceLowest,
  },
  avatarButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: officerTheme.surfaceVariant,
  },
  avatarFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: officerTheme.secondaryContainer,
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: officerTheme.onSecondaryContainer,
  },
});
