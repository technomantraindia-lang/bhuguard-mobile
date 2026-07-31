import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../../api/authApi';
import { searchFieldOfficerFarms } from '../../api/fieldOfficerApi';
import { AppButton } from '../../components/AppButton';
import { FormSelect, type SelectOption } from '../../components/FormSelect';
import { ScreenHeader } from '../../components/ScreenHeader';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import type { AssignedFarmSearchRecord } from '../../types/assignedLocations';
import { openGoogleMaps } from '../../utils/officerGpsCapture';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList, 'FieldOfficerNavigate'>;

export function FieldOfficerNavigateScreen() {
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AssignedFarmSearchRecord[]>([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState<number | null>(null);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const farmerOptions = useMemo(() => {
    const map = new Map<number, AssignedFarmSearchRecord>();
    for (const item of results) {
      if (!map.has(item.farmer_id)) {
        map.set(item.farmer_id, item);
      }
    }
    return [...map.values()];
  }, [results]);

  const farmsForFarmer = useMemo(
    () => results.filter((item) => item.farmer_id === selectedFarmerId),
    [results, selectedFarmerId],
  );

  const selectedFarm = useMemo(
    () => farmsForFarmer.find((item) => String(item.farm_id) === selectedFarmId) ?? null,
    [farmsForFarmer, selectedFarmId],
  );

  const selectedFarmer = useMemo(
    () => farmerOptions.find((item) => item.farmer_id === selectedFarmerId) ?? null,
    [farmerOptions, selectedFarmerId],
  );

  const farmSelectOptions: SelectOption[] = farmsForFarmer.map((farm) => ({
    id: farm.farm_id,
    name: `${farm.farm_code ?? farm.farm_id} — ${farm.village || 'Farm'}`,
  }));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await searchFieldOfficerFarms({
        q: query.trim() || undefined,
        limit: 40,
      });

      if (!response.success) {
        setResults([]);
        setError(response.message || 'Unable to search farms.');
        return;
      }

      setResults(response.data ?? []);
      if (!response.data?.length) {
        setError('No matching farmers found.');
      }
    } catch (err) {
      setResults([]);
      setError(getApiErrorMessage(err, 'Failed to search farmers.'));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, []);

  const selectFarmer = (farmerId: number) => {
    setSelectedFarmerId(farmerId);
    const farms = results.filter((item) => item.farmer_id === farmerId);
    if (farms.length === 1) {
      setSelectedFarmId(String(farms[0].farm_id));
    } else {
      setSelectedFarmId('');
    }
    setError(null);
  };

  const navigateToFarm = async () => {
    if (!selectedFarm) {
      setError('Select a Farm before navigation.');
      return;
    }

    const latitude = Number(selectedFarm.latitude);
    const longitude = Number(selectedFarm.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setError('Farm location is not available. Complete Farm Mapping before navigation.');
      return;
    }

    try {
      await openGoogleMaps(latitude, longitude);
    } catch {
      setError('Unable to open maps for this Farm location.');
    }
  };

  const mappingStatus =
    selectedFarm &&
    Number.isFinite(Number(selectedFarm.latitude)) &&
    Number.isFinite(Number(selectedFarm.longitude))
      ? 'Mapped'
      : 'Unmapped';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Navigate" onBackPress={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text style={styles.helper}>Search Farmer, select Farm, then open maps for the selected Farm location.</Text>

        <View style={styles.row}>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Farmer Name, Farmer ID, Mobile, Village"
            placeholderTextColor="#9CA3AF"
            onSubmitEditing={() => void load()}
          />
          <Pressable style={styles.searchButton} onPress={() => void load()} disabled={loading}>
            <Text style={styles.searchButtonText}>{loading ? '…' : 'Search'}</Text>
          </Pressable>
        </View>

        {loading && results.length === 0 ? <ActivityIndicator color={colors.primary} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!selectedFarmerId ? (
          <FlatList
            data={farmerOptions}
            keyExtractor={(item) => String(item.farmer_id)}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Pressable style={styles.card} onPress={() => selectFarmer(item.farmer_id)}>
                <Text style={styles.cardTitle}>{item.farmer_name ?? 'Farmer'}</Text>
                <Text style={styles.meta}>Farmer ID: {item.farmer_code ?? item.farmer_id}</Text>
                <Text style={styles.meta}>Village: {item.village || '—'}</Text>
              </Pressable>
            )}
          />
        ) : (
          <>
            {farmsForFarmer.length > 1 ? (
              <FormSelect
                label="Farm"
                placeholder="Select farm"
                value={selectedFarmId}
                displayValue={
                  selectedFarm
                    ? `${selectedFarm.farm_code ?? selectedFarm.farm_id} — ${selectedFarm.village || 'Farm'}`
                    : undefined
                }
                options={farmSelectOptions}
                onSelect={(option) => setSelectedFarmId(String(option.id))}
              />
            ) : null}

            {selectedFarm ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Navigation context</Text>
                <Text style={styles.meta}>Farmer Name: {selectedFarmer?.farmer_name ?? '—'}</Text>
                <Text style={styles.meta}>
                  Farmer ID: {selectedFarmer?.farmer_code ?? selectedFarmer?.farmer_id ?? '—'}
                </Text>
                <Text style={styles.meta}>Farm ID: {selectedFarm.farm_code ?? selectedFarm.farm_id}</Text>
                <Text style={styles.meta}>Village: {selectedFarm.village || '—'}</Text>
                <Text style={styles.meta}>Latitude: {selectedFarm.latitude ?? '—'}</Text>
                <Text style={styles.meta}>Longitude: {selectedFarm.longitude ?? '—'}</Text>
                <Text style={styles.meta}>Mapping status: {mappingStatus}</Text>
                <AppButton label="Navigate to Farm" onPress={() => void navigateToFarm()} />
                <AppButton
                  label="Change Farmer"
                  variant="secondary"
                  onPress={() => {
                    setSelectedFarmerId(null);
                    setSelectedFarmId('');
                  }}
                />
              </View>
            ) : (
              <Text style={styles.meta}>Select a Farm to continue.</Text>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.md, gap: spacing.md },
  helper: { fontSize: 13, color: '#4B5563', lineHeight: 20 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchButtonText: { color: '#FFFFFF', fontWeight: '700' },
  list: { gap: 10, paddingBottom: 24 },
  card: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  meta: { fontSize: 13, color: '#4B5563' },
  error: { color: '#B91C1C', fontSize: 13 },
});
