import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
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
import { getFieldOfficerFarmers, searchFieldOfficerFarms } from '../../api/fieldOfficerApi';
import { AppButton } from '../../components/AppButton';
import { ScreenHeader } from '../../components/ScreenHeader';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { extractList, pickString, type ApiRecord } from '../../utils/apiHelpers';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList, 'FieldOfficerCallFarmer'>;

type FarmerCallOption = {
  farmerId: number;
  farmerCode: string;
  farmerName: string;
  mobile: string;
  village: string;
};

function normalizeMobile(value: string): string {
  return value.replace(/[^\d+]/g, '');
}

export function FieldOfficerCallFarmerScreen() {
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FarmerCallOption[]>([]);
  const [selected, setSelected] = useState<FarmerCallOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (searchQuery?: string) => {
    setLoading(true);
    setError(null);

    try {
      const trimmed = searchQuery?.trim() ?? '';
      let options: FarmerCallOption[] = [];

      if (trimmed) {
        const response = await searchFieldOfficerFarms({ q: trimmed, limit: 40 });
        const farms = response.data ?? [];
        const byFarmer = new Map<number, FarmerCallOption>();
        for (const farm of farms) {
          if (!byFarmer.has(farm.farmer_id)) {
            byFarmer.set(farm.farmer_id, {
              farmerId: farm.farmer_id,
              farmerCode: farm.farmer_code ?? String(farm.farmer_id),
              farmerName: farm.farmer_name ?? 'Farmer',
              mobile: farm.farmer_mobile ?? '',
              village: farm.village ?? '',
            });
          }
        }
        options = [...byFarmer.values()];
      } else {
        const response = (await getFieldOfficerFarmers()) as ApiRecord;
        const farmers = extractList(response, ['farmers', 'data', 'records']);
        options = farmers
          .map((farmer) => {
            const farmerId = Number(farmer.id ?? farmer.farmer_id ?? 0);
            if (!Number.isFinite(farmerId) || farmerId <= 0) {
              return null;
            }
            return {
              farmerId,
              farmerCode: pickString(farmer, 'farmer_code', 'code') !== '-'
                ? pickString(farmer, 'farmer_code', 'code')
                : String(farmerId),
              farmerName: pickString(farmer, 'name', 'farmer_name') !== '-'
                ? pickString(farmer, 'name', 'farmer_name')
                : 'Farmer',
              mobile: pickString(farmer, 'mobile', 'phone', 'farmer_mobile') !== '-'
                ? pickString(farmer, 'mobile', 'phone', 'farmer_mobile')
                : '',
              village: pickString(farmer, 'village') !== '-' ? pickString(farmer, 'village') : '',
            } satisfies FarmerCallOption;
          })
          .filter((item): item is FarmerCallOption => item != null);
      }

      const lower = trimmed.toLowerCase();
      const filtered = !lower
        ? options
        : options.filter((item) =>
            [item.farmerName, item.farmerCode, item.mobile, item.village]
              .join(' ')
              .toLowerCase()
              .includes(lower),
          );

      setResults(filtered);
      if (filtered.length === 0) {
        setError('No matching farmers found.');
      }
    } catch (err) {
      setResults([]);
      setError(getApiErrorMessage(err, 'Failed to search farmers.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const callFarmer = async () => {
    if (!selected) {
      setError('Select a Farmer first.');
      return;
    }

    const mobile = normalizeMobile(selected.mobile);
    if (!mobile) {
      setError('Mobile number is not available for this Farmer.');
      return;
    }

    try {
      await Linking.openURL(`tel:${mobile}`);
    } catch {
      setError('Unable to open the phone dialer.');
    }
  };

  const headerHint = useMemo(
    () => 'Search Farmer, select one record, then Call Farmer to open the dialer.',
    [],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Call Farmer" onBackPress={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text style={styles.helper}>{headerHint}</Text>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Farmer Name, Farmer ID, Mobile, Village"
            placeholderTextColor="#9CA3AF"
            onSubmitEditing={() => void load(query)}
          />
          <Pressable style={styles.searchButton} onPress={() => void load(query)} disabled={loading}>
            <Text style={styles.searchButtonText}>{loading ? '…' : 'Search'}</Text>
          </Pressable>
        </View>

        {loading && results.length === 0 ? (
          <ActivityIndicator color={colors.primary} />
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!selected ? (
          <FlatList
            data={results}
            keyExtractor={(item) => String(item.farmerId)}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Pressable
                style={styles.card}
                onPress={() => {
                  setSelected(item);
                  setError(null);
                }}
              >
                <Text style={styles.cardTitle}>{item.farmerName}</Text>
                <Text style={styles.meta}>Farmer ID: {item.farmerCode}</Text>
                {item.village ? <Text style={styles.meta}>Village: {item.village}</Text> : null}
                <Text style={styles.meta}>Mobile: {item.mobile || 'Not available'}</Text>
              </Pressable>
            )}
          />
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Selected Farmer</Text>
            <Text style={styles.meta}>Farmer Name: {selected.farmerName}</Text>
            <Text style={styles.meta}>Mobile Number: {selected.mobile || 'Not available'}</Text>
            <AppButton label="Call Farmer" onPress={() => void callFarmer()} />
            <AppButton label="Change Farmer" variant="secondary" onPress={() => setSelected(null)} />
          </View>
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
