import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { FarmAddressValue } from '../../../hooks/useAddFarmerFarmForm';
import { useAddressCascade } from '../../../hooks/useAddressCascade';
import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';
import { FarmFormField } from './FarmFormField';
import { FarmFormSelect } from './FarmFormSelect';


interface FarmAddressFieldsProps {
  value: FarmAddressValue;
  errors?: {
    district?: string;
    taluka?: string;
    village?: string;
    state?: string;
  };
  onChange: (patch: Partial<FarmAddressValue>) => void;
}

export function FarmAddressFields({ value, errors, onChange }: FarmAddressFieldsProps) {
  const address = useAddressCascade(value.state || 'Gujarat');
  const [manualVillageText, setManualVillageText] = useState(value.villageManual ? value.village : '');

  useEffect(() => {
    if (value.districtId) {
      void address.loadTalukas(Number(value.districtId));
    }
  }, [value.districtId]);

  useEffect(() => {
    if (value.talukaId) {
      void address.loadVillages(Number(value.talukaId));
    }
  }, [value.talukaId]);

  const enableManualVillage = () => {
    setManualVillageText(value.village);
    onChange({
      villageManual: true,
      villageId: '',
      village: value.village,
    });
  };

  const enableDropdownVillage = () => {
    setManualVillageText('');
    onChange({
      villageManual: false,
      villageId: '',
      village: '',
    });
    address.setVillageSearch('');
  };

  return (
    <View style={styles.wrap}>
      <FarmFormField label="State" value={value.state || 'Gujarat'} editable={false} />

      <FarmFormSelect
        label="District"
        placeholder="Select district"
        value={value.districtId}
        displayValue={value.district || undefined}
        options={address.districts}
        loading={address.loadingDistricts}
        error={errors?.district}
        onSelect={(option) =>
          onChange({
            districtId: String(option.id),
            district: option.name,
            talukaId: '',
            taluka: '',
            villageId: '',
            village: '',
            villageManual: false,
          })
        }
      />

      <FarmFormSelect
        label="Taluka"
        placeholder={value.districtId ? 'Select taluka' : 'Select district first'}
        value={value.talukaId}
        displayValue={value.taluka || undefined}
        options={address.talukas}
        loading={address.loadingTalukas}
        error={errors?.taluka}
        disabled={!value.districtId}
        onSelect={(option) =>
          onChange({
            talukaId: String(option.id),
            taluka: option.name,
            villageId: '',
            village: '',
            villageManual: false,
          })
        }
      />

      {!value.villageManual ? (
        <>
          <FarmFormSelect
            label="Village"
            placeholder={
              value.talukaId
                ? address.loadingVillages
                  ? 'Loading villages…'
                  : address.villageCount > 0
                    ? `Select from ${address.villageCount} villages`
                    : 'Search or select village'
                : 'Select taluka first'
            }
            value={value.villageId}
            displayValue={value.village || undefined}
            options={address.villages}
            loading={address.loadingVillages}
            error={errors?.village}
            disabled={!value.talukaId}
            searchable
            searchValue={address.villageSearch}
            onSearchChange={address.setVillageSearch}
            onSelect={(option) =>
              onChange({
                villageId: String(option.id),
                village: option.name,
                villageManual: false,
              })
            }
            onCustomValue={(text) =>
              onChange({
                villageId: '',
                village: text,
                villageManual: true,
              })
            }
            customValueLabel="Use village name"
          />

          <Pressable style={styles.linkButton} onPress={enableManualVillage}>
            <Text style={styles.linkText}>Can't find your village? Type manually</Text>
          </Pressable>
        </>
      ) : (
        <>
          <FarmFormField
            label="Village (Manual Entry)"
            value={manualVillageText}
            onChangeText={(text) => {
              setManualVillageText(text);
              onChange({
                village: text,
                villageId: '',
                villageManual: true,
              });
            }}
            placeholder="Type your village name"
            error={errors?.village}
          />

          <Pressable style={styles.linkButton} onPress={enableDropdownVillage} disabled={!value.talukaId}>
            <Text style={[styles.linkText, !value.talukaId && styles.linkTextDisabled]}>
              Search from village list instead
            </Text>
          </Pressable>
        </>
      )}

      {address.loadingDistricts && address.districts.length === 0 ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={dashboardTheme.primary} />
          <Text style={styles.loadingText}>Loading Gujarat districts…</Text>
        </View>
      ) : null}

      {address.error && address.districts.length === 0 ? (
        <Pressable style={styles.retryButton} onPress={() => void address.loadDistricts()}>
          <Text style={styles.retryText}>Retry loading districts</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
  },
  linkButton: {
    alignSelf: 'flex-start',
    marginTop: -4,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    color: dashboardTheme.primaryContainer,
    textDecorationLine: 'underline',
  },
  linkTextDisabled: {
    color: dashboardTheme.textMuted,
    textDecorationLine: 'none',
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
  retryButton: {
    alignSelf: 'flex-start',
  },
  retryText: {
    fontSize: 13,
    fontWeight: '700',
    color: dashboardTheme.error,
  },
});
