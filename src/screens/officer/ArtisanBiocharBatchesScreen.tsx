import { useCallback, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { getApiErrorMessage } from '../../api/authApi';
import { getOfficerArtisanBiocharBatches } from '../../api/fieldOfficerApi';
import { AppButton } from '../../components/AppButton';
import { FilterCalendarModal } from '../../components/officer/FilterCalendarModal';
import { OfficerListState } from '../../components/officer/OfficerListState';
import { OfficerScreenChrome } from '../../components/officer/OfficerScreenChrome';
import { ScreenHeader } from '../../components/ScreenHeader';
import { BhuguardMaterialIcon } from '../../components/shared/BhuguardMaterialIcon';
import { officerCardShadow, officerTheme } from '../../theme/officerDashboardTheme';
import { pickString, type ApiRecord } from '../../utils/apiHelpers';
import { getFarmCoordinates, openGoogleMaps } from '../../utils/farmMapHelpers';

type FilterState = {
  from: string;
  to: string;
  search: string;
};

const initialFilters: FilterState = { from: '', to: '', search: '' };

/** Display-only formatter; state always stores YYYY-MM-DD. */
function formatFilterDisplayDate(isoDate: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return isoDate;
  }

  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function displayBatchStatus(value: string): string {
  const normalized = value.trim().toLowerCase();

  if (normalized === 'completed' || normalized === 'approved' || normalized === 'complete') {
    return 'Completed';
  }

  if (normalized === 'rejected') {
    return 'Rejected';
  }

  return 'Pending';
}

function normalizeArtisanBatchList(data: unknown): ApiRecord[] {
  if (Array.isArray(data)) {
    return data as ApiRecord[];
  }

  if (!data || typeof data !== 'object') {
    return [];
  }

  const payload = data as Record<string, unknown>;

  if (Array.isArray(payload.batches)) {
    return payload.batches as ApiRecord[];
  }

  if (Array.isArray(payload.items)) {
    return payload.items as ApiRecord[];
  }

  if (Array.isArray(payload.data)) {
    return payload.data as ApiRecord[];
  }

  return [];
}

function normalizeFilterState(next: FilterState): FilterState {
  return {
    from: next.from.trim(),
    to: next.to.trim(),
    search: next.search.trim(),
  };
}

function buildBatchListParams(next: FilterState): {
  from_date?: string;
  to_date?: string;
  search?: string;
} {
  const normalized = normalizeFilterState(next);
  const params: { from_date?: string; to_date?: string; search?: string } = {};

  if (normalized.from) {
    params.from_date = normalized.from;
  }

  if (normalized.to) {
    params.to_date = normalized.to;
  }

  if (normalized.search) {
    params.search = normalized.search;
  }

  return params;
}

export function ArtisanBiocharBatchesScreen() {
  const [batches, setBatches] = useState<ApiRecord[]>([]);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(initialFilters);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [datePicker, setDatePicker] = useState<'from' | 'to' | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const appliedFiltersRef = useRef(appliedFilters);
  appliedFiltersRef.current = appliedFilters;

  const fetchBatches = useCallback(async (nextFilters: FilterState, silent = false) => {
    const requestId = ++requestIdRef.current;

    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const data = await getOfficerArtisanBiocharBatches(buildBatchListParams(nextFilters));

      if (requestId !== requestIdRef.current) {
        return;
      }

      setBatches(normalizeArtisanBatchList(data));
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setError('Unable to load Artisan Biochar Batches. Please try again.');
      if (__DEV__) {
        console.warn('[ArtisanBiocharBatches]', getApiErrorMessage(err));
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Reload with the latest applied filters when the screen gains focus.
      void fetchBatches(appliedFiltersRef.current);
    }, [fetchBatches]),
  );

  const applyFilters = () => {
    if (filters.from && filters.to && filters.to < filters.from) {
      setFilterError('To Date cannot be earlier than From Date.');
      return;
    }

    const next = normalizeFilterState(filters);
    setFilterError(null);
    setFilters(next);
    setAppliedFilters(next);
    void fetchBatches(next);
  };

  const applyClearedFilters = (next: FilterState) => {
    const normalized = normalizeFilterState(next);
    setFilterError(null);
    setFilters(normalized);
    setAppliedFilters(normalized);
    void fetchBatches(normalized);
  };

  const clearFromDate = () => {
    applyClearedFilters({ ...filters, from: '' });
  };

  const clearToDate = () => {
    applyClearedFilters({ ...filters, to: '' });
  };

  const clearDates = () => {
    applyClearedFilters({ ...filters, from: '', to: '' });
  };

  const clearFilters = () => {
    applyClearedFilters(initialFilters);
  };

  const hasDateFilters = Boolean(appliedFilters.from) || Boolean(appliedFilters.to);
  const hasSearchFilter = Boolean(appliedFilters.search.trim());
  const hasAppliedFilters = hasDateFilters || hasSearchFilter;
  const hasDraftFilters =
    Boolean(filters.from) || Boolean(filters.to) || Boolean(filters.search.trim());

  const emptyTitle = hasAppliedFilters
    ? 'No Artisan Biochar Batches found for the selected filters.'
    : 'No Artisan Biochar Batches found.';

  return (
    <OfficerScreenChrome edges={['top']}>
      <ScreenHeader title="Artisan Biochar Batches" />
      {loading && batches.length === 0 ? (
        <OfficerListState kind="loading" message="Loading Artisan Pro biochar batches…" />
      ) : error && batches.length === 0 ? (
        <OfficerListState kind="error" message={error} onRetry={() => void fetchBatches(appliedFilters)} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void fetchBatches(appliedFilters, true)}
              tintColor={officerTheme.primary}
            />
          }
        >
          <Text style={styles.intro}>
            View biochar production batches from all artisans. Filter by date or search when needed.
          </Text>
          <View style={styles.filters}>
            <DateFilterField
              label="From date"
              value={filters.from}
              onPress={() => setDatePicker('from')}
              onClear={clearFromDate}
            />
            <DateFilterField
              label="To date"
              value={filters.to}
              onPress={() => setDatePicker('to')}
              onClear={clearToDate}
            />

            <View style={styles.field}>
              <Text style={styles.label}>Search</Text>
              <TextInput
                value={filters.search}
                onChangeText={(search) => {
                  setFilterError(null);
                  setFilters((current) => ({ ...current, search }));
                }}
                placeholder="Batch, farmer, village, or artisan"
                placeholderTextColor={officerTheme.onSurfaceVariant}
                style={styles.input}
              />
            </View>

            {filterError ? <Text style={styles.filterError}>{filterError}</Text> : null}

            <AppButton label="Apply Filters" onPress={applyFilters} variant="secondary" />
            {hasDateFilters || Boolean(filters.from) || Boolean(filters.to) ? (
              <AppButton label="Clear Dates" onPress={clearDates} variant="ghost" />
            ) : null}
            {hasAppliedFilters || hasDraftFilters ? (
              <AppButton label="Clear Filters" onPress={clearFilters} variant="ghost" />
            ) : null}
          </View>

          {batches.length === 0 ? (
            <OfficerListState
              kind="empty"
              title={emptyTitle}
              message={
                hasAppliedFilters
                  ? 'Try adjusting dates or search to find matching batches.'
                  : 'Batches will appear here when artisans report production.'
              }
            />
          ) : (
            batches.map((batch) => {
              const farmId = pickString(batch, 'farm_id');
              const farmCoordinates = getFarmCoordinates(batch);

              return (
                <View key={String(batch.id ?? batch.batch_id)} style={[styles.card, officerCardShadow]}>
                  <Text style={styles.batchId}>Batch ID: {pickString(batch, 'batch_id', 'batch_code', 'id')}</Text>
                  <Text style={styles.meta}>Artisan: {pickString(batch, 'artisan_name')}</Text>
                  <Text style={styles.meta}>Farmer: {pickString(batch, 'farmer_name')}</Text>
                  {farmId !== '-' ? (
                    <Text style={styles.meta}>Farm ID: {pickString(batch, 'farm_code') !== '-' ? pickString(batch, 'farm_code') : farmId}</Text>
                  ) : null}
                  <Text style={styles.meta}>Village: {pickString(batch, 'village')}</Text>
                  <Text style={styles.meta}>Date: {pickString(batch, 'batch_date', 'production_date')}</Text>
                  <Text style={styles.status}>
                    {displayBatchStatus(pickString(batch, 'status_label', 'status'))}
                  </Text>

                  {farmId !== '-' ? (
                    <Pressable
                      style={[styles.navigateButton, !farmCoordinates && styles.navigateButtonDisabled]}
                      onPress={() => {
                        if (!farmCoordinates) {
                          return;
                        }
                        void openGoogleMaps(farmCoordinates, pickString(batch, 'farmer_name') !== '-' ? pickString(batch, 'farmer_name') : undefined);
                      }}
                      disabled={!farmCoordinates}
                      accessibilityRole="button"
                      accessibilityLabel="Navigate to farm"
                    >
                      <BhuguardMaterialIcon
                        name="share_location"
                        size={16}
                        color={farmCoordinates ? officerTheme.onPrimary : officerTheme.onSurfaceVariant}
                      />
                      <Text style={[styles.navigateButtonText, !farmCoordinates && styles.navigateButtonTextDisabled]}>
                        {farmCoordinates ? 'Navigate Farm' : 'GPS not saved for this farm'}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      <FilterCalendarModal
        visible={datePicker === 'from'}
        title="From date"
        value={filters.from}
        maximumDate={filters.to || undefined}
        onClose={() => setDatePicker(null)}
        onSelect={(from) => {
          setFilterError(null);
          setFilters((current) => ({ ...current, from }));
        }}
        onClear={() => {
          setDatePicker(null);
          clearFromDate();
        }}
      />

      <FilterCalendarModal
        visible={datePicker === 'to'}
        title="To date"
        value={filters.to}
        minimumDate={filters.from || undefined}
        onClose={() => setDatePicker(null)}
        onSelect={(to) => {
          setFilterError(null);
          setFilters((current) => ({ ...current, to }));
        }}
        onClear={() => {
          setDatePicker(null);
          clearToDate();
        }}
      />
    </OfficerScreenChrome>
  );
}

function DateFilterField({
  label,
  value,
  onPress,
  onClear,
}: {
  label: string;
  value: string;
  onPress: () => void;
  onClear: () => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.dateRow}>
        <Pressable style={styles.dateField} onPress={onPress}>
          <BhuguardMaterialIcon name="event_note" size={18} color={officerTheme.onSurfaceVariant} />
          <Text style={[styles.dateText, !value && styles.placeholderText]}>
            {value ? formatFilterDisplayDate(value) : 'Select date'}
          </Text>
        </Pressable>
        {value ? (
          <Pressable style={styles.clearDateButton} onPress={onClear} hitSlop={8}>
            <Text style={styles.clearDateText}>Clear</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, padding: officerTheme.marginMobile, paddingBottom: 48 },
  intro: { color: officerTheme.onSurfaceVariant, fontSize: 14, lineHeight: 20 },
  filters: {
    backgroundColor: officerTheme.surfaceLowest,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  field: { gap: 6 },
  label: { color: officerTheme.onSurface, fontSize: 12, fontWeight: '700' },
  input: {
    borderColor: officerTheme.outlineVariant,
    borderRadius: 10,
    borderWidth: 1,
    color: officerTheme.onSurface,
    fontSize: 14,
    minHeight: 44,
    paddingHorizontal: 10,
  },
  dateRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  dateField: {
    alignItems: 'center',
    borderColor: officerTheme.outlineVariant,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 10,
  },
  dateText: { color: officerTheme.onSurface, flex: 1, fontSize: 14, fontWeight: '600' },
  placeholderText: { color: officerTheme.onSurfaceVariant, fontWeight: '500' },
  clearDateButton: { paddingHorizontal: 4, paddingVertical: 8 },
  clearDateText: { color: officerTheme.primaryContainer, fontSize: 12, fontWeight: '700' },
  filterError: { color: officerTheme.error, fontSize: 12, fontWeight: '600' },
  card: {
    backgroundColor: officerTheme.surfaceLowest,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 14,
    borderWidth: 1,
    gap: 5,
    padding: 14,
  },
  batchId: { color: officerTheme.onSurface, fontSize: 15, fontWeight: '800' },
  meta: { color: officerTheme.onSurfaceVariant, fontSize: 13 },
  status: {
    color: officerTheme.primary,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
    textTransform: 'uppercase',
  },
  navigateButton: {
    alignItems: 'center',
    backgroundColor: officerTheme.primary,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 10,
  },
  navigateButtonDisabled: {
    backgroundColor: officerTheme.surfaceVariant,
  },
  navigateButtonText: {
    color: officerTheme.onPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  navigateButtonTextDisabled: {
    color: officerTheme.onSurfaceVariant,
  },
});
