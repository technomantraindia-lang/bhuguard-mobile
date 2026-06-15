import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useOnboarding } from '../../../context/OnboardingContext';
import type { FieldOfficerStackParamList } from '../../../navigation/types';
import { colors } from '../../../theme/colors';
import { validateLandDetails } from '../../../utils/onboardingValidation';
import { FormField, OnboardingFormScreen } from './OnboardingFormScreen';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList>;

const SERVICE_OPTIONS = [
  { value: 'regenerative_agriculture', label: 'Regenerative Agriculture' },
  { value: 'agro_forestry', label: 'Agro Forestry' },
  { value: 'biochar', label: 'Biochar' },
] as const;

export function FarmerLandDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const { draft, updateDraft } = useOnboarding();
  const [error, setError] = useState<string | null>(null);

  const next = () => {
    const validationError = validateLandDetails(draft);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    navigation.navigate('FarmerGpsCapture');
  };

  return (
    <OnboardingFormScreen
      stepCurrent={3}
      title="Land Registration"
      subtitle="Step 3 of 6 — Farm and crop information for the registered farmer."
      onNext={next}
    >
      <FormField
        label="Land survey number *"
        value={draft.land_survey_number}
        onChangeText={(v) => updateDraft({ land_survey_number: v })}
        placeholder="Survey / khasra number"
      />
      <FormField
        label="Land area *"
        value={draft.land_area}
        onChangeText={(v) => updateDraft({ land_area: v.replace(/[^0-9.]/g, '') })}
        placeholder="e.g. 2.5"
        keyboardType="numeric"
      />
      <View style={styles.unitRow}>
        <Text style={styles.unitLabel}>Area unit *</Text>
        {(['acre', 'hectare'] as const).map((unit) => (
          <Pressable
            key={unit}
            style={[styles.unitChip, draft.land_area_unit === unit && styles.unitChipActive]}
            onPress={() => updateDraft({ land_area_unit: unit })}
          >
            <Text style={[styles.unitText, draft.land_area_unit === unit && styles.unitTextActive]}>
              {unit === 'acre' ? 'Acre' : 'Hectare'}
            </Text>
          </Pressable>
        ))}
      </View>
      <FormField
        label="Ownership type"
        value={draft.ownership_type}
        onChangeText={(v) => updateDraft({ ownership_type: v })}
        placeholder="Owned / Leased / Shared"
      />
      <FormField
        label="Crop type"
        value={draft.crop_type}
        onChangeText={(v) => updateDraft({ crop_type: v })}
        placeholder="Primary crop"
      />
      <FormField
        label="Irrigation type"
        value={draft.irrigation_type}
        onChangeText={(v) => updateDraft({ irrigation_type: v })}
        placeholder="Drip / Flood / Rain-fed"
      />
      <FormField
        label="Soil type"
        value={draft.soil_type}
        onChangeText={(v) => updateDraft({ soil_type: v })}
        placeholder="Loam / Clay / Sandy"
      />
      <FormField
        label="Existing farming practice"
        value={draft.existing_farming_practice}
        onChangeText={(v) => updateDraft({ existing_farming_practice: v })}
        placeholder="Current practices on the farm"
      />
      <View style={styles.chipGroup}>
        <Text style={styles.chipLabel}>Project / service interest</Text>
        <View style={styles.chipColumn}>
          {SERVICE_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[styles.serviceChip, draft.service_interest === option.value && styles.unitChipActive]}
              onPress={() => updateDraft({ service_interest: option.value })}
            >
              <Text style={[styles.unitText, draft.service_interest === option.value && styles.unitTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <FormField
        label="Remarks (optional)"
        value={draft.remarks}
        onChangeText={(v) => updateDraft({ remarks: v })}
        placeholder="Additional land notes"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </OnboardingFormScreen>
  );
}

const styles = StyleSheet.create({
  unitRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  unitLabel: { fontSize: 14, fontWeight: '600', color: colors.text, width: '100%' },
  unitChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  unitChipActive: { backgroundColor: colors.ecoLight, borderColor: colors.eco },
  unitText: { color: colors.textMuted, textTransform: 'capitalize' },
  unitTextActive: { color: colors.eco, fontWeight: '700' },
  chipGroup: { gap: 8 },
  chipLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  chipColumn: { gap: 8 },
  serviceChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.surface,
  },
  error: { color: colors.error, fontSize: 14 },
});
