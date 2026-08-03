import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { LandBoundaryVerificationSection } from '../../../components/shared/LandBoundaryVerificationSection';
import { ONBOARDING_NEXT_LABELS } from '../../../constants/onboardingSteps';
import { useOnboarding } from '../../../context/OnboardingContext';
import { continueFarmerOnboardingAfterLandMapping } from '../../../navigation/continueFarmerOnboarding';
import type { FieldOfficerStackParamList } from '../../../navigation/types';
import { colors } from '../../../theme/colors';
import type { AreaUnit } from '../../../utils/boundaryGeometry';
import { mappedAreaLabelForDraft } from '../../../utils/onboardingBoundary';
import { validateBoundaryMapping, validateLandDetails } from '../../../utils/onboardingValidation';
import { defaultFarmName } from '../../../utils/displayIds';
import { ensureOnboardingFarmerFarm } from '../../../utils/ensureOnboardingFarmerFarm';
import { FormField, OnboardingFormScreen } from './OnboardingFormScreen';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList>;

const OWNERSHIP_OPTIONS = [
  { value: 'owned', label: 'Owned' },
  { value: 'leased', label: 'Leased' },
  { value: 'shared', label: 'Shared' },
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

const AGRI_BIO_WASTE_OPTIONS = [
  'Crop residue',
  'Cotton stalk',
  'Paddy/wheat straw',
  'Sugarcane trash',
  'Husk/shell waste',
  'Pruning/plantation waste',
] as const;

/** Existing Agri Bio-Waste selections are stored as a comma-separated string in
 * `existing_farming_practice` for backend compatibility (no schema change). */
function parseAgriBioWaste(value: string): { selected: string[]; otherText: string } {
  const tokens = value
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);

  const selected: string[] = [];
  const rest: string[] = [];

  tokens.forEach((token) => {
    const match = AGRI_BIO_WASTE_OPTIONS.find((option) => option.toLowerCase() === token.toLowerCase());
    if (match) {
      if (!selected.includes(match)) {
        selected.push(match);
      }
    } else {
      rest.push(token);
    }
  });

  return { selected, otherText: rest.join(', ') };
}

