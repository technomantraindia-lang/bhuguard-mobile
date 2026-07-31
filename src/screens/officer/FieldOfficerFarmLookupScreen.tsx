import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
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
import { AssignedLocationFilters } from '../../components/location/AssignedLocationFilters';
import { NoAssignmentState } from '../../components/location/NoAssignmentState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useAssignedLocations } from '../../hooks/useAssignedLocations';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import type { AssignedFarmSearchRecord } from '../../types/assignedLocations';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList, 'FieldOfficerFarmLookup'>;

export function FieldOfficerFarmLookupScreen() {
  const navigation = useNavigation<Nav>();
  const assigned = useAssignedLocations('auto');
  const [query, setQuery] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedTalukaId, setSelectedTalukaId] = useState('');
  const [selectedVillageId, setSelectedVillageId] = useState('');
  const [results, setResults] = useState<AssignedFarmSearchRecord[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);

  const selectedDistrictName = useMemo(
    () => assigned.locations.districts.find((item) => String(item.id) === selectedDistrictId)?.name ?? '',
    [assigned.locations.districts, selectedDistrictId],
  );
  const selectedTalukaName = useMemo(
    () => assigned.locations.talukas.find((item) => String(item.id) === selectedTalukaId)?.name ?? '',
    [assigned.locations.talukas, selectedTalukaId],
  );
  const selectedVillageName = useMemo(
    () => assigned.locations.villages.find((item) => String(item.id) === selectedVillageId)?.name ?? '',
    [assigned.locations.villages, selectedVillageId],
  );

  const runSearch = useCallback(async () => {
    if (!assigned.hasAssignment) {
      return;
    }

    setSearching(true);
    setError(null);
    setEmptyMessage(null);

    try {
      const response = await searchFieldOfficerFarms({
        q: query.trim() || undefined,
        district: selectedDistrictName || undefined,
        taluka: selectedTalukaName || undefined,
        village: selectedVillageName || undefined,
        district_id: selectedDistrictId ? Number(selectedDistrictId) : undefined,
        taluka_id: selectedTalukaId ? Number(selectedTalukaId) : undefined,
        village_id: selectedVillageId ? Number(selectedVillageId) : undefined,
        limit: 30,
      });

      if (!response.success) {
        setResults([]);
        setError(response.message || 'Unable to search farms.');
        return;
      }

      setResults(response.data ?? []);
      setEmptyMessage(
        response.data?.length ? null : response.message || 'No farmers or farms found in your assigned area.',
      );
    } catch (err) {
      setResults([]);
      setError(getApiErrorMessage(err, 'Unable to search farms in your assigned area.'));
    } finally {
      setSearching(false);
    }
  }, [
    assigned.hasAssignment,
    query,
    selectedDistrictId,
    selectedDistrictName,
    selectedTalukaId,
    selectedTalukaName,
    selectedVillageId,
    selectedVillageName,
  ]);

  useEffect(() => {
    if (!assigned.loading && assigned.hasAssignment) {
      void runSearch();
    }
  }, [assigned.loading, assigned.hasAssignment]);

  const openFarm = (item: AssignedFarmSearchRecord) => {
    if (!item.farmer_id || !item.farm_id) {
      return;
    }

    navigation.navigate('FarmVerificationActivity', {
      farmerId: item.farmer_id,
      farmId: item.farm_id,
      farmCode: item.farm_code ?? undefined,
      farmerName: item.farmer_name ?? undefined,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Find Farmer / Farm" onBackPress={() => navigation.goBack()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.content}>
          <Text style={styles.helper}>
            Search only within Districts, Talukas and Villages assigned to you by Admin.
          </Text>

          {assigned.loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingText}>Loading your assigned working areas…</Text>
            </View>
          ) : assigned.error ? (
            <NoAssignmentState message={assigned.error} onRefresh={assigned.refresh} refreshing={assigned.loading} />
          ) : !assigned.hasAssignment ? (
            <NoAssignmentState onRefresh={assigned.refresh} refreshing={assigned.loading} />
          ) : (
            <>
              <AssignedLocationFilters
                locations={assigned.locations}
                selectedDistrictId={selectedDistrictId}
                selectedTalukaId={selectedTalukaId}
                selectedVillageId={selectedVillageId}
                onDistrictChange={setSelectedDistrictId}
                onTalukaChange={setSelectedTalukaId}
                onVillageChange={setSelectedVillageId}
              />

              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Farmer name, Farmer ID, Farm ID"
                placeholderTextColor="#9CA3AF"
                onSubmitEditing={() => void runSearch()}
              />

              <Pressable style={styles.searchButton} onPress={() => void runSearch()} disabled={searching}>
                <Text style={styles.searchButtonText}>{searching ? 'Searching…' : 'Search'}</Text>
              </Pressable>

              {error ? <Text style={styles.error}>{error}</Text> : null}
              {emptyMessage ? <Text style={styles.empty}>{emptyMessage}</Text> : null}

              <FlatList
                data={results}
                keyExtractor={(item) => String(item.farm_id)}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                  <Pressable style={styles.card} onPress={() => openFarm(item)}>
                    <Text style={styles.cardTitle}>{item.farmer_name ?? 'Farmer'}</Text>
                    <Text style={styles.cardMeta}>
                      {item.farmer_code ? `${item.farmer_code} · ` : ''}
                      Farm {item.farm_code ?? item.farm_id}
                    </Text>
                    <Text style={styles.cardMeta}>
                      {[item.village, item.taluka, item.district].filter(Boolean).join(' · ')}
                    </Text>
                  </Pressable>
                )}
              />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { flex: 1, padding: spacing.md, gap: spacing.md },
  helper: { fontSize: 13, lineHeight: 20, color: '#4B5563' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadingText: { fontSize: 13, color: '#4B5563' },
  searchInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  searchButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchButtonText: { color: '#FFFFFF', fontWeight: '700' },
  error: { color: '#B91C1C', fontSize: 13 },
  empty: { color: '#6B7280', fontSize: 13 },
  list: { gap: 10, paddingBottom: 24 },
  card: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#FFFFFF',
    gap: 4,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  cardMeta: { fontSize: 13, color: '#4B5563' },
});
