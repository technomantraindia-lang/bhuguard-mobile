import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useAutoAddressPincode } from '../../hooks/useAutoAddressPincode';
import type { AssignedLocationsPayload } from '../../types/assignedLocations';
import { pickAutoPincode } from '../../utils/addressPincodeHelpers';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import { FormSelect } from '../FormSelect';
import { OnboardingTextField } from './OnboardingFormFields';
import type { OnboardingAddressValue } from './OnboardingAddressFields';

interface AssignedOnboardingAddressFieldsProps {
  value: OnboardingAddressValue;
  onChange: (patch: Partial<OnboardingAddressValue>) => void;
  locations: AssignedLocationsPayload;
  loading?: boolean;
  disabled?: boolean;
}

function MapIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z" stroke={dashboardTheme.outline} strokeWidth={1.6} />
    </Svg>
  );
}

export function AssignedOnboardingAddressFields({
  value,
  onChange,
  locations,
  loading = false,
  disabled = false,
}: AssignedOnboardingAddressFieldsProps) {
  const districtOptions = useMemo(
    () => locations.districts.map((item) => ({ id: item.id, name: item.name })),
    [locations.districts],
  );

  const talukaOptions = useMemo(() => {
    const talukas = value.district_id
      ? locations.talukas.filter((item) => String(item.district_id ?? '') === value.district_id)
      : locations.talukas;

    return talukas.map((item) => ({ id: item.id, name: item.name, pincode: undefined }));
  }, [locations.talukas, value.district_id]);

  const villageOptions = useMemo(() => {
    const villages = value.taluka_id
      ? locations.villages.filter((item) => String(item.taluka_id) === value.taluka_id)
      : locations.villages;

    return villages.map((item) => ({ id: item.id, name: item.name, pincode: undefined }));
  }, [locations.villages, value.taluka_id]);

  useAutoAddressPincode({
    talukaId: value.taluka_id,
    villageId: value.village_id,
    pincode: value.pincode,
    talukas: talukaOptions,
    villages: villageOptions,
    onPincodeChange: (next) => onChange({ pincode: next }),
  });

  return (
    <View style={styles.wrap}>
      <OnboardingTextField
        label="State"
        value={value.state || 'Gujarat'}
        onChangeText={() => undefined}
        editable={false}
        leftIcon={<MapIcon />}
      />

      <FormSelect
        label="District"
        placeholder="Select assigned district"
        value={value.district_id}
        displayValue={value.district_name || undefined}
        options={districtOptions}
        loading={loading}
        disabled={disabled || districtOptions.length === 0}
        onSelect={(option) =>
          onChange({
            district_id: String(option.id),
            district_name: option.name,
            taluka_id: '',
            taluka_name: '',
            village_id: '',
            village_name: '',
            pincode: '',
          })
        }
      />

      <FormSelect
        label="Taluka"
        placeholder="Select assigned taluka"
        value={value.taluka_id}
        displayValue={value.taluka_name || undefined}
        options={talukaOptions}
        disabled={disabled || !value.district_id || talukaOptions.length === 0}
        onSelect={(option) =>
          onChange({
            taluka_id: String(option.id),
            taluka_name: option.name,
            village_id: '',
            village_name: '',
            pincode: pickAutoPincode(option.pincode),
          })
        }
      />

      <FormSelect
        label="Village"
        placeholder="Select assigned village"
        value={value.village_id}
        displayValue={value.village_name || undefined}
        options={villageOptions}
        disabled={disabled || !value.taluka_id || villageOptions.length === 0}
        searchable
        onSelect={(option) => {
          const talukaOption = talukaOptions.find((item) => String(item.id) === value.taluka_id);

          onChange({
            village_id: String(option.id),
            village_name: option.name,
            pincode: pickAutoPincode(option.pincode, talukaOption?.pincode),
          });
        }}
      />

      <OnboardingTextField
        label="Pincode"
        value={value.pincode}
        onChangeText={() => undefined}
        placeholder="Auto-filled from taluka"
        keyboardType="numeric"
        maxLength={6}
        editable={false}
        leftIcon={<MapIcon />}
      />

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={dashboardTheme.primary} />
          <Text style={styles.loadingText}>Loading your assigned working areas…</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 20 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadingText: { fontSize: 13, color: dashboardTheme.onSurfaceVariant },
});
