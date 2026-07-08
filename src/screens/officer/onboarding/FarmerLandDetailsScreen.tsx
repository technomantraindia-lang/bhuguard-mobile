import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { LandBoundaryVerificationSection } from '../../../components/shared/LandBoundaryVerificationSection';
import { useOnboarding } from '../../../context/OnboardingContext';
import type { FieldOfficerStackParamList } from '../../../navigation/types';
import { colors } from '../../../theme/colors';
import type { AreaUnit } from '../../../utils/boundaryGeometry';
import { mappedAreaLabelForDraft } from '../../../utils/onboardingBoundary';
import { validateLandDetails } from '../../../utils/onboardingValidation';
import { FormField, OnboardingFormScreen } from './OnboardingFormScreen';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList>;

const SERVICE_OPTIONS = [
  'Biochar Production',
  'Biochar Mixing',
  'Farm Mapping',
  'Carbon Monitoring',
  'Soil Testing',
  'Advisory',
  'GPS Verification',
  'Carbon Registration',
] as const;

const PROJECT_OPTIONS = [
  'Biochar',
  'Agroforestry',
  'Regenerative Agriculture',
  'Carbon Credit',
  'Soil Health',
  'Water Conservation',
] as const;

const OWNERSHIP_OPTIONS = [
  { value: 'owned', label: 'Owned' },
  { value: 'leased', label: 'Leased' },
  { value: 'shared', label: 'Shared' },
  { value: 'government', label: 'Government' },
  { value: 'community', label: 'Community' },
  { value: 'other', label: 'Other' },
] as const;

const SOIL_OPTIONS = [
  { value: 'black_soil', label: 'Black Soil' },
  { value: 'red_soil', label: 'Red Soil' },
  { value: 'sandy_soil', label: 'Sandy Soil' },
  { value: 'clay_soil', label: 'Clay Soil' },
  { value: 'loamy_soil', label: 'Loamy Soil' },
  { value: 'alluvial_soil', label: 'Alluvial Soil' },
  { value: 'laterite_soil', label: 'Laterite Soil' },
  { value: 'mountain_soil', label: 'Mountain Soil' },
  { value: 'mixed_soil', label: 'Mixed Soil' },
  { value: 'other', label: 'Other' },
] as const;

