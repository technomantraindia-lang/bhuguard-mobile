import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';

const COMPANY_AVATAR_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCVpUa8QKaJ6rte4_y5bKIc5VAm2jKoOxXAAfo4R--0Z3jgH6NoJY0A6_b3TH6U8R7A724StEUB9wCqPxmtMnjNhaszbXruZNhcrvx3ti2AdwSVhfVSZp5QpB8_4DAgY4TzCQoOSoqRiZ6UKihFZnyr5W1KuaQnPKwzWKDVkMaNZZtzc3tZ6RIPxE3bt3xc0f6wx7uDaFHiTJzP3jYMRu9V_VyIQ_joSXzwuLsmguA01FcxorDa6nIKrA';

interface CompanyTopAppBarProps {
  onMenuPress?: () => void;
  onProfilePress?: () => void;
}

export function CompanyTopAppBar({ onMenuPress, onProfilePress }: CompanyTopAppBarProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <View style={styles.bar}>
      <Pressable
        style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
        onPress={onMenuPress}
        accessibilityRole="button"
        accessibilityLabel="Menu"
      >
        <BhuguardMaterialIcon name="menu" size={24} color={dashboardTheme.onSurfaceVariant} />
      </Pressable>

      <Text style={styles.brand} numberOfLines={1}>
        Bhuguard
      </Text>

      <Pressable
        style={({ pressed }) => [styles.avatarWrap, pressed && styles.iconButtonPressed]}
        onPress={onProfilePress}
        accessibilityRole="button"
        accessibilityLabel="Profile"
      >
        {!imageError ? (
          <Image
            source={{ uri: COMPANY_AVATAR_URI }}
            style={styles.avatarImage}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.avatarFallback}>
            <BhuguardMaterialIcon name="person" size={18} color={dashboardTheme.primary} />
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: dashboardTheme.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: dashboardTheme.marginMobile,
    backgroundColor: dashboardTheme.surface,
    ...dashboardShadow,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  iconButtonPressed: {
    backgroundColor: dashboardTheme.surfaceContainerHigh,
    transform: [{ scale: 0.95 }],
  },
  brand: {
    flex: 1,
    textAlign: 'center',
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    color: dashboardTheme.primary,
    letterSpacing: -0.64,
  },
  avatarWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    backgroundColor: dashboardTheme.surfaceContainerHighest,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
