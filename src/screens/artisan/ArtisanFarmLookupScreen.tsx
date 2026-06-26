import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../../api/authApi';
import { lookupArtisanFarm } from '../../api/artisanApi';
import { ArtisanGpsStatusCard } from '../../components/artisan/ArtisanGpsStatusCard';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useArtisanGpsTracker } from '../../hooks/useArtisanGpsTracker';
import type { ArtisanStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { pickString, type ApiRecord } from '../../utils/apiHelpers';

type Nav = NativeStackNavigationProp<ArtisanStackParamList, 'ArtisanFarmLookup'>;

export function ArtisanFarmLookupScreen() {
  const navigation = useNavigation<Nav>();
  const [farmIdInput, setFarmIdInput] = useState('');
  const [farm, setFarm] = useState<ApiRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const gps = useArtisanGpsTracker({ farmId: farm?.id ? Number(farm.id) : undefined });

  const handleLookup = async () => {
    const trimmed = farmIdInput.trim();

    if (!trimmed) {
      Alert.alert('Farm ID required', 'Enter or scan a Farm ID to continue.');
      return;
    }

    setLoading(true);
    setError(null);
    setFarm(null);

    try {
      const data = await lookupArtisanFarm(trimmed);
      const resolvedFarm = (data.farm ?? data) as ApiRecord;
      setFarm(resolvedFarm);

      const farmId = Number(resolvedFarm.id ?? resolvedFarm.farm_id);
      if (Number.isFinite(farmId)) {
        await gps.captureGps('farm_lookup', { farmId, biocharProductionId: null, silent: true });
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Farm not found. Please check Farm ID.'));
    } finally {
      setLoading(false);
    }
  };

  const startProduction = () => {
    if (!farm?.id) {
      return;
    }

    const farmLabel = pickString(farm, 'farm_code', 'farm_name');
    navigation.navigate('ArtisanBiocharProduction', {
      farmId: Number(farm.id),
      farmLabel: farmLabel !== '-' ? farmLabel : `Farm ${farm.id}`,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Enter Farm ID" showBrandLogo={false} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Farm ID</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Farm ID"
          value={farmIdInput}
          onChangeText={setFarmIdInput}
          autoCapitalize="characters"
        />

        <Pressable style={[styles.button, loading && styles.buttonDisabled]} disabled={loading} onPress={() => void handleLookup()}>
          <Text style={styles.buttonText}>{loading ? 'Searching…' : 'Find Farm'}</Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <ArtisanGpsStatusCard
          title="Farm Arrival GPS"
          latitude={gps.latitude}
          longitude={gps.longitude}
          accuracyM={gps.accuracyM}
          accuracyTier={gps.accuracyTier}
          lastCapturedAt={gps.lastCapturedAt}
          capturing={gps.capturing}
          isPoorAccuracy={gps.isPoorAccuracy}
          onCaptureGps={() =>
            void gps.captureGps('farm_lookup', {
              farmId: farm?.id ? Number(farm.id) : undefined,
              biocharProductionId: null,
            })
          }
          onRetryGps={() =>
            void gps.retryGps('farm_lookup', {
              farmId: farm?.id ? Number(farm.id) : undefined,
              biocharProductionId: null,
            })
          }
        />

        {farm ? (
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Farm Details (read-only)</Text>
            <DetailRow label="Farm ID" value={String(farm.farm_id ?? farm.id)} />
            <DetailRow label="Farmer" value={pickString(farm, 'farmer_name', 'farmerName')} />
            <DetailRow label="Village" value={pickString(farm, 'village')} />
            <DetailRow label="Farm area" value={pickString(farm, 'area_label', 'areaLabel')} />
            <DetailRow label="Biochar status" value={pickString(farm, 'biochar_status', 'biocharStatus')} />
            <DetailRow label="Last production" value={pickString(farm, 'last_production_date', 'lastProductionDate')} />

            <Pressable style={styles.primaryButton} onPress={startProduction}>
              <Text style={styles.primaryButtonText}>Start Biochar Production</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value !== '-' ? value : '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  label: { fontWeight: '600', color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700' },
  error: { color: colors.danger },
  detailsCard: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailsTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  detailLabel: { color: colors.textMuted, flex: 1 },
  detailValue: { color: colors.text, fontWeight: '600', flex: 1, textAlign: 'right' },
  primaryButton: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
});
