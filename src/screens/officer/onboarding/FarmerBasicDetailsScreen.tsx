import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';

import { OnboardingMobileField, OnboardingTextField } from '../../../components/onboarding/OnboardingFormFields';
import { OnboardingLanguageChips, OnboardingPhotoUpload } from '../../../components/onboarding/OnboardingPhotoUpload';
import { OnboardingSectionCard, OnboardingStepShell } from '../../../components/onboarding/OnboardingStepShell';
import { ONBOARDING_NEXT_LABELS } from '../../../constants/onboardingSteps';
import { useOnboarding } from '../../../context/OnboardingContext';
import type { FieldOfficerStackParamList } from '../../../navigation/types';
import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';
import { validateBasicDetails } from '../../../utils/onboardingValidation';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList>;

function PersonIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 12a4 4 0 100-8 4 4 0 000 8zM6 20v-1a6 6 0 0112 0v1"
        stroke={dashboardTheme.outline}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function FarmerBasicDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const { draft, updateDraft } = useOnboarding();
  const [error, setError] = useState<string | null>(null);

  const next = () => {
    const validationError = validateBasicDetails(draft);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    navigation.navigate('FarmerGpsCapture');
  };

  return (
    <OnboardingStepShell
      stepCurrent={1}
      title="Basic Details"
      subtitle="Farmer profile details for onboarding."
      onNext={next}
      nextLabel={ONBOARDING_NEXT_LABELS[1]}
      footerError={error}
    >
      <OnboardingSectionCard>
        <OnboardingPhotoUpload
          file={draft.farmer_photo}
          onChange={(file) => updateDraft({ farmer_photo: file })}
        />

        <OnboardingTextField
          label="Name as per Government ID"
          value={draft.farmer_name}
          onChangeText={(value) => updateDraft({ farmer_name: value })}
          placeholder="Enter name exactly as per Government ID"
          leftIcon={<PersonIcon />}
        />

        <OnboardingMobileField
          label="Mobile Number"
          value={draft.mobile}
          onChangeText={(value) => updateDraft({
            mobile: value,
            agreement_otp_verified: false,
            agreement_verification_token: '',
            agreement_verified_at: '',
            agreement_verified_mobile: '',
          })}
        />

        <OnboardingLanguageChips
          value={draft.preferred_language}
          onChange={(language) => updateDraft({ preferred_language: language })}
        />
      </OnboardingSectionCard>
    </OnboardingStepShell>
  );
}
