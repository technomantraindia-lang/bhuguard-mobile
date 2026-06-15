import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';
import { dashboardShadow, dashboardTheme } from '../../../theme/bhuguardDashboardTheme';

interface ProfileAccordionSectionProps {
  title: string;
  icon: 'person' | 'location_on' | 'payments' | 'assignment' | 'verified' | 'notifications' | 'support_agent';
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function ProfileAccordionSection({
  title,
  icon,
  expanded,
  onToggle,
  children,
}: ProfileAccordionSectionProps) {
  return (
    <View style={[styles.card, dashboardShadow]}>
      <Pressable style={styles.header} onPress={onToggle}>
        <View style={styles.headerLeft}>
          <View style={styles.iconWrap}>
            <BhuguardMaterialIcon name={icon} size={20} color={dashboardTheme.primaryContainer} />
          </View>
          <Text style={styles.title}>{title}</Text>
        </View>
        <Svg
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill="none"
          style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
        >
          <Path d="M6 9l6 6 6-6" stroke={dashboardTheme.outline} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      </Pressable>

      {expanded ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: dashboardTheme.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: dashboardTheme.headingGreen,
    flexShrink: 1,
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: dashboardTheme.outlineVariant,
    paddingTop: 12,
  },
});
