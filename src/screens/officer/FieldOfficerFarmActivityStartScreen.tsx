import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { getApiErrorMessage } from '../../api/authApi';
import { searchArtisanFarms } from '../../api/artisanApi';
import {
  getFieldOfficerFarmerFarms,
  searchFieldOfficerFarms,
  type FieldOfficerFarmerFarmOption,
} from '../../api/fieldOfficerApi';
import { AppButton } from '../../components/AppButton';
import { FormSelect, type SelectOption } from '../../components/FormSelect';
import { AssignedLocationFilters } from '../../components/location/AssignedLocationFilters';
import { NoAssignmentState } from '../../components/location/NoAssignmentState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useAssignedLocations } from '../../hooks/useAssignedLocations';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import type { AssignedFarmSearchRecord } from '../../types/assignedLocations';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList, 'FieldOfficerFarmActivityStart'>;
type ScreenRoute = RouteProp<FieldOfficerStackParamList, 'FieldOfficerFarmActivityStart'>;

function mappingLabel(status?: string | null): string {
  const normalized = String(status ?? '').toLowerCase();
  if (normalized === 'completed' || normalized === 'mapped') {
    return 'Completed';
  }

  return 'Pending';
}

function farmOptionLabel(farm: FieldOfficerFarmerFarmOption): string {
  const code = farm.farm_code || `Farm ${farm.id}`;
  const village = farm.village || farm.location_name || 'Farm';

  return `${code} - ${village}`;
}

export function FieldOfficerFarmActivityStartScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();
  const assigned = useAssignedLocations('auto');
  const lockFarmSelection = Boolean(route.params?.lockFarmSelection && route.params?.farmId);
  const farmsRequestId = useRef(0);

  const [query, setQuery] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedTalukaId, setSelectedTalukaId] = useState('');
  const [selectedVillageId, setSelectedVillageId] = useState('');
  const [results, setResults] = useState<AssignedFarmSearchRecord[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);

  const [selectedFarmerId, setSelectedFarmerId] = useState<number | null>(route.params?.farmerId ?? null);
  const [selectedFarmerMeta, setSelectedFarmerMeta] = useState<{
    farmerName?: string;
    farmerCode?: string;
  }>({
    farmerName: route.params?.farmerName,
    farmerCode: route.params?.farmerCode,
  });
  const [farmerFarms, setFarmerFarms] = useState<FieldOfficerFarmerFarmOption[]>([]);
  const [loadingFarms, setLoadingFarms] = useState(false);
  const [selectedFarmId, setSelectedFarmId] = useState<string>(
    route.params?.farmId ? String(route.params.farmId) : '',
  );

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

  const farmerOptions = useMemo(() => {
    const map = new Map<number, AssignedFarmSearchRecord>();
    for (const item of results) {
      if (!map.has(item.farmer_id)) {
        map.set(item.farmer_id, item);
      }
    }
    return [...map.values()];
  }, [results]);

  const selectedFarm = useMemo(
    () => farmerFarms.find((farm) => String(farm.id) === selectedFarmId) ?? null,
    [farmerFarms, selectedFarmId],
  );

  const farmSelectOptions: SelectOption[] = farmerFarms.map((farm) => ({
    id: Number(farm.id),
    name: farmOptionLabel(farm),
  }));

  const loadFarmsForFarmer = useCallback(async (farmerId: number, preferredFarmId?: number) => {
    const requestId = ++farmsRequestId.current;
    setLoadingFarms(true);
    setError(null);
    setFarmerFarms([]);
    setSelectedFarmId('');

    try {
      let list: FieldOfficerFarmerFarmOption[] = [];

      if (assigned.resolvedRole === 'artisan') {
        // Prefer farms already returned by artisan assigned-area search.
        list = results
          .filter((item) => item.farmer_id === farmerId)
          .map((item) => ({
            id: item.farm_id,
            farm_code: item.farm_code ?? null,
            farm_name: item.farm_name ?? null,
            village: item.village ?? null,
            location_name: item.village ?? null,
          }));

        if (list.length === 0) {
          const response = await searchArtisanFarms({
            q: String(farmerId),
            limit: 40,
          });
          list = (response.data ?? [])
            .filter((item) => item.farmer_id === farmerId)
            .map((item) => ({
              id: item.farm_id,
              farm_code: item.farm_code ?? null,
              farm_name: item.farm_name ?? null,
              village: item.village ?? null,
              location_name: item.village ?? null,
            }));
        }
      } else {
        const farms = await getFieldOfficerFarmerFarms(farmerId);
        list = (Array.isArray(farms) ? farms : []).filter(
          (farm) => Number.isFinite(Number(farm?.id)) && Number(farm.id) > 0,
        );
      }

      if (requestId !== farmsRequestId.current) {
        return;
      }

      setFarmerFarms(list);

      if (list.length === 0) {
        setError('No active Farm is available for this Farmer.');
        return;
      }

      if (preferredFarmId && list.some((farm) => Number(farm.id) === preferredFarmId)) {
        setSelectedFarmId(String(preferredFarmId));
        return;
      }

      if (list.length === 1) {
        setSelectedFarmId(String(list[0].id));
      }
    } catch (err) {
      if (requestId !== farmsRequestId.current) {
        return;
      }
      setFarmerFarms([]);
      setSelectedFarmId('');
      setError(getApiErrorMessage(err, 'Unable to load Farmer Farms.'));
    } finally {
      if (requestId === farmsRequestId.current) {
        setLoadingFarms(false);
      }
    }
  }, [assigned.resolvedRole, results]);

  const runSearch = useCallback(async () => {
    if (!assigned.hasAssignment) {
      return;
    }

    setSearching(true);
    setError(null);
    setEmptyMessage(null);

    try {
      const useArtisanSearch = assigned.resolvedRole === 'artisan';

      if (useArtisanSearch) {
        const response = await searchArtisanFarms({
          q: query.trim() || route.params?.farmerCode || route.params?.farmerName || undefined,
          taluka: selectedTalukaName || undefined,
          village: selectedVillageName || undefined,
          limit: 40,
        });

        if (!response.success) {
          setResults([]);
          setError(response.message || 'Unable to search farms.');
          return;
        }

        const data = (response.data ?? []).map((item) => ({
          farmer_id: item.farmer_id,
          farmer_code: item.farmer_code ?? undefined,
          farmer_name: item.farmer_name ?? undefined,
          farmer_mobile: item.farmer_mobile ?? undefined,
          farm_id: item.farm_id,
          farm_code: item.farm_code ?? undefined,
          farm_name: item.farm_name ?? undefined,
          village: item.village ?? undefined,
          taluka: item.taluka ?? undefined,
          district: item.district ?? undefined,
          state: item.state ?? undefined,
          latitude: item.latitude ?? undefined,
          longitude: item.longitude ?? undefined,
        }));

        setResults(data);
        setEmptyMessage(data.length ? null : response.message || 'No farmers or farms found in your assigned area.');

        if (route.params?.farmerId) {
          const match = data.find((item) => item.farmer_id === route.params?.farmerId);
          if (match) {
            setSelectedFarmerId(match.farmer_id);
            setSelectedFarmerMeta({
              farmerName: match.farmer_name ?? route.params?.farmerName,
              farmerCode: match.farmer_code ?? route.params?.farmerCode,
            });
          }
        }
        return;
      }

      const response = await searchFieldOfficerFarms({
        q: query.trim() || route.params?.farmerCode || route.params?.farmerName || undefined,
        district: selectedDistrictName || undefined,
        taluka: selectedTalukaName || undefined,
        village: selectedVillageName || undefined,
        district_id: selectedDistrictId ? Number(selectedDistrictId) : undefined,
        taluka_id: selectedTalukaId ? Number(selectedTalukaId) : undefined,
        village_id: selectedVillageId ? Number(selectedVillageId) : undefined,
        limit: 40,
      });

      if (!response.success) {
        setResults([]);
        setError(response.message || 'Unable to search farms.');
        return;
      }

      const data = response.data ?? [];
      setResults(data);
      setEmptyMessage(data.length ? null : response.message || 'No farmers or farms found in your assigned area.');

      if (route.params?.farmerId) {
        const match = data.find((item) => item.farmer_id === route.params?.farmerId);
        if (match) {
          setSelectedFarmerId(match.farmer_id);
          setSelectedFarmerMeta({
            farmerName: match.farmer_name ?? route.params?.farmerName,
            farmerCode: match.farmer_code ?? route.params?.farmerCode,
          });
        }
      }
    } catch (err) {
      setResults([]);
      setError(getApiErrorMessage(err, 'Unable to search farms in your assigned area.'));
    } finally {
      setSearching(false);
    }
  }, [
    assigned.hasAssignment,
    assigned.resolvedRole,
    query,
    route.params?.farmerCode,
    route.params?.farmerId,
    route.params?.farmerName,
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
    // Intentionally only when assignment readiness changes; Search Farmer button handles refinements.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid re-searching on every keystroke
  }, [assigned.loading, assigned.hasAssignment]);

  // Fetch farms only after assignment is ready and a farmer is selected.
  useEffect(() => {
    if (assigned.loading || !assigned.hasAssignment || !selectedFarmerId) {
      return;
    }

    void loadFarmsForFarmer(
      selectedFarmerId,
      route.params?.farmerId === selectedFarmerId ? route.params?.farmId : undefined,
    );
  }, [
    assigned.loading,
    assigned.hasAssignment,
    selectedFarmerId,
    loadFarmsForFarmer,
    route.params?.farmerId,
    route.params?.farmId,
  ]);

  const selectFarmer = (farmer: AssignedFarmSearchRecord) => {
    if (lockFarmSelection) {
      return;
    }

    setSelectedFarmerId(farmer.farmer_id);
    setSelectedFarmerMeta({
      farmerName: farmer.farmer_name ?? undefined,
      farmerCode: farmer.farmer_code ?? undefined,
    });
    setError(null);
  };

  const changeFarm = (farmId: string) => {
    if (lockFarmSelection) {
      return;
    }

    setSelectedFarmId(farmId);
    setError(null);
  };

  const clearFarmerSelection = () => {
    if (lockFarmSelection) {
      return;
    }

    farmsRequestId.current += 1;
    setSelectedFarmerId(null);
    setSelectedFarmerMeta({});
    setFarmerFarms([]);
    setSelectedFarmId('');
    setLoadingFarms(false);
    setError(null);
  };

  const startActivity = () => {
    if (!selectedFarmerId || !selectedFarm) {
      setError('Select a Farmer and Farm before starting Farm Activity.');
      return;
    }

    navigation.navigate('FarmVerificationActivity', {
      farmerId: selectedFarmerId,
      farmId: Number(selectedFarm.id),
      farmCode: selectedFarm.farm_code ?? undefined,
      farmerName: selectedFarmerMeta.farmerName,
      farmerCode: selectedFarmerMeta.farmerCode,
      farmName: selectedFarm.location_name ?? undefined,
      village: selectedFarm.village ?? undefined,
    });
  };

  const showFarmSelector = !lockFarmSelection && farmerFarms.length > 1;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Farm Activity" onBackPress={() => navigation.goBack()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.content}>
          <Text style={styles.helper}>
            Search Farmer, select Farm, then start Farm Activity. GPS check-in begins only after Farm selection.
          </Text>

          {assigned.loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingText}>Loading your assigned working areas...</Text>
            </View>
          ) : assigned.error ? (
            <NoAssignmentState
              message={assigned.error}
              onRefresh={assigned.refresh}
              refreshing={assigned.loading}
            />
          ) : !assigned.hasAssignment ? (
            <NoAssignmentState
              message="No assigned working area found. Please ask Admin to assign villages."
              onRefresh={assigned.refresh}
              refreshing={assigned.loading}
            />
          ) : !selectedFarmerId ? (
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
                placeholder="Farmer name, Farmer ID, Mobile, Village"
                placeholderTextColor="#9CA3AF"
                onSubmitEditing={() => void runSearch()}
              />

              <Pressable style={styles.searchButton} onPress={() => void runSearch()} disabled={searching}>
                <Text style={styles.searchButtonText}>{searching ? 'Searching...' : 'Search Farmer'}</Text>
              </Pressable>

              {error ? <Text style={styles.error}>{error}</Text> : null}
              {emptyMessage ? <Text style={styles.empty}>{emptyMessage}</Text> : null}
              {searching && farmerOptions.length === 0 ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.loadingText}>Searching farmers...</Text>
                </View>
              ) : null}

              <FlatList
                style={styles.flex}
                data={farmerOptions}
                keyExtractor={(item) => String(item.farmer_id)}
                contentContainerStyle={styles.list}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  !searching && !emptyMessage ? (
                    <Text style={styles.empty}>Search and select a Farmer to continue.</Text>
                  ) : null
                }
                renderItem={({ item }) => (
                  <Pressable style={styles.card} onPress={() => selectFarmer(item)}>
                    <Text style={styles.cardTitle}>{item.farmer_name ?? 'Farmer'}</Text>
                    <Text style={styles.cardMeta}>Farmer ID: {item.farmer_code ?? item.farmer_id}</Text>
                    {item.village ? <Text style={styles.cardMeta}>Village: {item.village}</Text> : null}
                  </Pressable>
                )}
              />
            </>
          ) : (
            <ScrollView
              style={styles.flex}
              contentContainerStyle={styles.selectedContent}
              keyboardShouldPersistTaps="handled"
            >
              {lockFarmSelection ? (
                <Text style={styles.lockedHint}>
                  This Farm Activity is linked to a Due/Overdue Farm and cannot be switched.
                </Text>
              ) : null}

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <View style={styles.contextCard}>
                <Text style={styles.cardTitle}>Farmer summary</Text>
                <Text style={styles.cardMeta}>Farmer Name: {selectedFarmerMeta.farmerName ?? '—'}</Text>
                <Text style={styles.cardMeta}>
                  Farmer ID: {selectedFarmerMeta.farmerCode ?? selectedFarmerId}
                </Text>
              </View>

              {loadingFarms ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.loadingText}>Loading Farmer Farms...</Text>
                </View>
              ) : null}

              {!loadingFarms && farmerFarms.length === 0 ? (
                <View style={styles.contextCard}>
                  <Text style={styles.empty}>No active Farm is available for this Farmer.</Text>
                  <AppButton
                    label="Retry"
                    onPress={() =>
                      void loadFarmsForFarmer(
                        selectedFarmerId,
                        route.params?.farmerId === selectedFarmerId ? route.params?.farmId : undefined,
                      )
                    }
                  />
                </View>
              ) : null}

              {showFarmSelector ? (
                <>
                  <Text style={styles.sectionTitle}>Select Farm</Text>
                  <Text style={styles.helper}>Select the Farm you are visiting.</Text>
                  <FormSelect
                    label="Farm"
                    placeholder="Select farm"
                    value={selectedFarmId}
                    displayValue={selectedFarm ? farmOptionLabel(selectedFarm) : undefined}
                    options={farmSelectOptions}
                    onSelect={(option) => changeFarm(String(option.id))}
                  />
                </>
              ) : null}

              {selectedFarm ? (
                <View style={styles.contextCard}>
                  <Text style={styles.cardTitle}>Selected Farm</Text>
                  <Text style={styles.cardMeta}>Farmer Name:{'\n'}{selectedFarmerMeta.farmerName ?? '—'}</Text>
                  <Text style={styles.cardMeta}>
                    Farmer ID:{'\n'}
                    {selectedFarmerMeta.farmerCode ?? selectedFarmerId}
                  </Text>
                  <Text style={styles.cardMeta}>
                    Selected Farm:{'\n'}
                    {selectedFarm.farm_code ?? selectedFarm.id}
                  </Text>
                  <Text style={styles.cardMeta}>Village:{'\n'}{selectedFarm.village || '—'}</Text>
                  <Text style={styles.cardMeta}>
                    Mapping Status:{'\n'}
                    {mappingLabel(selectedFarm.mapping_status)}
                  </Text>
                  {lockFarmSelection ? (
                    <Text style={styles.lockedHint}>Farm selection is locked for this Due/Overdue activity.</Text>
                  ) : null}
                  <AppButton
                    label={route.params?.overdue ? 'Complete Overdue Farm Activity' : 'Start Farm Activity'}
                    onPress={startActivity}
                  />
                  {!lockFarmSelection ? (
                    <AppButton label="Change Farmer" variant="secondary" onPress={clearFarmerSelection} />
                  ) : null}
                </View>
              ) : !loadingFarms && farmerFarms.length > 1 ? (
                <Text style={styles.empty}>Select a Farm to continue.</Text>
              ) : null}
            </ScrollView>
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
  selectedContent: { gap: spacing.md, paddingBottom: 32 },
  helper: { fontSize: 13, lineHeight: 20, color: '#4B5563' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
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
  lockedHint: { color: '#92400E', fontSize: 13, lineHeight: 20 },
  list: { gap: 10, paddingBottom: 24, flexGrow: 1 },
  card: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#FFFFFF',
    gap: 4,
    marginBottom: 10,
  },
  contextCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  cardMeta: { fontSize: 13, color: '#4B5563', lineHeight: 20 },
});