function serializeAgriBioWaste(selected: string[], otherEnabled: boolean, otherText: string): string {
  const parts = [...selected];
  if (otherEnabled && otherText.trim()) {
    parts.push(otherText.trim());
  }
  return parts.join(', ');
}

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
  const { draft, result, updateDraft, toFormData } = useOnboarding();
  const [error, setError] = useState<string | null>(null);
  const continuingRef = useRef(false);
  const bioWasteParsed = useMemo(
    () => parseAgriBioWaste(draft.existing_farming_practice),
    [draft.existing_farming_practice],
  );
  const [otherBioWasteOpen, setOtherBioWasteOpen] = useState(
    () => parseAgriBioWaste(draft.existing_farming_practice).otherText.length > 0,
  );

  useEffect(() => {
    if (!draft.farm_name.trim() && draft.farmer_name.trim()) {
      updateDraft({ farm_name: defaultFarmName(draft.farmer_name, 1) });
    }
    // Seed once when name is available; avoid fighting user edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.farmer_name]);

  const applyBiocharServiceInterest = () => ({
    service_interests: ['Biochar'] as string[],
    service_interest: 'Biochar',
    project_interest: ['Biochar'] as string[],
  });

  const ensureFarmThenContinue = async (
    draftAfter: typeof draft,
    mappingStatus: 'pending' | 'completed',
  ) => {
    const ensured = await ensureOnboardingFarmerFarm(draftAfter, toFormData);
    if (ensured.status !== 'ready') {
      continuingRef.current = false;
      setError(ensured.message);
      return;
    }

    updateDraft({
      farmer_id: ensured.ids.farmerId,
      farm_id: ensured.ids.farmId,
      farmer_code: ensured.ids.farmerCode ?? '',
      farm_code: ensured.ids.farmCode ?? '',
      farm_name: ensured.ids.farmName ?? draftAfter.farm_name,
    });

    const withIds = {
      ...draftAfter,
      farmer_id: ensured.ids.farmerId,
      farm_id: ensured.ids.farmId,
      farmer_code: ensured.ids.farmerCode ?? '',
      farm_code: ensured.ids.farmCode ?? '',
      farm_name: ensured.ids.farmName ?? draftAfter.farm_name,
    };

    continueFarmerOnboardingAfterLandMapping(navigation, withIds, result, {
      farmerId: ensured.ids.farmerId,
      farmId: ensured.ids.farmId,
      farmerName: ensured.ids.farmerName,
      farmName: ensured.ids.farmName ?? undefined,
      farmCode: ensured.ids.farmCode ?? undefined,
      farmerCode: ensured.ids.farmerCode ?? undefined,
      village: draftAfter.village_name || undefined,
      mappingStatus,
    });
  };

  const skipMapping = () => {
    if (continuingRef.current) {
      return;
    }

    const skipPatch = {
      boundary_mapping_status: 'pending' as const,
      boundary_points: [] as typeof draft.boundary_points,
      gps_latitude: '',
      gps_longitude: '',
      gps_accuracy: '',
      gps_captured_at: '',
      boundary_pending_reason: 'Skipped during onboarding',
      ...applyBiocharServiceInterest(),
    };

    const draftAfterSkip = { ...draft, ...skipPatch };
    const landError = validateLandDetails(draftAfterSkip);
    if (landError) {
      updateDraft(skipPatch);
      setError(landError);
      return;
    }

    continuingRef.current = true;
    updateDraft(skipPatch);
    setError(null);
    void ensureFarmThenContinue(draftAfterSkip, 'pending').finally(() => {
      continuingRef.current = false;
    });
  };

  const next = () => {
    if (continuingRef.current) {
      return;
    }

    const servicePatch = applyBiocharServiceInterest();
    updateDraft(servicePatch);

    const draftWithService = {
      ...draft,
      ...servicePatch,
    };

    const landError = validateLandDetails(draftWithService);
    if (landError) {
      setError(landError);
      return;
    }

    const status = draft.boundary_mapping_status;
    if (status !== 'mapped' && status !== 'pending_review' && status !== 'pending') {
      setError('Start Mobile Mapping or tap Skip for Now to continue.');
      return;
    }

    const mappingError = validateBoundaryMapping(draftWithService);
    if (mappingError) {
      setError(mappingError);
      return;
    }

    continuingRef.current = true;
    setError(null);
    void ensureFarmThenContinue(
      draftWithService,
      status === 'pending' ? 'pending' : 'completed',
    ).finally(() => {
      continuingRef.current = false;
    });
  };

  const toggleBioWasteOption = (option: string) => {
    const { selected, otherText } = bioWasteParsed;
    const nextSelected = selected.includes(option)
      ? selected.filter((item) => item !== option)
      : [...selected, option];
    updateDraft({ existing_farming_practice: serializeAgriBioWaste(nextSelected, otherBioWasteOpen, otherText) });
  };

  const toggleBioWasteOther = () => {
    const { selected, otherText } = bioWasteParsed;
    if (otherBioWasteOpen) {
      setOtherBioWasteOpen(false);
      updateDraft({ existing_farming_practice: serializeAgriBioWaste(selected, false, '') });
    } else {
      setOtherBioWasteOpen(true);
      updateDraft({ existing_farming_practice: serializeAgriBioWaste(selected, true, otherText) });
    }
  };

  const handleBioWasteOtherText = (text: string) => {
    updateDraft({ existing_farming_practice: serializeAgriBioWaste(bioWasteParsed.selected, true, text) });
  };

  return (
    <OnboardingFormScreen
      stepCurrent={3}
      title="Land Registration"
      subtitle="Farm, crop, and boundary mapping details."
      onNext={next}
      nextLabel={ONBOARDING_NEXT_LABELS[4]}
    >
      <FormField
        label="Land survey number / Khasra Number *"
        value={draft.land_survey_number}
        onChangeText={(v) => updateDraft({ land_survey_number: v })}
        placeholder="Survey / khasra number"
      />
      <FormField
        label="Farm Name *"
        value={draft.farm_name}
        onChangeText={(v) => updateDraft({ farm_name: v })}
        placeholder={defaultFarmName(draft.farmer_name || 'Farmer', 1)}
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
        onChange={(ownership_type) =>
          updateDraft({
            ownership_type,
            documents_step_completed: false,
            ...(ownership_type !== 'other' ? { ownership_other_detail: '' } : null),
          })
        }
      />
      {draft.ownership_type === 'other' ? (
        <FormField
          label="Ownership details (Other) *"
          value={draft.ownership_other_detail}
          onChangeText={(v) => updateDraft({ ownership_other_detail: v })}
          placeholder="Describe ownership type"
        />
      ) : null}
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
      <View style={styles.chipGroup}>
        <Text style={styles.chipLabel}>Service Interest *</Text>
        <View style={[styles.serviceChip, styles.unitChipActive]}>
          <Text style={[styles.unitText, styles.unitTextActive]}>Biochar</Text>
        </View>
      </View>
      <View style={styles.chipGroup}>
        <Text style={styles.chipLabel}>Existing Agri Bio-Waste</Text>
        <View style={styles.multiSelectWrap}>
          {AGRI_BIO_WASTE_OPTIONS.map((option) => {
            const active = bioWasteParsed.selected.includes(option);
            return (
              <Pressable
                key={option}
                style={[styles.multiSelectChip, active && styles.unitChipActive]}
                onPress={() => toggleBioWasteOption(option)}
              >
                <Text style={[styles.unitText, active && styles.unitTextActive]}>{option}</Text>
              </Pressable>
            );
          })}
          <Pressable
            style={[styles.multiSelectChip, otherBioWasteOpen && styles.unitChipActive]}
            onPress={toggleBioWasteOther}
          >
            <Text style={[styles.unitText, otherBioWasteOpen && styles.unitTextActive]}>Other</Text>
          </Pressable>
        </View>
        {otherBioWasteOpen ? (
          <FormField
            label="Other bio-waste (specify) *"
            value={bioWasteParsed.otherText}
            onChangeText={handleBioWasteOtherText}
            placeholder="Describe other bio-waste"
          />
        ) : null}
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
        onSkipMapping={skipMapping}
        error={error && (error.includes('mapping') || error.includes('Mapping') || error.includes('Skip')) ? error : null}
      />

      {error && !error.includes('mapping') && !error.includes('Mapping') && !error.includes('Skip') ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}
    </OnboardingFormScreen>
  );
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
  multiSelectWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  multiSelectChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
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
