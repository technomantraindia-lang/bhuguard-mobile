import { StyleSheet, TextInput, View } from 'react-native';

import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';
import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';

interface FarmerActivitySearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
}

export function FarmerActivitySearchBar({ value, onChangeText }: FarmerActivitySearchBarProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.icon}>
        <BhuguardMaterialIcon name="search" size={20} color={dashboardTheme.textMuted} />
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search activities..."
        placeholderTextColor={dashboardTheme.textMuted}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 10,
    backgroundColor: dashboardTheme.surfaceLowest,
    paddingHorizontal: 12,
    height: 46,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: dashboardTheme.onSurface,
  },
});
