import { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../../api/authApi';
import { getArtisanBiocharMixingRecords } from '../../api/artisanApi';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { ScreenHeader } from '../../components/ScreenHeader';
import type { ArtisanStackParamList } from '../../navigation/types';
import { artisanTheme } from '../../theme/artisanTheme';
import { spacing } from '../../theme';
import { extractList, pickString, type ApiRecord } from '../../utils/apiHelpers';
import { getFarmCoordinates, openGoogleMaps } from '../../utils/farmMapHelpers';

type Nav = NativeStackNavigationProp<ArtisanStackParamList, 'ArtisanMixingRecords'>;

export function ArtisanMixingRecordsScreen() {
  const navigation = useNavigation<Nav>();
  const [records, setRecords] = useState<ApiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getArtisanBiocharMixingRecords('submitted');
      setRecords(extractList(data as ApiRecord, ['records', 'mixings', 'biochar_mixings', 'items']));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load submitted mixing records.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (loading && records.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <LoadingState message="Loading submitted mixing records..." />
      </SafeAreaView>
    );
  }

  if (error && records.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ErrorState message={error} onRetry={load} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Submitted Mixing"
        subtitle="Review submitted mixing records"
        showBrandLogo
        logoOnPress={() => navigation.navigate('ArtisanDashboard')}
      />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
      >
        {records.length === 0 ? (
          <Text style={styles.empty}>No submitted mixing records yet.</Text>
        ) : (
          records.map((record) => {
            const id = Number(record.id);
            const mixingCode = pickString(record, 'mixing_code', 'mixingCode', 'code');
            const farmId = Number(record.farm_id ?? record.farmId ?? 0);
            const farmerId = Number(record.farmer_id ?? record.farmerId ?? 0) || undefined;
            const statusLabel = pickString(record, 'status_label', 'status');

            return (
              <View key={id} style={styles.card}>
                <Text style={styles.fieldLabel}>Mixing ID</Text>
                <Text style={styles.fieldValue}>{mixingCode !== '-' ? mixingCode : `Record #${id}`}</Text>

                <Text style={styles.fieldLabel}>Farm</Text>
                <Text style={styles.fieldValue}>{pickString(record, 'farm_name', 'farmName')}</Text>

                <Text style={styles.fieldLabel}>Farm ID</Text>
                <Text style={styles.fieldValue}>
                  {pickString(record, 'farm_code', 'farmCode') !== '-'
                    ? pickString(record, 'farm_code', 'farmCode')
                    : pickString(record, 'farm_id', 'farmId')}
                </Text>

                <Text style={styles.fieldLabel}>Farmer Name</Text>
                <Text style={styles.fieldValue}>{pickString(record, 'farmer_name', 'farmerName')}</Text>

                <Text style={styles.fieldLabel}>Status</Text>
                <Text style={styles.statusValue}>{statusLabel !== '-' ? statusLabel : 'Submitted'}</Text>

                <View style={styles.actions}>
                  {farmId > 0 ? (
                    <Pressable
                      style={styles.actionButton}
                      onPress={() =>
                        navigation.navigate('ArtisanBiocharMixing', {
                          farmId,
                          farmerId,
                          farmerCode:
                            pickString(record, 'farmer_code', 'farmerCode') !== '-'
                              ? pickString(record, 'farmer_code', 'farmerCode')
                              : undefined,
                          farmerName:
                            pickString(record, 'farmer_name', 'farmerName') !== '-'
                              ? pickString(record, 'farmer_name', 'farmerName')
                              : undefined,
                          farmCode:
                            pickString(record, 'farm_code', 'farmCode') !== '-'
                              ? pickString(record, 'farm_code', 'farmCode')
                              : undefined,
                          farmLabel:
                            pickString(record, 'farm_name', 'farmName') !== '-'
                              ? pickString(record, 'farm_name', 'farmName')
                              : undefined,
                          village:
                            pickString(record, 'village') !== '-' ? pickString(record, 'village') : undefined,
                          taluka:
                            pickString(record, 'taluka') !== '-' ? pickString(record, 'taluka') : undefined,
                          district:
                            pickString(record, 'district') !== '-' ? pickString(record, 'district') : undefined,
                          state: pickString(record, 'state') !== '-' ? pickString(record, 'state') : undefined,
                          recordId: id > 0 ? id : undefined,
                        })
                      }
                    >
                      <Text style={styles.actionButtonText}>Open Record</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => {
                      void (async () => {
                        const coords = getFarmCoordinates(record);
                        if (!coords) {
                          Alert.alert(
                            'GPS missing',
                            'This farm has no saved GPS coordinates. Navigation cannot invent a location.',
                          );
                          return;
                        }
                        await openGoogleMaps(
                          coords,
                          pickString(record, 'farm_name', 'farmName') !== '-'
                            ? pickString(record, 'farm_name', 'farmName')
                            : undefined,
                        );
                      })();
                    }}
                  >
                    <Text style={styles.actionButtonText}>Navigate Farm</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: artisanTheme.creamBg },
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  empty: { fontSize: 14, color: artisanTheme.secondaryText, textAlign: 'center', marginTop: 24 },
  card: {
    backgroundColor: artisanTheme.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: artisanTheme.softBorder,
    padding: spacing.md,
    gap: 4,
    ...artisanTheme.cardShadow,
  },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: artisanTheme.secondaryText, marginTop: 4 },
  fieldValue: { fontSize: 14, fontWeight: '700', color: artisanTheme.deepText },
  statusValue: { fontSize: 14, fontWeight: '700', color: artisanTheme.actionGreen },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  actionButton: {
    borderRadius: 10,
    backgroundColor: artisanTheme.cream,
    borderWidth: 1,
    borderColor: artisanTheme.softBorder,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  actionButtonText: { fontSize: 12, fontWeight: '700', color: artisanTheme.tertiary },
});
