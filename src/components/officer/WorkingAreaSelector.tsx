import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAddressCascade } from '../../hooks/useAddressCascade';
import { officerTheme } from '../../theme/officerDashboardTheme';
import { FormMultiSelect } from '../FormMultiSelect';
import { FormSelect } from '../FormSelect';

export interface WorkingAreaEntry {
  districtId?: number;
  districtName?: string;
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
  const address = useAddressCascade(state);
  const [districtId, setDistrictId] = useState('');
  const [districtName, setDistrictName] = useState('');
  const [talukaId, setTalukaId] = useState('');
  const [talukaName, setTalukaName] = useState('');
  const [villageIds, setVillageIds] = useState<number[]>([]);

  useEffect(() => {
    if (districtId) {
      void address.loadTalukas(Number(districtId));
    }
  }, [districtId]);

  useEffect(() => {
    if (talukaId) {
      void address.loadVillages(Number(talukaId));
    }
  }, [talukaId]);

  const villageOptions = useMemo(
    () => address.villages.map((item) => ({ id: item.id, name: item.name })),
    [address.villages],
  );

  const totalVillageCount = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.villageIds.length, 0),
    [entries],
  );

  const addCurrentSelection = () => {
    if (!talukaId || villageIds.length === 0) {
      return;
    }

    const talukaIdNum = Number(talukaId);
    const selectedNames = villageOptions
      .filter((option) => villageIds.includes(option.id))
      .map((option) => option.name);
    const existingIndex = entries.findIndex((entry) => entry.talukaId === talukaIdNum);

    if (existingIndex >= 0) {
      const merged = [...entries];
      const existing = merged[existingIndex];
      merged[existingIndex] = {
        ...existing,
        villageIds: Array.from(new Set([...existing.villageIds, ...villageIds])),
        villageNames: Array.from(new Set([...existing.villageNames, ...selectedNames])),
      };
      onChange(merged);
    } else {
      onChange([
        ...entries,
        {
          districtId: districtId ? Number(districtId) : undefined,
          districtName,
          talukaId: talukaIdNum,
          talukaName,
          villageIds: [...villageIds],
          villageNames: selectedNames,
        },
      ]);
    }

    setTalukaId('');
    setTalukaName('');
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

  return (
    <View style={styles.wrap}>
      <FormSelect
        label="Working district"
        placeholder="Select district"
        value={districtId}
        displayValue={districtName || undefined}
        options={address.districts}
        loading={address.loadingDistricts}
        error={address.error}
        onSelect={(option) => {
          setDistrictId(String(option.id));
          setDistrictName(option.name);
          setTalukaId('');
          setTalukaName('');
          setVillageIds([]);
        }}
      />
      <FormSelect
        label="Working taluka"
        placeholder="Select taluka"
        value={talukaId}
        displayValue={talukaName || undefined}
        options={address.talukas}
        loading={address.loadingTalukas}
        disabled={!districtId}
        onSelect={(option) => {
          setTalukaId(String(option.id));
          setTalukaName(option.name);
          setVillageIds([]);
        }}
      />
      <FormMultiSelect
        label="Working villages"
        placeholder={talukaId ? 'Select one or more villages' : 'Select a taluka first'}
        values={villageIds}
        options={villageOptions}
        loading={address.loadingVillages}
        disabled={!talukaId}
        onChange={setVillageIds}
      />
      <Pressable
        style={[styles.addButton, (!talukaId || villageIds.length === 0) && styles.addButtonDisabled]}
        disabled={!talukaId || villageIds.length === 0}
        onPress={addCurrentSelection}
        accessibilityRole="button"
        accessibilityLabel="Add selected villages to working area"
      >
        <Text style={styles.addButtonText}>Add to working area</Text>
      </Pressable>

      {entries.length > 0 ? (
        <View style={styles.entryList}>
          <Text style={styles.entryListTitle}>
            Working area ({totalVillageCount} village{totalVillageCount === 1 ? '' : 's'} across {entries.length}{' '}
            taluka{entries.length === 1 ? '' : 's'})
          </Text>
          {entries.map((entry) => (
            <View key={entry.talukaId} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryTaluka}>{entry.talukaName}</Text>
                <Pressable onPress={() => removeEntry(entry.talukaId)} hitSlop={8}>
                  <Text style={styles.entryRemove}>Remove taluka</Text>
                </Pressable>
              </View>
              <View style={styles.villageChipsRow}>
                {entry.villageNames.map((name, index) => (
                  <Pressable
                    key={`${entry.talukaId}-${name}`}
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
  addButtonText: { color: officerTheme.onPrimary, fontSize: 14, fontWeight: '700' },
  entryList: { gap: 8, marginTop: 4 },
  entryListTitle: { color: officerTheme.onSurface, fontSize: 13, fontWeight: '800' },
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
