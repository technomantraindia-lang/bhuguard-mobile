import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandedHeaderLogo } from '../../shared/BrandedHeaderLogo';
import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';
import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';

interface BoundaryFlowHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
}

export function BoundaryFlowHeader({ title, subtitle, onBack }: BoundaryFlowHeaderProps) {
  return (
    <View style={styles.wrap}>
      <Pressable style={styles.backButton} onPress={onBack} accessibilityLabel="Go back">
        <BhuguardMaterialIcon name="chevron_right" size={22} color={dashboardTheme.primaryContainer} />
      </Pressable>

      <View style={styles.center}>
        <BrandedHeaderLogo size={28} />
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: dashboardTheme.marginMobile,
    paddingVertical: 10,
    backgroundColor: dashboardTheme.surface,
    gap: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '180deg' }],
  },
  center: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: dashboardTheme.headingGreen,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: dashboardTheme.onSurfaceVariant,
  },
  spacer: {
    width: 40,
  },
});
