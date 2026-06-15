import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { DashboardCard } from './DashboardCard';

export interface DashboardMenuItem {
  key: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}

interface DashboardMenuProps {
  items: DashboardMenuItem[];
}

export function DashboardMenu({ items }: DashboardMenuProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Modules</Text>
      {items.map((item) => (
        <DashboardCard
          key={item.key}
          title={item.title}
          subtitle={item.subtitle}
          onPress={item.onPress}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  heading: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 },
});
