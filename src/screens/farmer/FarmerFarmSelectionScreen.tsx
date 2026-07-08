import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { AppButton } from '../../components/AppButton';
import { useFarmerFarmActivityForm } from '../../hooks/useFarmerFarmActivityForm';
import type { FarmerStackParamList } from '../../navigation/types';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmerFarmSelection'>;

function statusColor(color: string) {
  if (color === 'red') {
    return dashboardTheme.error;
  }

  if (color === 'yellow') {
    return '#CA8A04';
  }

  if (color === 'green') {
    return dashboardTheme.primaryContainer;
  }

  return dashboardTheme.textMuted;
}

export function FarmerFarmSelectionScreen({ navigation }: Props) {
  const form = useFarmerFarmActivityForm();

  if (form.loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading your linked farms..." />
      </SafeAreaView>
    );
  }

  if (form.farms.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Select Farm" subtitle="Choose a farm for Farm Activity" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.emptyWrap}>
          <EmptyState
            title="No farm linked"
            message="No farm is linked with your account. Please contact your Field Officer."
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Select Farm" subtitle="Choose a farm for Farm Activity" showBack onBackPress={() => navigation.goBack()} />

      <FlatList
        data={form.farms}
        keyExtractor={(item) => String(item.farmId)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, dashboardShadow, pressed && styles.pressed]}
            onPress={() => navigation.navigate('FarmerFarmActivity', { farmId: item.farmId })}
          >
            <Text style={styles.farmCode}>{item.farmCode !== '-' ? item.farmCode : `Farm #${item.farmId}`}</Text>
            <Text style={styles.farmerName}>{item.farmerName !== '-' ? item.farmerName : 'Farmer'}</Text>
            <Text style={styles.meta}>{[item.village, item.taluka, item.district, item.state].filter((v) => v && v !== '-').join(', ')}</Text>
            <Text style={styles.meta}>Area: {item.areaLabel}</Text>
            {item.ownershipType !== '-' ? <Text style={styles.meta}>Ownership: {item.ownershipType}</Text> : null}
            <View style={styles.statusRow}>
              <Text style={styles.meta}>Last Farm Update: {item.lastFarmUpdateDate ?? '—'}</Text>
              <Text style={styles.meta}>Next Farm Update: {item.nextFarmUpdateDate ?? '—'}</Text>
            </View>
            <Text style={[styles.statusBadge, { color: statusColor(item.statusColor) }]}>
              {item.farmUpdateStatusLabel !== '-' ? item.farmUpdateStatusLabel : 'Not Started'}
            </Text>
            <AppButton label="Select Farm" onPress={() => navigation.navigate('FarmerFarmActivity', { farmId: item.farmId })} />
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dashboardTheme.background },
  list: { padding: dashboardTheme.marginMobile, gap: 12, paddingBottom: 32 },
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 16,
    gap: 8,
  },
  farmCode: { fontSize: 18, fontWeight: '700', color: dashboardTheme.onSurface },
  farmerName: { fontSize: 15, fontWeight: '600', color: dashboardTheme.onSurface },
  meta: { fontSize: 13, color: dashboardTheme.textMuted },
  statusRow: { gap: 4, marginTop: 4 },
  statusBadge: { fontSize: 13, fontWeight: '700' },
  emptyWrap: { flex: 1, justifyContent: 'center', padding: 24 },
  pressed: { opacity: 0.94 },
});
