import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTalukaVillageOptions } from '../../hooks/useTalukaVillageOptions';
import { useWorkingAreaAddressOptions } from '../../hooks/useWorkingAreaAddressOptions';
import { officerTheme } from '../../theme/officerDashboardTheme';
import { formatVillageEmptyMessage } from '../../utils/addressVillageDiagnostics';
import {
  ENTIRE_CITY_STORED_LABEL,
  entireCityOptionValue,
  isEntireCityOptionValue,
  reconcileWorkingVillageSelection,
  talukaIdForLocationOption,
  talukaIdFromEntireCityOption,
} from '../../utils/workingAreaScope';
import { FormMultiSelect } from '../FormMultiSelect';

export interface WorkingAreaEntry {
  districtId: number;
  districtName: string;
  talukaId: number;
  talukaName: string;
  villageIds: number[];
  villageNames: string[];
}

interface WorkingAreaSelectorProps {
  state?: string;
  entries: WorkingAreaEntry[];
  onChange: (entries: WorkingAreaEntry[]) => void;
}

/**
 * District → Taluka → Village working area picker that ADDS the current
 * selection to the working area instead of silently replacing it when the
 * officer switches taluka. Taluka options use the same address master API as
 * Home Address (`/address/talukas`), not FO allocation snapshots.
 */
