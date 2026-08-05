import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAssignedLocations } from '../../hooks/useAssignedLocations';
import { officerTheme } from '../../theme/officerDashboardTheme';
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
 * officer switches taluka. Each taluka is tracked as its own entry; picking
 * villages again for an already-added taluka merges (unions) the village
 * ids instead of overwriting them. Removal is always an explicit action.
 */
export function WorkingAreaSelector({ state = 'Gujarat', entries, onChange }: WorkingAreaSelectorProps) {
  void state;
  const { locations, loading, error } = useAssignedLocations('field_officer');
  const [districtIds, setDistrictIds] = useState<number[]>([]);
  const [talukaIds, setTalukaIds] = useState<number[]>([]);
  const [villageIds, setVillageIds] = useState<number[]>([]);
  const [scopeError, setScopeError] = useState<string | null>(null);

  const districtOptions = useMemo(
    () => locations.districts.map((item) => ({ id: item.id, name: item.name })),
    [locations.districts],
  );

  const talukaOptions = useMemo(() => {
    return locations.talukas
      .filter((item) => (districtIds.length > 0 ? districtIds.includes(Number(item.district_id ?? 0)) : true))
      .map((item) => ({ id: item.id, name: item.name }));
  }, [locations.talukas, districtIds]);

  const villageOptions = useMemo(() => {
    return locations.villages
      .filter((item) => (talukaIds.length > 0 ? talukaIds.includes(Number(item.taluka_id)) : true))
      .map((item) => ({ id: item.id, name: item.name }));
  }, [locations.villages, talukaIds]);

  const totalVillageCount = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.villageIds.length, 0),
    [entries],
  );

  const addCurrentSelection = () => {
    if (districtIds.length === 0 || talukaIds.length === 0 || villageIds.length === 0) {
      return;
    }

    const selectedVillages = locations.villages.filter((item) => villageIds.includes(Number(item.id)));
    const selectedTalukas = new Set(talukaIds.map(Number));
    const invalidSelections = selectedVillages.filter((village) => !selectedTalukas.has(Number(village.taluka_id)));

    if (invalidSelections.length > 0) {
      setScopeError('Outside your assigned working area.');
      return;
    }

    const selectedDistricts = new Set(districtIds.map(Number));
    const groupedByTaluka = new Map<number, WorkingAreaEntry>();

    for (const village of selectedVillages) {
      const villageTalukaId = Number(village.taluka_id);
      const villageDistrictId = Number(village.district_id ?? 0);
      if (villageDistrictId > 0 && !selectedDistricts.has(villageDistrictId)) {
        setScopeError('Outside your assigned working area.');
        return;
      }

      const existing = groupedByTaluka.get(villageTalukaId);
      const base: WorkingAreaEntry = existing ?? {
        districtId: villageDistrictId,
        districtName: village.district_name ?? '—',
        talukaId: villageTalukaId,
        talukaName: village.taluka_name ?? '—',
        villageIds: [],
        villageNames: [],
      };

      if (!base.villageIds.includes(village.id)) {
        base.villageIds.push(village.id);
        base.villageNames.push(village.name);
      }

      groupedByTaluka.set(villageTalukaId, base);
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
        values={districtIds}
        options={districtOptions}
        loading={loading}
        error={error}
        onChange={(ids) => {
          setDistrictIds(ids);
          setTalukaIds([]);
          setVillageIds([]);
          setScopeError(null);
        }}
      />
      <FormMultiSelect
        label="Working talukas"
        placeholder={districtIds.length > 0 ? 'Select one or more talukas' : 'Select district first'}
        values={talukaIds}
        options={talukaOptions}
        loading={loading}
        disabled={districtIds.length === 0}
        onChange={(ids) => {
          setTalukaIds(ids);
          setVillageIds([]);
          setScopeError(null);
        }}
      />
      <FormMultiSelect
        label="Working villages"
        placeholder={talukaIds.length > 0 ? 'Select one or more villages' : 'Select taluka(s) first'}
        values={villageIds}
        options={villageOptions}
        loading={loading}
        disabled={talukaIds.length === 0}
        onChange={(ids) => {
          setVillageIds(ids);
          setScopeError(null);
        }}
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
            Working area ({totalVillageCount} village{totalVillageCount === 1 ? '' : 's'} across {entries.length}{' '}
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
                    {entry.villageNames.map((name, index) => (
                      <Pressable
                        key={`allocation-${entry.districtId}-${entry.talukaId}-${entry.villageIds[index]}`}
                        style={styles.villageChip}
                        onPress={() => removeVillage(entry.talukaId, entry.villageIds[index])}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${name} from working area`}
                      >
                        <Text style={styles.villageChipText}>{name} ✕</Text>
                      </Pressable>
                    ))}
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
});
