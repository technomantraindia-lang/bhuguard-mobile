import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useAddressCascade } from '../../hooks/useAddressCascade';
import { useAutoAddressPincode } from '../../hooks/useAutoAddressPincode';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import { pickAutoPincode } from '../../utils/addressPincodeHelpers';
import { FormSelect } from '../FormSelect';
import { OnboardingTextField } from './OnboardingFormFields';

export interface OnboardingAddressValue {
  state: string;
  district_id: string;
  district_name: string;
  taluka_id: string;
  taluka_name: string;
  village_id: string;
  village_name: string;
  pincode: string;
}

interface OnboardingAddressFieldsProps {
  value: OnboardingAddressValue;
  onChange: (patch: Partial<OnboardingAddressValue>) => void;
}

function MapIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z" stroke={dashboardTheme.outline} strokeWidth={1.6} />
    </Svg>
  );
}

export function OnboardingAddressFields({ value, onChange }: OnboardingAddressFieldsProps) {
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

  useAutoAddressPincode({
    talukaId: value.taluka_id,
    villageId: value.village_id,
    pincode: value.pincode,
    talukas: address.talukas,
    villages: address.villages,
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

      <View style={styles.selectWrap}>
        <FormSelect
          label="District"
          placeholder="Select District"
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
              pincode: '',
            })
          }
        />
      </View>

      <View style={styles.selectWrap}>
        <FormSelect
          label="Taluka"
          placeholder="Select Taluka"
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
              pincode: pickAutoPincode(option.pincode),
            })
          }
        />
      </View>

      <View style={styles.selectWrap}>
        <FormSelect
          label="Village"
          placeholder="Select Village"
          value={value.village_id}
          displayValue={value.village_name || undefined}
          options={address.villages}
          loading={address.loadingVillages}
          disabled={!value.taluka_id}
          searchable
          searchValue={address.villageSearch}
          onSearchChange={address.setVillageSearch}
          onSelect={(option) => {
            const talukaOption = address.talukas.find((item) => String(item.id) === value.taluka_id);

            onChange({
              village_id: String(option.id),
              village_name: option.name,
              pincode: pickAutoPincode(option.pincode, talukaOption?.pincode),
            });
          }}
        />
      </View>

      <OnboardingTextField
        label="Pincode"
        value={value.pincode}
        onChangeText={() => undefined}
        placeholder="Auto-filled from taluka"
        keyboardType="numeric"
        maxLength={6}
        editable={false}
        leftIcon={
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"
              stroke={dashboardTheme.outline}
              strokeWidth={1.6}
            />
          </Svg>
        }
      />

      {address.loadingDistricts && address.districts.length === 0 ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={dashboardTheme.primary} />
          <Text style={styles.loadingText}>Loading districts…</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 20,
  },
  selectWrap: {
    gap: 4,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: dashboardTheme.onSurfaceVariant,
  },
});
