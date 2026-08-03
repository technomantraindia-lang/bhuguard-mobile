import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { getApiErrorMessage } from '../../api/authApi';
import { getArtisanAllocatedLocations, searchArtisanFarms } from '../../api/artisanApi';
import { FormSelect, type SelectOption } from '../../components/FormSelect';
import { NoAssignmentState } from '../../components/location/NoAssignmentState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useArtisanWorkSession } from '../../context/ArtisanWorkSessionContext';
import type { ArtisanStackParamList } from '../../navigation/types';
import { findIncompleteBiocharProductionDraft } from '../../storage/biocharProductionDraftStorage';
import { getAuthUser } from '../../utils/authStorage';
import { colors, spacing } from '../../theme';
import { groupFarmSearchResultsByFarmer, labelFarmsForFarmer } from '../../utils/farmDisplayLabel';
import { openGoogleMaps } from '../../utils/farmMapHelpers';
import type {
  ArtisanAllocatedTaluka,
  ArtisanAllocatedVillage,
  ArtisanFarmSearchRecord,
  ArtisanFarmSelectionParams,
} from '../../types/artisanFarmSearch';

type Nav = NativeStackNavigationProp<ArtisanStackParamList, 'ArtisanFarmLookup'>;
type Route = RouteProp<ArtisanStackParamList, 'ArtisanFarmLookup'>;
type LookupPurpose = 'find' | 'production' | 'mixing' | 'application' | 'navigate';

function toSelection(
  record: ArtisanFarmSearchRecord,
  displayLabel?: string,
): ArtisanFarmSelectionParams {
  return {
    farmId: record.farm_id,
    farmCode: record.farm_code ?? undefined,
    farmLabel: displayLabel ?? record.farm_code ?? record.farm_name ?? `Farm ${record.farm_id}`,
    farmerId: record.farmer_id,
    farmerCode: record.farmer_code ?? undefined,
    farmerName: record.farmer_name ?? undefined,
    village: record.village ?? undefined,
    taluka: record.taluka ?? undefined,
    district: record.district ?? undefined,
    state: record.state ?? undefined,
    latitude: record.latitude ?? undefined,
    longitude: record.longitude ?? undefined,
  };
}

function purposeCopy(purpose: LookupPurpose): {
  title: string;
  helper: string;
  sectionTitle: string;
} {
  switch (purpose) {
    case 'production':
      return {
        title: 'Biochar Production',
        helper: 'Select a farm to start a new Batch or resume unfinished work from Complete the Process.',
        sectionTitle: 'Select a farm for production',
      };
    case 'mixing':
      return {
        title: 'Biochar Mixing',
        helper: 'Select a farm in your assigned area to start a Biochar Mixing record.',
        sectionTitle: 'Select a farm for mixing',
      };
    case 'application':
      return {
        title: 'Biochar Application',
        helper: 'Select a farm in your assigned area to apply mixed biochar.',
        sectionTitle: 'Select a farm for application',
      };
    case 'navigate':
      return {
        title: 'Farm Navigator',
        helper: 'Search authorized farms by Farm ID or Farmer Name, then navigate using saved GPS or Google Maps.',
        sectionTitle: 'Authorized Farms',
      };
    default:
      return {
        title: 'Find Farmer / Farm',
        helper: 'Search only within villages and talukas allocated to you by admin.',
        sectionTitle: 'Matching Farms',
      };
  }
}

