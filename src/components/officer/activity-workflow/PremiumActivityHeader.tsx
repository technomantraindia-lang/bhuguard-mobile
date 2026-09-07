import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LOGO_SIZES } from '../../../constants/branding';
import { officerTheme } from '../../../theme/officerDashboardTheme';
import { BhuguardLogo } from '../../shared/BhuguardLogo';
import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';
import { premiumWorkflowTheme } from './premiumActivityWorkflowTheme';

interface PremiumActivityHeaderProps {
  title: string;
  subtitle: string;
  onBack: () => void;
}

export function PremiumActivityHeader({ title, subtitle, onBack }: PremiumActivityHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: Math.max(insets.top, 0) + 6 }]}>
      <View style={styles.bar}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.backPressed]}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <View style={styles.backIcon}>
            <BhuguardMaterialIcon name="arrow_forward" size={20} color={officerTheme.primary} />
          </View>
        </Pressable>

        <View style={styles.center}>
          <BhuguardLogo size={LOGO_SIZES.moduleHeader} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        </View>

        <View style={styles.trailingSpacer} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: premiumWorkflowTheme.glassBackground,
    borderBottomWidth: 1,
    borderBottomColor: premiumWorkflowTheme.glassBorder,
  },
  bar: {
    minHeight: officerTheme.headerHeight,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: officerTheme.marginMobile,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: premiumWorkflowTheme.primaryGreenSoft,
    marginTop: 4,
  },
  backPressed: { opacity: 0.85, transform: [{ scale: 0.96 }] },
  backIcon: { transform: [{ rotate: '180deg' }] },
  center: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 2,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: premiumWorkflowTheme.primaryGreen,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: premiumWorkflowTheme.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  trailingSpacer: { width: 40 },
});