const IRRIGATION_OPTIONS = [
  { value: 'rainfed', label: 'Rainfed' },
  { value: 'drip_irrigation', label: 'Drip Irrigation' },
  { value: 'sprinkler', label: 'Sprinkler' },
  { value: 'canal_irrigation', label: 'Canal Irrigation' },
  { value: 'borewell', label: 'Borewell' },
  { value: 'open_well', label: 'Open Well' },
  { value: 'river', label: 'River' },
  { value: 'tank', label: 'Tank' },
  { value: 'flood_irrigation', label: 'Flood Irrigation' },
  { value: 'lift_irrigation', label: 'Lift Irrigation' },
  { value: 'other', label: 'Other' },
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
    navigation.navigate('FarmerProofUpload');
  };

  return (
    <OnboardingFormScreen
      stepCurrent={4}
      title="Land Registration"
      subtitle="Farm, crop, and boundary mapping details."
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
        {(['acre', 'hectare', 'bigha'] as const).map((unit) => (
          <Pressable
            key={unit}
            style={[styles.unitChip, draft.land_area_unit === unit && styles.unitChipActive]}
            onPress={() => updateDraft({ land_area_unit: unit })}
          >
            <Text style={[styles.unitText, draft.land_area_unit === unit && styles.unitTextActive]}>
              {unit === 'acre' ? 'Acre' : unit === 'hectare' ? 'Hectare' : 'Bigha'}
            </Text>
          </Pressable>
        ))}
      </View>
      <SelectField
        label="Ownership *"
        value={draft.ownership_type}
        options={OWNERSHIP_OPTIONS}
        onChange={(ownership_type) => updateDraft({ ownership_type })}
      />
      <FormField
        label="Crop type"
        value={draft.crop_type}
        onChangeText={(v) => updateDraft({ crop_type: v })}
        placeholder="Primary crop"
      />
      <SelectField
        label="Irrigation *"
        value={draft.irrigation_type}
        options={IRRIGATION_OPTIONS}
        onChange={(irrigation_type) => updateDraft({ irrigation_type })}
      />
      <SelectField
        label="Soil Type *"
        value={draft.soil_type}
        options={SOIL_OPTIONS}
        onChange={(soil_type) => updateDraft({ soil_type })}
      />
      <FormField
        label="Existing farming practice"
        value={draft.existing_farming_practice}
        onChangeText={(v) => updateDraft({ existing_farming_practice: v })}
        placeholder="Current practices on the farm"
      />
      <View style={styles.chipGroup}>
        <Text style={styles.chipLabel}>Project Interest *</Text>
        <View style={styles.chipColumn}>
          {PROJECT_OPTIONS.map((option) => (
            <Pressable
              key={option}
              style={[styles.serviceChip, draft.project_interest.includes(option) && styles.unitChipActive]}
              onPress={() => updateDraft({ project_interest: toggleValue(draft.project_interest, option) })}
            >
              <Text style={[styles.unitText, draft.project_interest.includes(option) && styles.unitTextActive]}>
                {option}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.chipGroup}>
        <Text style={styles.chipLabel}>Service Interest *</Text>
        <View style={styles.chipColumn}>
          {SERVICE_OPTIONS.map((option) => (
            <Pressable
              key={option}
              style={[styles.serviceChip, draft.service_interests.includes(option) && styles.unitChipActive]}
              onPress={() => updateDraft({ service_interests: toggleValue(draft.service_interests, option) })}
            >
              <Text style={[styles.unitText, draft.service_interests.includes(option) && styles.unitTextActive]}>
                {option}
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

      <LandBoundaryVerificationSection
        declaredArea={draft.land_area}
        declaredUnit={(draft.land_area_unit as AreaUnit) || 'acre'}
        surveyNumber={draft.land_survey_number}
        village={draft.village_name}
        taluka={draft.taluka_name}
        district={draft.district_name}
        state={draft.state}
        mappingStatus={draft.boundary_mapping_status}
        mappedAreaLabel={mappedAreaLabelForDraft(draft) ?? undefined}
        onStartMapping={() => navigation.navigate('OnboardingBoundaryStart')}
        error={error && error.includes('mapping') ? error : null}
      />

      {error && !error.includes('mapping') ? <Text style={styles.error}>{error}</Text> : null}
    </OnboardingFormScreen>
  );
}

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View style={styles.selectGroup}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Pressable style={styles.selectButton} onPress={() => setOpen((current) => !current)}>
        <Text style={[styles.selectButtonText, !selected && styles.selectPlaceholder]}>
          {selected?.label ?? 'Select option'}
        </Text>
        <Text style={styles.selectCaret}>{open ? '^' : 'v'}</Text>
      </Pressable>
      {open ? (
        <View style={styles.optionList}>
          {options.map((option) => (
            <Pressable
              key={option.value}
              style={[styles.optionRow, option.value === value && styles.optionRowActive]}
              onPress={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <Text style={[styles.optionText, option.value === value && styles.optionTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
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
  selectGroup: { gap: 8 },
  selectButton: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  selectButtonText: { color: colors.text, fontSize: 14, flex: 1 },
  selectPlaceholder: { color: colors.textMuted },
  selectCaret: { color: colors.textMuted, fontSize: 10 },
  optionList: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  optionRow: { paddingHorizontal: 14, paddingVertical: 10 },
  optionRowActive: { backgroundColor: colors.ecoLight },
  optionText: { color: colors.textMuted, fontSize: 14 },
  optionTextActive: { color: colors.eco, fontWeight: '700' },
  error: { color: colors.error, fontSize: 14 },
});
