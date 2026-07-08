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
import { getArtisanAllocatedLocations, searchArtisanFarms } from '../../api/artisanApi';
import { FormSelect, type SelectOption } from '../../components/FormSelect';
import { ScreenHeader } from '../../components/ScreenHeader';
import type { ArtisanStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import type {
  ArtisanAllocatedTaluka,
  ArtisanAllocatedVillage,
  ArtisanFarmSearchRecord,
  ArtisanFarmSelectionParams,
} from '../../types/artisanFarmSearch';

type Nav = NativeStackNavigationProp<ArtisanStackParamList, 'ArtisanFarmLookup'>;

function toSelection(record: ArtisanFarmSearchRecord): ArtisanFarmSelectionParams {
  return {
    farmId: record.farm_id,
    farmCode: record.farm_code ?? undefined,
    farmLabel: record.farm_code ?? record.farm_name ?? `Farm ${record.farm_id}`,
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

export function ArtisanFarmLookupScreen() {
  const navigation = useNavigation<Nav>();
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

  const loadLocations = useCallback(async () => {
    setLoadingLocations(true);
    setError(null);

    try {
      const data = await getArtisanAllocatedLocations();
      setTalukas(data.talukas ?? []);
      setVillages(data.villages ?? []);
    } catch (err) {
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
      setEmptyMessage(response.data?.length ? null : response.message || 'No farmers or farms found in your allocated area.');
    } catch (err) {
      setResults([]);
      setError(getApiErrorMessage(err, 'Unable to search farms in your allocated area.'));
    } finally {
      setSearching(false);
    }
  }, [query, selectedTalukaName, selectedVillageName]);

  useEffect(() => {
    if (!loadingLocations && talukas.length > 0) {
      void runSearch();
    }
  }, [loadingLocations, talukas.length]);

  const openProduction = (selection: ArtisanFarmSelectionParams) => {
    navigation.navigate('ArtisanBiocharProduction', selection);
  };

  const openMixing = (selection: ArtisanFarmSelectionParams) => {
    navigation.navigate('ArtisanBiocharMixing', selection);
  };

  const renderResult = ({ item }: { item: ArtisanFarmSearchRecord }) => {
    const selection = toSelection(item);

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{item.farmer_name ?? 'Farmer'}</Text>
        <Text style={styles.cardMeta}>
          {item.farmer_code ? `${item.farmer_code} · ` : ''}
          Farm {item.farm_code ?? item.farm_id}
        </Text>
        <Text style={styles.cardMeta}>{[item.village, item.taluka, item.district].filter(Boolean).join(' · ')}</Text>
        {item.area_acre != null ? <Text style={styles.cardMeta}>Area: {item.area_acre} acre</Text> : null}
        {item.biochar_status ? <Text style={styles.cardStatus}>Biochar: {item.biochar_status}</Text> : null}
        {item.next_due_date ? <Text style={styles.cardMeta}>Next due: {item.next_due_date}</Text> : null}

        <View style={styles.cardActions}>
          <Pressable style={styles.selectButton} onPress={() => openProduction(selection)}>
            <Text style={styles.selectButtonText}>Select for Production</Text>
          </Pressable>
          <Pressable style={styles.secondarySelectButton} onPress={() => openMixing(selection)}>
            <Text style={styles.secondarySelectButtonText}>Select for Mixing</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Find Farmer / Farm" showBrandLogo={false} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          data={results}
          keyExtractor={(item) => `${item.farm_id}-${item.farmer_id}`}
          renderItem={renderResult}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              <Text style={styles.helper}>
                Search only within villages and talukas allocated to you by admin.
              </Text>

              <Text style={styles.label}>Search by Farm ID or Farmer Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Search by Farm ID or Farmer Name"
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                returnKeyType="search"
                onSubmitEditing={() => void runSearch()}
              />

              {loadingLocations ? (
                <View style={styles.inlineLoading}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.inlineLoadingText}>Loading allocated filters…</Text>
                </View>
              ) : (
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

              <Pressable style={[styles.searchButton, searching && styles.buttonDisabled]} disabled={searching} onPress={() => void runSearch()}>
                <Text style={styles.searchButtonText}>{searching ? 'Searching…' : 'Search'}</Text>
              </Pressable>

              {error ? <Text style={styles.error}>{error}</Text> : null}
              {!error && emptyMessage ? <Text style={styles.empty}>{emptyMessage}</Text> : null}
              {results.length > 0 ? <Text style={styles.sectionTitle}>Matching Farms ({results.length})</Text> : null}
            </View>
          }
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
