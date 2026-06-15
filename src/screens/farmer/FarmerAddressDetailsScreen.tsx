import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useFarmerProfileForm } from '../../hooks/useFarmerProfileForm';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export function FarmerAddressDetailsScreen() {
  const { profile, loading, error, reload } = useFarmerProfileForm();

  if (loading && !profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading address details..." />
      </SafeAreaView>
    );
  }

  if (error && !profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message={error} onRetry={reload} />
      </SafeAreaView>
    );
  }

  const address = profile!;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={dashboardTheme.primary} />}
      >
        <ScreenHeader title="Address Details" subtitle="Your registered farm address" />
        <View style={styles.card}>
          <DetailRow label="Village" value={address.village || '—'} />
          <DetailRow label="Taluka" value={address.taluka || '—'} />
          <DetailRow label="District" value={address.district || '—'} />
          <DetailRow label="State" value={address.state || '—'} />
          <DetailRow label="Pincode" value={address.pincode || '—'} />
          <DetailRow label="Address" value={address.fullAddress || '—'} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: dashboardTheme.background,
  },
  content: {
    padding: dashboardTheme.marginMobile,
    gap: 16,
  },
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 16,
    gap: 14,
  },
  row: {
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: dashboardTheme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  value: {
    fontSize: 16,
    lineHeight: 24,
    color: dashboardTheme.onSurface,
    fontWeight: '500',
  },
});
