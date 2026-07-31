import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { FormSelect } from '../FormSelect';
import type { AssignedLocationsPayload } from '../../types/assignedLocations';

interface AssignedLocationFiltersProps {
  locations: AssignedLocationsPayload;
  selectedDistrictId: string;
  selectedTalukaId: string;
  selectedVillageId: string;
  onDistrictChange: (districtId: string) => void;
  onTalukaChange: (talukaId: string) => void;
  onVillageChange: (villageId: string) => void;
  disabled?: boolean;
}

export function AssignedLocationFilters({
  locations,
  selectedDistrictId,
  selectedTalukaId,
  selectedVillageId,
  onDistrictChange,
  onTalukaChange,
  onVillageChange,
  disabled = false,
}: AssignedLocationFiltersProps) {
  const districtOptions = useMemo(
    () => locations.districts.map((item) => ({ id: item.id, name: item.name })),
    [locations.districts],
  );

  const talukaOptions = useMemo(() => {
    const talukas = selectedDistrictId
      ? locations.talukas.filter((item) => String(item.district_id ?? '') === selectedDistrictId)
      : locations.talukas;

    return talukas.map((item) => ({ id: item.id, name: item.name }));
  }, [locations.talukas, selectedDistrictId]);

  const villageOptions = useMemo(() => {
    const villages = selectedTalukaId
      ? locations.villages.filter((item) => String(item.taluka_id) === selectedTalukaId)
      : locations.villages;

    return villages.map((item) => ({ id: item.id, name: item.name }));
  }, [locations.villages, selectedTalukaId]);

  return (
    <View style={styles.wrap}>
      <FormSelect
        label="District"
        placeholder="Select assigned district"
        value={selectedDistrictId}
        options={districtOptions}
        disabled={disabled || districtOptions.length === 0}
        onSelect={(option) => {
          onDistrictChange(String(option.id));
          onTalukaChange('');
          onVillageChange('');
        }}
      />
      <FormSelect
        label="Taluka"
        placeholder="All assigned talukas"
        value={selectedTalukaId}
        options={talukaOptions}
        disabled={disabled || talukaOptions.length === 0}
        onSelect={(option) => {
          onTalukaChange(String(option.id));
          onVillageChange('');
        }}
      />
      <FormSelect
        label="Village"
        placeholder="All assigned villages"
        value={selectedVillageId}
        options={villageOptions}
        disabled={disabled || villageOptions.length === 0}
        searchable
        onSelect={(option) => onVillageChange(String(option.id))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
});
