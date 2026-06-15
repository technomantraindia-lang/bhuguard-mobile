import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAddressCascade } from '../hooks/useAddressCascade';
import { colors } from '../theme/colors';
import { AppButton } from './AppButton';
import { ErrorState } from './ErrorState';
import { FormSelect } from './FormSelect';
import { LoadingState } from './LoadingState';

export interface AddressValue {
  state: string;
  district_id: string;
  district_name: string;
  taluka_id: string;
  taluka_name: string;
  village_id: string;
  village_name: string;
}

interface AddressSelectorProps {
  value: AddressValue;
  onChange: (patch: Partial<AddressValue>) => void;
  requireDistrict?: boolean;
  requireTaluka?: boolean;
  requireVillage?: boolean;
}

export function AddressSelector({
  value,
  onChange,
  requireDistrict = true,
  requireTaluka = true,
  requireVillage = true,
}: AddressSelectorProps) {
  const address = useAddressCascade(value.state || 'Gujarat');

  useEffect(() => {
    if (value.district_id) {
      void address.loadTalukas(Number(value.district_id));
    }
  }, [value.district_id]);

  useEffect(() => {
    if (value.taluka_id) {
      void address.loadVillages(Number(value.taluka_id));
    }
  }, [value.taluka_id]);

  return (
    <View style={styles.wrap}>
      {address.loadingDistricts && address.districts.length === 0 ? (
        <LoadingState message="Loading districts..." />
      ) : null}
      {address.error && address.districts.length === 0 ? (
        <ErrorState message={address.error} onRetry={() => void address.loadDistricts()} />
      ) : null}
      <FormSelect
        label={`District${requireDistrict ? ' *' : ''}`}
        value={value.district_id}
        displayValue={value.district_name || undefined}
        options={address.districts}
        loading={address.loadingDistricts}
        error={address.error}
        onSelect={(option) =>
          onChange({
            district_id: String(option.id),
            district_name: option.name,
            taluka_id: '',
            taluka_name: '',
            village_id: '',
            village_name: '',
          })
        }
      />
      <FormSelect
        label={`Taluka / Tehsil${requireTaluka ? ' *' : ''}`}
        value={value.taluka_id}
        displayValue={value.taluka_name || undefined}
        options={address.talukas}
        loading={address.loadingTalukas}
        disabled={!value.district_id}
        onSelect={(option) =>
          onChange({
            taluka_id: String(option.id),
            taluka_name: option.name,
            village_id: '',
            village_name: '',
          })
        }
      />
      <FormSelect
        label={`Village${requireVillage ? ' *' : ''}`}
        value={value.village_id}
        displayValue={value.village_name || undefined}
        options={address.villages}
        loading={address.loadingVillages}
        disabled={!value.taluka_id}
        searchable
        searchValue={address.villageSearch}
        onSearchChange={address.setVillageSearch}
        onSelect={(option) =>
          onChange({
            village_id: String(option.id),
            village_name: option.name,
          })
        }
      />
      {address.districts.length === 0 && !address.loadingDistricts && !address.error ? (
        <AppButton label="Reload districts" variant="secondary" onPress={() => void address.loadDistricts()} />
      ) : null}
      <Text style={styles.stateNote}>State: {value.state || 'Gujarat'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  stateNote: { fontSize: 13, color: colors.textMuted },
});
