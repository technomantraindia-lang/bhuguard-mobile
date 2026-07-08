import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { createFarmerOnboarding } from '../../../api/fieldOfficerApi';
import { getApiErrorMessage } from '../../../api/authApi';
import { AppCard } from '../../../components/AppCard';
import { OnboardingReviewPhoto } from '../../../components/onboarding/OnboardingReviewPhoto';
import { useOnboarding, type OnboardingResult } from '../../../context/OnboardingContext';
import type { FieldOfficerStackParamList } from '../../../navigation/types';
import { colors } from '../../../theme/colors';
import { validateSubmit } from '../../../utils/onboardingValidation';
import { OnboardingFormScreen } from './OnboardingFormScreen';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList>;

type EditScreen =
  | 'FarmerBasicDetails'
  | 'FarmerConsent'
  | 'FarmerLandDetails'
  | 'FarmerGpsCapture'
  | 'FarmerProofUpload';

const OPTION_LABELS: Record<string, string> = {
  owned: 'Owned',
  leased: 'Leased',
  shared: 'Shared',
  government: 'Government',
  community: 'Community',
  other: 'Other',
  black_soil: 'Black Soil',
  red_soil: 'Red Soil',
  sandy_soil: 'Sandy Soil',
  clay_soil: 'Clay Soil',
  loamy_soil: 'Loamy Soil',
  alluvial_soil: 'Alluvial Soil',
  laterite_soil: 'Laterite Soil',
  mountain_soil: 'Mountain Soil',
  mixed_soil: 'Mixed Soil',
  rainfed: 'Rainfed',
  drip_irrigation: 'Drip Irrigation',
  sprinkler: 'Sprinkler',
  canal_irrigation: 'Canal Irrigation',
  borewell: 'Borewell',
  open_well: 'Open Well',
  river: 'River',
  tank: 'Tank',
  flood_irrigation: 'Flood Irrigation',
  lift_irrigation: 'Lift Irrigation',
};

export function FarmerOnboardingReviewScreen() {
  const navigation = useNavigation<Nav>();
  const { draft, toFormData, setResult } = useOnboarding();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const validationError = validateSubmit(draft);

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const farmer = await createFarmerOnboarding(toFormData());
      const result: OnboardingResult = {
        farmer_id: Number(farmer.farmer_id),
        farmer_name: String(farmer.farmer_name ?? draft.farmer_name),
        mobile: String(farmer.mobile ?? draft.mobile),
        village: farmer.village ? String(farmer.village) : draft.village_name,
        taluka: farmer.taluka ? String(farmer.taluka) : draft.taluka_name,
        district: farmer.district ? String(farmer.district) : draft.district_name,
        state: farmer.state ? String(farmer.state) : draft.state,
        onboarded_at: farmer.onboarded_at ? String(farmer.onboarded_at) : undefined,
        photo_url: farmer.photo_url ? String(farmer.photo_url) : undefined,
        farm_id: farmer.farm_id ? Number(farmer.farm_id) : undefined,
        land_survey_number: farmer.land_survey_number ? String(farmer.land_survey_number) : draft.land_survey_number,
        land_area: farmer.land_area != null ? String(farmer.land_area) : draft.land_area,
        land_area_unit: farmer.land_area_unit ? String(farmer.land_area_unit) : draft.land_area_unit,
      };
      setResult(result);
      navigation.navigate('FarmerOnboardingSuccess');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Onboarding failed. Check required fields and try again.'));
    } finally {
      setLoading(false);
    }
  };

  const edit = (screen: EditScreen) => {
    navigation.navigate(screen);
  };

  return (
    <OnboardingFormScreen
      stepCurrent={6}
      title="Final Review"
      subtitle="Confirm all farmer details before submitting the registration."
      onNext={submit}
      nextLabel="Submit Registration"
      nextLoading={loading}
      footerError={error}
    >
      <ReviewSection title="Farmer profile" onEdit={() => edit('FarmerBasicDetails')}>
        <OnboardingReviewPhoto file={draft.farmer_photo} />
        <Line label="Name" value={draft.farmer_name} />
        <Line label="Mobile" value={draft.mobile} />
        <Line label="Username" value={draft.username} />
        <Line label="Language" value={draft.preferred_language} />
        <Line label="State" value={draft.state} />
        <Line label="District" value={draft.district_name} />
        <Line label="Taluka" value={draft.taluka_name} />
        <Line label="Village" value={draft.village_name} />
        <Line label="Pincode" value={draft.pincode} />
      </ReviewSection>
      <ReviewSection title="Consent" onEdit={() => edit('FarmerConsent')}>
        <Line label="Data usage" value={draft.data_usage_consent ? 'Accepted' : 'Pending'} />
        <Line label="Carbon rights" value={draft.carbon_rights_consent ? 'Accepted' : 'Pending'} />
        <Line label="Participation" value={draft.project_participation_consent ? 'Accepted' : 'Pending'} />
        <Line label="Signature confirmed" value={draft.farmer_signature_confirmed ? 'Yes' : 'No'} />
        <Line label="Consent form" value={draft.consent_form?.name} />
      </ReviewSection>
      <ReviewSection title="Land details" onEdit={() => edit('FarmerLandDetails')}>
        <Line label="Survey no." value={draft.land_survey_number} />
        <Line label="Area" value={`${draft.land_area} ${draft.land_area_unit}`} />
        <Line label="Ownership" value={OPTION_LABELS[draft.ownership_type] ?? draft.ownership_type} />
        <Line label="Crop" value={draft.crop_type} />
        <Line label="Irrigation" value={OPTION_LABELS[draft.irrigation_type] ?? draft.irrigation_type} />
        <Line label="Soil" value={OPTION_LABELS[draft.soil_type] ?? draft.soil_type} />
        <Line label="Farming practice" value={draft.existing_farming_practice} />
        <Line label="Project interest" value={draft.project_interest.join(', ')} />
        <Line label="Service interest" value={draft.service_interests.join(', ')} />
        <Line label="Remarks" value={draft.remarks} />
      </ReviewSection>
      <ReviewSection title="GPS" onEdit={() => edit('FarmerGpsCapture')}>
        <Line label="Coordinates" value={`${draft.gps_latitude}, ${draft.gps_longitude}`} />
        <Line label="Accuracy" value={draft.gps_accuracy ? `${draft.gps_accuracy} m` : undefined} />
        <Line label="Captured at" value={draft.gps_captured_at} />
      </ReviewSection>
      <ReviewSection title="Documents" onEdit={() => edit('FarmerProofUpload')}>
        <Line label="Land proof" value={draft.proof_of_land_ownership?.name} />
        <Line label="Consent" value={draft.consent_form?.name} />
      </ReviewSection>
    </OnboardingFormScreen>
  );
}

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <AppCard
      title={title}
      footer={
        <Pressable onPress={onEdit}>
          <Text style={styles.edit}>Edit {title.toLowerCase()}</Text>
        </Pressable>
      }
    >
      {children}
    </AppCard>
  );
}

function Line({ label, value }: { label: string; value?: string }) {
  return (
    <Text style={styles.line}>
      {label}: {value?.trim() ? value : '-'}
    </Text>
  );
}

const styles = StyleSheet.create({
  line: { fontSize: 14, color: colors.text, marginTop: 4 },
  edit: { color: colors.primary, fontWeight: '700', marginTop: 4 },
  error: { color: colors.error, fontSize: 14 },
});
