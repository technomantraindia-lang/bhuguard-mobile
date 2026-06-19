import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon, type BhuguardIconName } from '../../shared/BhuguardMaterialIcon';
import { officerCardShadow, officerTheme } from '../../../theme/officerDashboardTheme';

interface OfficerProfileMenuRowProps {
  icon: BhuguardIconName;
  iconBackground?: string;
  iconColor?: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}

export function OfficerProfileMenuRow({
  icon,
  iconBackground = officerTheme.surfaceContainerHigh,
  iconColor = officerTheme.onSurface,
  title,
  subtitle,
  onPress,
}: OfficerProfileMenuRowProps) {
  return (
    <Pressable style={[styles.row, officerCardShadow]} onPress={onPress}>
      <View style={styles.leading}>
        <View style={[styles.iconWrap, { backgroundColor: iconBackground }]}>
          <BhuguardMaterialIcon name={icon} size={20} color={iconColor} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>
      <BhuguardMaterialIcon name="chevron_right" size={22} color={officerTheme.outline} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(191, 201, 190, 0.3)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
    paddingRight: 8,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: officerTheme.onSurface,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: officerTheme.onSurfaceVariant,
  },
});
