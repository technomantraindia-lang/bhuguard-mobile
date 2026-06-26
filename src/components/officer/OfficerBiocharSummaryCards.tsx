import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { officerCardShadow, officerTheme } from '../../theme/officerDashboardTheme';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList>;

interface OfficerBiocharSummaryCardsProps {
  assignedFarmersCount: number;
  dueBiocharCount: number;
  overdueFarmersCount: number;
  draftBiocharCount: number;
  submittedBiocharCount: number;
}

function SummaryCard({
  label,
  value,
  tone = 'default',
  onPress,
}: {
  label: string;
  value: number;
  tone?: 'default' | 'warning' | 'danger' | 'success';
  onPress?: () => void;
}) {
  const toneStyles = {
    default: { bg: officerTheme.surface, border: officerTheme.outlineVariant, value: officerTheme.onSurface },
    warning: { bg: '#FFFBEB', border: '#CA8A04', value: '#A16207' },
    danger: { bg: '#FEF2F2', border: officerTheme.error, value: '#B91C1C' },
    success: { bg: '#ECFDF5', border: '#059669', value: '#047857' },
  }[tone];

  return (
    <Pressable style={[styles.card, officerCardShadow, { backgroundColor: toneStyles.bg, borderColor: toneStyles.border }]} onPress={onPress} disabled={!onPress}>
      <Text style={[styles.value, { color: toneStyles.value }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

export function OfficerBiocharSummaryCards({
  assignedFarmersCount,
  dueBiocharCount,
  overdueFarmersCount,
  draftBiocharCount,
  submittedBiocharCount,
}: OfficerBiocharSummaryCardsProps) {
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <BhuguardMaterialIcon name="eco" size={20} color={officerTheme.primary} />
        <Text style={styles.title}>Biochar Program</Text>
      </View>

      <View style={styles.grid}>
        <SummaryCard label="My Farmers" value={assignedFarmersCount} onPress={() => navigation.navigate('FieldOfficerTabs', { screen: 'Farmers' })} />
        <SummaryCard label="Due Soon" value={dueBiocharCount} tone="warning" onPress={() => navigation.navigate('FieldOfficerTabs', { screen: 'Farmers' })} />
        <SummaryCard label="Overdue" value={overdueFarmersCount} tone="danger" onPress={() => navigation.navigate('FieldOfficerTabs', { screen: 'Farmers' })} />
        <SummaryCard label="Draft Activities" value={draftBiocharCount} onPress={() => navigation.navigate('FieldOfficerBiocharProductionList')} />
        <SummaryCard label="Submitted" value={submittedBiocharCount} tone="success" onPress={() => navigation.navigate('FieldOfficerBiocharProductionList')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, marginBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 16, fontWeight: '700', color: officerTheme.onSurface },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    width: '48%',
    flexGrow: 1,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    gap: 4,
  },
  value: { fontSize: 24, fontWeight: '800' },
  label: { fontSize: 13, color: officerTheme.onSurfaceVariant, fontWeight: '600' },
});
