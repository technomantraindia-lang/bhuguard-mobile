import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { getApiErrorMessage } from '../../api/authApi';
import { getArtisanBiocharProductionRecords } from '../../api/artisanApi';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { ScreenHeader } from '../../components/ScreenHeader';
import type { ArtisanStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { extractList, pickString, type ApiRecord } from '../../utils/apiHelpers';

type Nav = NativeStackNavigationProp<ArtisanStackParamList, 'ArtisanProductionRecords'>;
type ScreenRoute = RouteProp<ArtisanStackParamList, 'ArtisanProductionRecords'>;

export function ArtisanProductionRecordsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();
  const status = route.params.status;
  const [records, setRecords] = useState<ApiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const title = status === 'draft' ? 'Draft Records' : 'Submitted Records';

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getArtisanBiocharProductionRecords(status);
      setRecords(extractList(data as ApiRecord, ['records', 'batches']));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load production records.'));
    } finally {
      setLoading(false);
    }
  }, [status]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (loading && records.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message={`Loading ${title.toLowerCase()}...`} />
      </SafeAreaView>
    );
  }

  if (error && records.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message={error} onRetry={load} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={title} />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
      >
        {records.length === 0 ? (
          <Text style={styles.empty}>No {status} production records yet.</Text>
        ) : (
          records.map((record) => {
            const id = Number(record.id);
            const batchCode = pickString(record, 'batch_code', 'batchCode');
            const farmId = Number(record.farm_id ?? 0);
            const canEdit = record.can_edit === true || record.is_draft === true;

            return (
              <Pressable
                key={id}
                style={styles.card}
                onPress={() => {
                  if (!farmId) {
                    return;
                  }

                  navigation.navigate('ArtisanBiocharProduction', {
                    farmId,
                    batchId: id,
                    farmLabel: pickString(record, 'farm_name', 'farmName'),
                  });
                }}
              >
                <Text style={styles.cardTitle}>{batchCode !== '-' ? batchCode : `Record #${id}`}</Text>
                <Text style={styles.cardMeta}>Farm: {pickString(record, 'farm_name', 'farmName')}</Text>
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Farmer Name</Text>
                  <Text style={styles.fieldValue}>
                    {pickString(record, 'farmer_name', 'farmerName') !== '-'
                      ? pickString(record, 'farmer_name', 'farmerName')
                      : '—'}
                  </Text>
                </View>
                <Text style={styles.cardMeta}>Status: {pickString(record, 'status')}</Text>
                {canEdit && status === 'draft' ? <Text style={styles.badge}>Tap to continue editing</Text> : null}
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  cardMeta: { color: colors.textMuted },
  fieldBlock: { marginTop: 4, gap: 2 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  fieldValue: { fontSize: 15, fontWeight: '600', color: colors.text },
  badge: { color: colors.primary, fontWeight: '600', marginTop: 4 },
});