export function WorkingAreaSelector({ state = 'Gujarat', entries, onChange }: WorkingAreaSelectorProps) {
  const [districtIds, setDistrictIds] = useState<number[]>([]);
  const [talukaIds, setTalukaIds] = useState<number[]>([]);
  const [villageIds, setVillageIds] = useState<number[]>([]);
  const [scopeError, setScopeError] = useState<string | null>(null);

  const {
    districts,
    talukaOptions,
    districtNameById,
    loading: loadingAddressOptions,
    loadingTalukas,
    error: addressError,
  } = useWorkingAreaAddressOptions(state, districtIds);

  const districtOptions = useMemo(
    () => districts.map((item) => ({ id: item.id, name: item.name })),
    [districts],
  );

  const talukaNameMap = useMemo(() => {
    const map: Record<number, string> = {};
    talukaOptions.forEach((item) => {
      map[item.id] = item.name;
    });
    return map;
  }, [talukaOptions]);

  const {
    villagesByTaluka,
    selectOptions,
    loading: loadingVillageOptions,
    error: villageLoadError,
  } = useTalukaVillageOptions(talukaIds, talukaNameMap);

  type VillageCatalogItem = {
    id: number;
    name: string;
    taluka_id: number;
    taluka_name: string;
    district_id: number;
    district_name: string;
    scope: 'taluka' | 'village';
  };

  const villageCatalog = useMemo<VillageCatalogItem[]>(() => {
    const catalog: VillageCatalogItem[] = [];

    selectOptions.forEach((option) => {
      const talukaId = option.talukaId ?? (isEntireCityOptionValue(option.id)
        ? talukaIdFromEntireCityOption(option.id)
        : 0);
      const taluka = talukaOptions.find((item) => Number(item.id) === Number(talukaId));
      const districtId = Number(taluka?.district_id ?? districtIds[0] ?? 0);
      const districtName = districtNameById[districtId] ?? '—';

      catalog.push({
        id: option.id,
        name: option.name,
        taluka_id: talukaId,
        taluka_name: taluka?.name ?? talukaNameMap[talukaId] ?? '—',
        district_id: districtId,
        district_name: districtName,
        scope: option.scope ?? (isEntireCityOptionValue(option.id) ? 'taluka' : 'village'),
      });
    });

    talukaIds.forEach((talukaId) => {
      (villagesByTaluka[talukaId] ?? []).forEach((village) => {
        if (catalog.some((item) => item.id === village.id)) {
          return;
        }

        const taluka = talukaOptions.find((item) => Number(item.id) === Number(talukaId));
        const districtId = Number(taluka?.district_id ?? districtIds[0] ?? 0);
        const districtName = districtNameById[districtId] ?? '—';

        catalog.push({
          id: village.id,
          name: village.name,
          taluka_id: talukaId,
          taluka_name: taluka?.name ?? talukaNameMap[talukaId] ?? '—',
          district_id: districtId,
          district_name: districtName,
          scope: 'village',
        });
      });
    });

    return catalog;
  }, [
    selectOptions,
    villagesByTaluka,
    talukaIds,
    talukaOptions,
    districtIds,
    districtNameById,
    talukaNameMap,
  ]);

  const villageOptions = useMemo(
    () => selectOptions.map((item) => ({
      id: item.id,
      name: item.name,
      scope: item.scope,
      pincode: item.pincode,
    })),
    [selectOptions],
  );

  const villageEmptyMessage = useMemo(() => {
    if (talukaIds.length === 1) {
      return formatVillageEmptyMessage(talukaNameMap[talukaIds[0]]);
    }
    if (talukaIds.length > 1) {
      const names = talukaIds.map((id) => talukaNameMap[id]).filter(Boolean);
      if (names.length > 0) {
        return `No villages available for ${names.join(', ')}.`;
      }
    }
    return formatVillageEmptyMessage();
  }, [talukaIds, talukaNameMap]);

  const handleDistrictChange = (ids: number[]) => {
    setDistrictIds(ids);
    setTalukaIds([]);
    setVillageIds([]);
    setScopeError(null);
  };

  const handleTalukaChange = (ids: number[]) => {
    setTalukaIds(ids);
    setVillageIds((current) =>
      current.filter((selectionId) => {
        const option = selectOptions.find((item) => item.id === selectionId);
        if (!option) {
          if (isEntireCityOptionValue(selectionId)) {
            return ids.includes(talukaIdFromEntireCityOption(selectionId));
          }
          return false;
        }

        const talukaId = talukaIdForLocationOption(option);
        return talukaId > 0 && ids.includes(talukaId);
      }),
    );
    setScopeError(null);
  };

  const handleVillageChange = (ids: number[]) => {
    const previous = new Set(villageIds);
    const added = ids.filter((id) => !previous.has(id));

    let next = [...ids];
    for (const id of added) {
      if (isEntireCityOptionValue(id)) {
        const talukaId = talukaIdFromEntireCityOption(id);
        next = next.filter((value) => {
          if (value === id) {
            return true;
          }

          const option = selectOptions.find((item) => item.id === value);
          return talukaIdForLocationOption(option ?? { id: value, name: '' }) !== talukaId;
        });
        continue;
      }

      const option = selectOptions.find((item) => item.id === id);
      const talukaId = option ? talukaIdForLocationOption(option) : 0;
      if (talukaId > 0) {
        next = next.filter((value) => value !== entireCityOptionValue(talukaId));
      }
    }

    setVillageIds(reconcileWorkingVillageSelection(next, selectOptions));
    setScopeError(null);
  };

  const totalSelectionCount = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.villageIds.length, 0),
    [entries],
  );

  const addCurrentSelection = () => {
    if (districtIds.length === 0 || talukaIds.length === 0 || villageIds.length === 0) {
      return;
    }

    const selectedItems = villageCatalog.filter((item) => villageIds.includes(Number(item.id)));
    const selectedTalukas = new Set(talukaIds.map(Number));
    const invalidSelections = selectedItems.filter((item) => !selectedTalukas.has(Number(item.taluka_id)));

    if (invalidSelections.length > 0) {
      setScopeError('Selected villages do not match the chosen talukas.');
      return;
    }

    const selectedDistricts = new Set(districtIds.map(Number));
    const groupedByTaluka = new Map<number, WorkingAreaEntry>();

    for (const item of selectedItems) {
      const itemTalukaId = Number(item.taluka_id);
      const itemDistrictId = Number(item.district_id ?? 0);
      if (itemDistrictId > 0 && !selectedDistricts.has(itemDistrictId)) {
        setScopeError('Selected villages do not match the chosen districts.');
        return;
      }

      if (item.scope === 'taluka' || isEntireCityOptionValue(item.id)) {
        groupedByTaluka.set(itemTalukaId, {
          districtId: itemDistrictId,
          districtName: item.district_name ?? '—',
          talukaId: itemTalukaId,
          talukaName: item.taluka_name ?? '—',
          villageIds: [item.id],
          villageNames: [ENTIRE_CITY_STORED_LABEL],
        });
        continue;
      }

      if (groupedByTaluka.get(itemTalukaId)?.villageIds.some((id) => isEntireCityOptionValue(id))) {
        continue;
      }

      const existing = groupedByTaluka.get(itemTalukaId);
      const base: WorkingAreaEntry = existing ?? {
        districtId: itemDistrictId,
        districtName: item.district_name ?? '—',
        talukaId: itemTalukaId,
        talukaName: item.taluka_name ?? '—',
        villageIds: [],
        villageNames: [],
      };

      if (!base.villageIds.includes(item.id)) {
        base.villageIds.push(item.id);
        base.villageNames.push(item.name);
      }

      groupedByTaluka.set(itemTalukaId, base);
    }

    const mergedByTaluka = new Map<number, WorkingAreaEntry>();
    for (const entry of entries) {
      mergedByTaluka.set(entry.talukaId, {
        ...entry,
        villageIds: [...entry.villageIds],
        villageNames: [...entry.villageNames],
      });
    }

    groupedByTaluka.forEach((entry, talukaIdKey) => {
      const existing = mergedByTaluka.get(talukaIdKey);
      if (!existing) {
        mergedByTaluka.set(talukaIdKey, entry);
        return;
      }

      const entryHasEntireCity = entry.villageIds.some((id) => isEntireCityOptionValue(id));
      const existingHasEntireCity = existing.villageIds.some((id) => isEntireCityOptionValue(id));

      if (entryHasEntireCity) {
        mergedByTaluka.set(talukaIdKey, entry);
        return;
      }

      if (existingHasEntireCity) {
        return;
      }

      const mergedIds = Array.from(new Set([...existing.villageIds, ...entry.villageIds]));
      const idToName = new Map<number, string>();
      existing.villageIds.forEach((id, index) => idToName.set(id, existing.villageNames[index] ?? String(id)));
      entry.villageIds.forEach((id, index) => idToName.set(id, entry.villageNames[index] ?? String(id)));
      mergedByTaluka.set(talukaIdKey, {
        ...existing,
        villageIds: mergedIds,
        villageNames: mergedIds.map((id) => idToName.get(id) ?? String(id)),
      });
    });

    onChange(Array.from(mergedByTaluka.values()));
    setScopeError(null);
    setTalukaIds([]);
    setVillageIds([]);
  };

  const removeEntry = (talukaIdToRemove: number) => {
    onChange(entries.filter((entry) => entry.talukaId !== talukaIdToRemove));
  };

  const removeVillage = (talukaIdForEntry: number, villageId: number) => {
    const next = entries
      .map((entry) => {
        if (entry.talukaId !== talukaIdForEntry) {
          return entry;
        }

        const index = entry.villageIds.indexOf(villageId);
        const nextVillageIds = entry.villageIds.filter((id) => id !== villageId);
        const nextVillageNames =
          index >= 0 ? entry.villageNames.filter((_, i) => i !== index) : entry.villageNames;

        return { ...entry, villageIds: nextVillageIds, villageNames: nextVillageNames };
      })
      .filter((entry) => entry.villageIds.length > 0);

    onChange(next);
  };

  const groupedEntries = useMemo(() => {
    const map = new Map<number, { districtId: number; districtName: string; talukas: WorkingAreaEntry[] }>();
    for (const entry of entries) {
      const existing = map.get(entry.districtId);
      if (!existing) {
        map.set(entry.districtId, {
          districtId: entry.districtId,
          districtName: entry.districtName,
          talukas: [entry],
        });
      } else {
        existing.talukas.push(entry);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.districtName.localeCompare(b.districtName));
  }, [entries]);

  return (
    <View style={styles.wrap}>
      <FormMultiSelect
        label="Working districts"
        placeholder="Select one or more districts"
        hint="Select one or more districts for the working area."
        searchPlaceholder="Search district..."
        values={districtIds}
        options={districtOptions}
        loading={loadingAddressOptions}
        error={addressError}
        onChange={handleDistrictChange}
      />
      <FormMultiSelect
        label="Working talukas"
        placeholder={districtIds.length > 0 ? 'Select one or more talukas' : 'Select district first'}
        hint="Select one or more talukas for the working area."
        searchPlaceholder="Search taluka..."
        values={talukaIds}
        options={talukaOptions}
        loading={loadingTalukas}
        disabled={districtIds.length === 0}
        onChange={handleTalukaChange}
      />
      <FormMultiSelect
        label="Working villages"
        placeholder={talukaIds.length > 0 ? 'Select villages or Entire City' : 'Select taluka(s) first'}
        hint="Select villages, localities, or Entire City for city talukas."
        values={villageIds}
        options={villageOptions}
        loading={loadingVillageOptions}
        disabled={talukaIds.length === 0}
        emptyMessage={villageEmptyMessage}
        searchPlaceholder="Search village or Entire City..."
        error={villageLoadError}
        onChange={handleVillageChange}
      />
      <Pressable
        style={[
          styles.addButton,
          (districtIds.length === 0 || talukaIds.length === 0 || villageIds.length === 0 || Boolean(scopeError))
            && styles.addButtonDisabled,
          scopeError ? styles.addButtonError : null,
        ]}
        disabled={
          districtIds.length === 0 || talukaIds.length === 0 || villageIds.length === 0 || Boolean(scopeError)
        }
        onPress={addCurrentSelection}
        accessibilityRole="button"
        accessibilityLabel="Add selected villages to working area"
      >
        <Text style={styles.addButtonText}>Add to working area</Text>
      </Pressable>
      {scopeError ? <Text style={styles.scopeError}>{scopeError}</Text> : null}

      {entries.length > 0 ? (
        <View style={styles.entryList}>
          <Text style={styles.entryListTitle}>
            Working area ({totalSelectionCount} selection{totalSelectionCount === 1 ? '' : 's'} across {entries.length}{' '}
            taluka{entries.length === 1 ? '' : 's'})
          </Text>
          {groupedEntries.map((district) => (
            <View key={`district-${district.districtId}`} style={styles.districtGroup}>
              <Text style={styles.districtTitle}>{district.districtName}</Text>
              {district.talukas.map((entry) => (
                <View key={`taluka-${entry.talukaId}`} style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryTaluka}>{entry.talukaName}</Text>
                    <Pressable onPress={() => removeEntry(entry.talukaId)} hitSlop={8}>
                      <Text style={styles.entryRemove}>Remove taluka</Text>
                    </Pressable>
                  </View>
                  <View style={styles.villageChipsRow}>
                    {entry.villageNames.map((name, index) => {
                      const selectionId = entry.villageIds[index];
                      const isEntireCity = selectionId != null && isEntireCityOptionValue(selectionId);
                      const chipLabel = isEntireCity ? ENTIRE_CITY_STORED_LABEL : name;
                      return (
                      <Pressable
                        key={`allocation-${entry.districtId}-${entry.talukaId}-${selectionId}`}
                        style={[styles.villageChip, isEntireCity && styles.entireCityChip]}
                        onPress={() => removeVillage(entry.talukaId, selectionId)}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${chipLabel} from working area`}
                      >
                        <Text style={[styles.villageChipText, isEntireCity && styles.entireCityChipText]}>{chipLabel} ✕</Text>
                      </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  addButton: {
    alignItems: 'center',
    backgroundColor: officerTheme.primary,
    borderRadius: 10,
    paddingVertical: 12,
  },
  addButtonDisabled: { opacity: 0.5 },
  addButtonError: {
    backgroundColor: '#B53B3B',
  },
  addButtonText: { color: officerTheme.onPrimary, fontSize: 14, fontWeight: '700' },
  scopeError: {
    color: officerTheme.error,
    fontSize: 12,
    fontWeight: '700',
  },
  entryList: { gap: 8, marginTop: 4 },
  entryListTitle: { color: officerTheme.onSurface, fontSize: 13, fontWeight: '800' },
  districtGroup: {
    gap: 8,
  },
  districtTitle: {
    color: officerTheme.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  entryCard: {
    backgroundColor: officerTheme.surfaceLowest,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  entryHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  entryTaluka: { color: officerTheme.onSurface, fontSize: 14, fontWeight: '800' },
  entryRemove: { color: officerTheme.error, fontSize: 12, fontWeight: '700' },
  villageChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  villageChip: {
    backgroundColor: officerTheme.secondaryContainer,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  villageChipText: { color: officerTheme.onSecondaryContainer, fontSize: 12, fontWeight: '700' },
  entireCityChip: {
    backgroundColor: '#E8F5E9',
    borderColor: officerTheme.primary,
    borderWidth: 1,
  },
  entireCityChipText: {
    color: officerTheme.primary,
  },
});