export function ArtisanFarmLookupScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const purpose: LookupPurpose = route.params?.purpose ?? 'find';
  const copy = purposeCopy(purpose);
  const { ensureCheckedInOrPrompt, requireCheckedIn } = useArtisanWorkSession();

  const [query, setQuery] = useState('');
  const [talukas, setTalukas] = useState<ArtisanAllocatedTaluka[]>([]);
  const [villages, setVillages] = useState<ArtisanAllocatedVillage[]>([]);
  const [selectedTalukaId, setSelectedTalukaId] = useState('');
  const [selectedVillageId, setSelectedVillageId] = useState('');
  const [results, setResults] = useState<ArtisanFarmSearchRecord[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);
  const [selectedFarmerId, setSelectedFarmerId] = useState<number | null>(null);
  const searchInProgressRef = useRef(false);
  const initialSearchDoneRef = useRef(false);

  const groupedByFarmer = useMemo(() => groupFarmSearchResultsByFarmer(results), [results]);

  const selectedFarmerFarms = useMemo(() => {
    if (selectedFarmerId == null) {
      return [];
    }

    return labelFarmsForFarmer(groupedByFarmer.get(selectedFarmerId) ?? []);
  }, [groupedByFarmer, selectedFarmerId]);

  const farmerSummaries = useMemo(() => {
    const summaries: Array<{
      farmerId: number;
      farmerName: string;
      farmerCode: string;
      farmCount: number;
      village: string;
    }> = [];

    for (const [farmerId, farms] of groupedByFarmer) {
      const first = farms[0];
      if (!first) {
        continue;
      }

      summaries.push({
        farmerId,
        farmerName: first.farmer_name ?? 'Farmer',
        farmerCode: first.farmer_code ?? String(farmerId),
        farmCount: farms.length,
        village: first.village ?? '',
      });
    }

    return summaries;
  }, [groupedByFarmer]);

  const loadLocations = useCallback(async () => {
    setLoadingLocations(true);
    setError(null);

    try {
      const data = await getArtisanAllocatedLocations();
      setTalukas(Array.isArray(data?.talukas) ? data.talukas : []);
      setVillages(Array.isArray(data?.villages) ? data.villages : []);
    } catch (err) {
      setTalukas([]);
      setVillages([]);
      setError(getApiErrorMessage(err, 'Unable to load allocated locations.'));
    } finally {
      setLoadingLocations(false);
    }
  }, []);

  useEffect(() => {
    void loadLocations();
  }, [loadLocations]);

  const filteredVillages = useMemo(() => {
    if (!selectedTalukaId) {
      return villages;
    }

    return villages.filter((village) => String(village.taluka_id) === selectedTalukaId);
  }, [selectedTalukaId, villages]);

  const talukaOptions: SelectOption[] = talukas.map((item) => ({ id: item.id, name: item.name }));
  const villageOptions: SelectOption[] = filteredVillages.map((item) => ({ id: item.id, name: item.name }));

  const selectedTalukaName = talukas.find((item) => String(item.id) === selectedTalukaId)?.name ?? '';
  const selectedVillageName = villages.find((item) => String(item.id) === selectedVillageId)?.name ?? '';

  const runSearch = useCallback(async () => {
    if (searchInProgressRef.current) {
      return;
    }

    if (!ensureCheckedInOrPrompt()) {
      return;
    }

    searchInProgressRef.current = true;
    setSearching(true);
    setError(null);
    setEmptyMessage(null);

    try {
      const response = await searchArtisanFarms({
        q: query.trim() || undefined,
        taluka: selectedTalukaName || undefined,
        village: selectedVillageName || undefined,
        limit: 30,
      });

      if (!response.success) {
        setResults([]);
        setError(response.message || 'Unable to search farms.');
        return;
      }

      setResults(response.data ?? []);
      setSelectedFarmerId(null);
      setEmptyMessage(response.data?.length ? null : response.message || 'No farmers or farms found in your allocated area.');
    } catch (err) {
      setResults([]);
      setError(getApiErrorMessage(err, 'Unable to search farms in your allocated area.'));
    } finally {
      setSearching(false);
      searchInProgressRef.current = false;
    }
  }, [ensureCheckedInOrPrompt, query, selectedTalukaName, selectedVillageName]);

  useEffect(() => {
    if (loadingLocations || initialSearchDoneRef.current) {
      return;
    }

    // Wait until assigned locations are loaded; search once only.
    if (talukas.length === 0 && villages.length === 0) {
      return;
    }

    if (!requireCheckedIn()) {
      return;
    }

    initialSearchDoneRef.current = true;
    void runSearch();
  }, [loadingLocations, requireCheckedIn, runSearch, talukas.length, villages.length]);

  // Removed duplicate second auto-search effect that could re-trigger Searching… blink.

  const openProduction = (selection: ArtisanFarmSelectionParams) => {
    if (!ensureCheckedInOrPrompt()) {
      return;
    }

    void (async () => {
      try {
        const user = await getAuthUser();
        const incomplete = await findIncompleteBiocharProductionDraft({
          apiMode: 'artisan',
          userId: user?.id ?? null,
        });

        if (
          incomplete
          && incomplete.farmId
          && incomplete.farmId !== selection.farmId
        ) {
          Alert.alert(
            'Unfinished batch in progress',
            incomplete.batchCode?.trim()
              ? `Batch ${incomplete.batchCode} is still incomplete on another farm. Resume that batch first, or continue only after it is submitted.`
              : 'You already have an unfinished Biochar Production batch on another farm. Resume it from Complete the Process before starting a new Batch.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Resume unfinished',
                onPress: () => {
                  navigation.navigate('ArtisanBiocharProduction', {
                    farmId: incomplete.farmId as number,
                    farmerId: incomplete.farmerId ?? undefined,
                    batchId: incomplete.batchId ?? undefined,
                  });
                },
              },
            ],
          );
          return;
        }

        if (incomplete && incomplete.farmId === selection.farmId) {
          navigation.navigate('ArtisanBiocharProduction', {
            ...selection,
            batchId: incomplete.batchId ?? undefined,
          });
          return;
        }

        navigation.navigate('ArtisanBiocharProduction', {
          ...selection,
          forceNewBatch: true,
        });
      } catch {
        navigation.navigate('ArtisanBiocharProduction', selection);
      }
    })();
  };

  const openMixing = (selection: ArtisanFarmSelectionParams) => {
    if (!ensureCheckedInOrPrompt()) {
      return;
    }
    navigation.navigate('ArtisanBiocharMixing', selection);
  };

  const handleMixingFarmerSelect = (farmerId: number) => {
    const farms = groupedByFarmer.get(farmerId) ?? [];

    if (farms.length === 1) {
      const [farm] = labelFarmsForFarmer(farms);
      openMixing(toSelection(farm, farm.displayLabel));
      return;
    }

    setSelectedFarmerId(farmerId);
  };

  const handleMixingFarmSelect = (farm: ArtisanFarmSearchRecord & { displayLabel: string }) => {
    openMixing(toSelection(farm, farm.displayLabel));
  };

  const openApplication = (selection: ArtisanFarmSelectionParams) => {
    if (!ensureCheckedInOrPrompt()) {
      return;
    }
    navigation.navigate('ArtisanBiocharApplication', {
      farmId: selection.farmId,
      farmerId: selection.farmerId,
      farmerCode: selection.farmerCode,
      farmerName: selection.farmerName,
      farmCode: selection.farmCode,
      farmLabel: selection.farmLabel,
      farmName: selection.farmLabel,
      village: selection.village,
      taluka: selection.taluka,
      district: selection.district,
      state: selection.state,
    });
  };

  const handleApplicationFarmerSelect = (farmerId: number) => {
    const farms = groupedByFarmer.get(farmerId) ?? [];

    if (farms.length === 1) {
      const [farm] = labelFarmsForFarmer(farms);
      openApplication(toSelection(farm, farm.displayLabel));
      return;
    }

    setSelectedFarmerId(farmerId);
  };

  const handleApplicationFarmSelect = (farm: ArtisanFarmSearchRecord & { displayLabel: string }) => {
    openApplication(toSelection(farm, farm.displayLabel));
  };

  const navigateToFarm = async (selection: ArtisanFarmSelectionParams) => {
    if (!ensureCheckedInOrPrompt()) {
      return;
    }

    if (
      selection.latitude == null ||
      selection.longitude == null ||
      !Number.isFinite(selection.latitude) ||
      !Number.isFinite(selection.longitude)
    ) {
      Alert.alert(
        'Location unavailable',
        'This farm has no saved GPS coordinates. Navigation cannot invent a location.',
      );
      return;
    }

    try {
      await openGoogleMaps(
        { latitude: selection.latitude, longitude: selection.longitude },
        selection.farmLabel ?? selection.farmCode ?? `Farm ${selection.farmId}`,
      );
    } catch {
      Alert.alert('Unable to open maps', 'Google Maps could not be opened on this device.');
    }
  };

  const renderFarmerDrilldownResult = (kind: 'mixing' | 'application') => {
    const onFarmerSelect = kind === 'mixing' ? handleMixingFarmerSelect : handleApplicationFarmerSelect;
    const onFarmSelect = kind === 'mixing' ? handleMixingFarmSelect : handleApplicationFarmSelect;
    const actionLabel = kind === 'mixing' ? 'Start Biochar Mixing' : 'Start Biochar Application';
    const multiFarmLabel = kind === 'mixing' ? 'Select Farm for Mixing' : 'Select Farm for Application';

    if (selectedFarmerId != null) {
      const farmer = farmerSummaries.find((item) => item.farmerId === selectedFarmerId);

      return (
        <View style={styles.mixingSection}>
          <Pressable style={styles.backLink} onPress={() => setSelectedFarmerId(null)}>
            <Text style={styles.backLinkText}>← Back to farmers</Text>
          </Pressable>
          <Text style={styles.sectionTitle}>
            Select farm for {farmer?.farmerName ?? 'farmer'}
          </Text>
          <Text style={styles.helper}>
            Farmer ID: {farmer?.farmerCode ?? selectedFarmerId}
          </Text>
          {selectedFarmerFarms.map((farm) => (
            <Pressable key={farm.farm_id} style={styles.card} onPress={() => onFarmSelect(farm)}>
              <Text style={styles.cardTitle}>{farm.displayLabel}</Text>
              <Text style={styles.cardMeta}>
                {farm.farm_name ?? farm.farm_code ?? `Farm ${farm.farm_id}`}
              </Text>
              <Text style={styles.cardMeta}>
                {[farm.village, farm.taluka, farm.district].filter(Boolean).join(' · ')}
              </Text>
              <View style={styles.cardActions}>
                <Pressable style={styles.selectButton} onPress={() => onFarmSelect(farm)}>
                  <Text style={styles.selectButtonText}>{actionLabel}</Text>
                </Pressable>
              </View>
            </Pressable>
          ))}
        </View>
      );
    }

    return farmerSummaries.map((farmer) => (
      <Pressable key={farmer.farmerId} style={styles.card} onPress={() => onFarmerSelect(farmer.farmerId)}>
        <Text style={styles.cardTitle}>{farmer.farmerName}</Text>
        <Text style={styles.cardMeta}>Farmer ID: {farmer.farmerCode}</Text>
        <Text style={styles.cardMeta}>
          {farmer.farmCount} farm{farmer.farmCount === 1 ? '' : 's'}
          {farmer.village ? ` · ${farmer.village}` : ''}
        </Text>
        <View style={styles.cardActions}>
          <Pressable style={styles.selectButton} onPress={() => onFarmerSelect(farmer.farmerId)}>
            <Text style={styles.selectButtonText}>
              {farmer.farmCount === 1 ? actionLabel : multiFarmLabel}
            </Text>
          </Pressable>
        </View>
      </Pressable>
    ));
  };

  const renderResult = ({ item }: { item: ArtisanFarmSearchRecord }) => {
    const labeledFarms = labelFarmsForFarmer(
      results.filter((record) => record.farmer_id === item.farmer_id),
    );
    const labeled = labeledFarms.find((farm) => farm.farm_id === item.farm_id);
    const selection = toSelection(item, labeled?.displayLabel);
    const showProduction = purpose === 'find' || purpose === 'production';
    const showMixing = purpose === 'find' || purpose === 'mixing';
    const showApplication = purpose === 'find' || purpose === 'application';
    const showNavigate = purpose === 'find' || purpose === 'navigate';

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{item.farmer_name ?? 'Farmer'}</Text>
        <Text style={styles.cardMeta}>
          Farmer ID: {item.farmer_code ?? item.farmer_id}
        </Text>
        <Text style={styles.cardMeta}>
          Farm: {labeled?.displayLabel ?? item.farm_name ?? item.farm_code ?? item.farm_id}
        </Text>
        <Text style={styles.cardMeta}>Farm ID: {item.farm_code ?? item.farm_id}</Text>
        <Text style={styles.cardMeta}>{[item.village, item.taluka, item.district].filter(Boolean).join(' · ')}</Text>
        {item.area_acre != null ? <Text style={styles.cardMeta}>Area: {item.area_acre} acre</Text> : null}
        {item.biochar_status ? <Text style={styles.cardStatus}>Biochar: {item.biochar_status}</Text> : null}
        {item.next_due_date ? <Text style={styles.cardMeta}>Next due: {item.next_due_date}</Text> : null}

        <View style={styles.cardActions}>
          {showNavigate ? (
            <Pressable
              style={purpose === 'navigate' ? styles.selectButton : styles.secondarySelectButton}
              onPress={() => void navigateToFarm(selection)}
            >
              <Text style={purpose === 'navigate' ? styles.selectButtonText : styles.secondarySelectButtonText}>
                Navigate Farm
              </Text>
            </Pressable>
          ) : null}
          {showProduction ? (
            <Pressable style={styles.selectButton} onPress={() => openProduction(selection)}>
              <Text style={styles.selectButtonText}>
                {purpose === 'production' ? 'Start Biochar Production' : 'Select for Production'}
              </Text>
            </Pressable>
          ) : null}
          {showMixing ? (
            <Pressable
              style={purpose === 'mixing' ? styles.selectButton : styles.secondarySelectButton}
              onPress={() => openMixing(selection)}
            >
              <Text style={purpose === 'mixing' ? styles.selectButtonText : styles.secondarySelectButtonText}>
                {purpose === 'mixing' ? 'Start Biochar Mixing' : 'Select for Mixing'}
              </Text>
            </Pressable>
          ) : null}
          {showApplication ? (
            <Pressable
              style={purpose === 'application' ? styles.selectButton : styles.secondarySelectButton}
              onPress={() => openApplication(selection)}
            >
              <Text style={purpose === 'application' ? styles.selectButtonText : styles.secondarySelectButtonText}>
                {purpose === 'application' ? 'Start Biochar Application' : 'Select for Application'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={copy.title} showBrandLogo={false} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <FlatList
          data={purpose === 'mixing' || purpose === 'application' ? [] : results}
          keyExtractor={(item) => `${item.farm_id}-${item.farmer_id}`}
          renderItem={renderResult}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              <Text style={styles.helper}>{copy.helper}</Text>

              {purpose === 'application' ? null : (
                <>
                  <Text style={styles.label}>
                    {purpose === 'mixing'
                      ? 'Search by Farmer Name, Farmer ID, or Farm ID'
                      : 'Search by Farm ID or Farmer Name'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={
                      purpose === 'mixing'
                        ? 'Farmer Name, Farmer ID, or Farm ID'
                        : 'Search by Farm ID or Farmer Name'
                    }
                    value={query}
                    onChangeText={setQuery}
                    autoCapitalize="none"
                    returnKeyType="search"
                    onSubmitEditing={() => void runSearch()}
                  />
                </>
              )}

              {loadingLocations ? (
                <View style={styles.inlineLoading}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.inlineLoadingText}>Loading your assigned working areas…</Text>
                </View>
              ) : error ? (
                <NoAssignmentState message={error} onRefresh={() => void loadLocations()} refreshing={loadingLocations} />
              ) : talukas.length === 0 && villages.length === 0 ? (
                <NoAssignmentState onRefresh={() => void loadLocations()} refreshing={loadingLocations} />
              ) : purpose === 'application' ? null : (
                <>
                  <FormSelect
                    label="Taluka"
                    placeholder="All allocated talukas"
                    value={selectedTalukaId}
                    displayValue={selectedTalukaName}
                    options={talukaOptions}
                    onSelect={(option) => {
                      setSelectedTalukaId(String(option.id));
                      setSelectedVillageId('');
                    }}
                  />
                  <FormSelect
                    label="Village"
                    placeholder="All allocated villages"
                    value={selectedVillageId}
                    displayValue={selectedVillageName}
                    options={villageOptions}
                    disabled={villageOptions.length === 0}
                    onSelect={(option) => setSelectedVillageId(String(option.id))}
                  />
                </>
              )}

              {purpose === 'application' ? null : (
                <Pressable style={[styles.searchButton, searching && styles.buttonDisabled]} disabled={searching} onPress={() => void runSearch()}>
                  <Text style={styles.searchButtonText}>{searching ? 'Searching…' : 'Search'}</Text>
                </Pressable>
              )}

              {error ? <Text style={styles.error}>{error}</Text> : null}
              {!error && emptyMessage ? <Text style={styles.empty}>{emptyMessage}</Text> : null}
              {(purpose === 'mixing' || purpose === 'application') && results.length > 0 ? (
                <Text style={styles.sectionTitle}>
                  {selectedFarmerId != null ? 'Select a farm' : `${copy.sectionTitle} (${farmerSummaries.length})`}
                </Text>
              ) : null}
              {purpose === 'mixing' || purpose === 'application'
                ? renderFarmerDrilldownResult(purpose)
                : null}
              {purpose !== 'mixing' && purpose !== 'application' && results.length > 0 ? (
                <Text style={styles.sectionTitle}>
                  {copy.sectionTitle} ({results.length})
                </Text>
              ) : null}
            </View>
          }
          ListEmptyComponent={purpose === 'mixing' || purpose === 'application' ? null : undefined}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  listContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  headerBlock: { gap: spacing.md, marginBottom: spacing.sm },
  helper: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
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
  inlineLoading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  inlineLoadingText: { color: colors.textMuted },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  searchButtonText: { color: '#fff', fontWeight: '700' },
  error: { color: colors.danger, lineHeight: 20 },
  empty: { color: colors.textMuted, lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  mixingSection: { gap: spacing.md },
  backLink: { marginTop: spacing.xs },
  backLinkText: { color: colors.primaryDark, fontWeight: '700' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  cardMeta: { color: colors.textMuted, fontSize: 14 },
  cardStatus: { color: colors.primaryDark, fontWeight: '600', fontSize: 14 },
  cardActions: { gap: spacing.sm, marginTop: spacing.sm },
  selectButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  selectButtonText: { color: '#fff', fontWeight: '700' },
  secondarySelectButton: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondarySelectButtonText: { color: colors.primaryDark, fontWeight: '700' },
});
