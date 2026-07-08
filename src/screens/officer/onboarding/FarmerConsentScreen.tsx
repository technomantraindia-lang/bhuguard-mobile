import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { OnboardingConsentLayout } from '../../../components/onboarding/OnboardingConsentLayout';
import {
  OnboardingSignatureCheckbox,
  OnboardingToggleSwitch,
} from '../../../components/onboarding/OnboardingConsentControls';
import { LiveEvidenceCaptureCard } from '../../../components/evidence/LiveEvidenceCaptureCard';
import { ONBOARDING_NEXT_LABELS } from '../../../constants/onboardingSteps';
import type { FileAsset } from '../../../context/OnboardingContext';
import { useOnboarding } from '../../../context/OnboardingContext';
import { useLiveEvidenceCapture } from '../../../hooks/useLiveEvidenceCapture';
import type { FieldOfficerStackParamList } from '../../../navigation/types';
import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';
import { validateConsent } from '../../../utils/onboardingValidation';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList>;

function toAsset(uri: string, name: string, mimeType: string, size?: number): FileAsset {
  return { uri, name, mimeType, size };
}

export function FarmerConsentScreen() {
  const navigation = useNavigation<Nav>();
  const { draft, updateDraft } = useOnboarding();
  const [error, setError] = useState<string | null>(null);
  const consentCapture = useLiveEvidenceCapture({ defaultName: 'consent-form.jpg', allowsEditing: true });

  const captureConsentForm = async () => {
    setError(null);
    const captured = await consentCapture.captureEvidence();

    if (!captured) {
      return;
    }

    if (captured.name.length > 200) {
      setError('Consent document filename is too long.');
      return;
    }

    updateDraft({
      consent_form: toAsset(captured.uri, captured.name, captured.type),
    });
  };

  const next = () => {
    const validationError = validateConsent(draft);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    navigation.navigate('FarmerLandDetails');
  };

  const displayError = error ?? consentCapture.error;

  return (
    <OnboardingConsentLayout
      stepCurrent={3}
      progressLabel="Step 3: Consent & Legal"
      onNext={next}
      nextLabel={ONBOARDING_NEXT_LABELS[2]}
      footerError={displayError}
    >
      <View style={styles.toggles}>
        <OnboardingToggleSwitch
          title="Data Usage Consent"
          description="Allows Bhuguard to process land and yield data for MRV calculations."
          value={draft.data_usage_consent}
          onValueChange={(value) => updateDraft({ data_usage_consent: value })}
        />
        <OnboardingToggleSwitch
          title="Carbon Rights Assignment"
          description="Transfers generated carbon credits to the project developer."
          value={draft.carbon_rights_consent}
          onValueChange={(value) => updateDraft({ carbon_rights_consent: value })}
        />
        <OnboardingToggleSwitch
          title="Project Participation Consent"
          description="Agrees to longitudinal monitoring and auditing procedures."
          value={draft.project_participation_consent}
          onValueChange={(value) => updateDraft({ project_participation_consent: value })}
        />
      </View>

      <View style={styles.divider} />

      <LiveEvidenceCaptureCard
        evidence={consentCapture.evidence}
        capturing={consentCapture.capturing}
        error={consentCapture.error}
        onOpenCamera={() => void captureConsentForm()}
        onRetake={() => void captureConsentForm()}
      />

      <OnboardingSignatureCheckbox
        label="I confirm that the farmer has read and signed the legal agreements."
        checked={draft.farmer_signature_confirmed}
        onToggle={() => updateDraft({ farmer_signature_confirmed: !draft.farmer_signature_confirmed })}
      />
    </OnboardingConsentLayout>
  );
}

const styles = StyleSheet.create({
  toggles: {
    gap: 16,
  },
  divider: {
    height: 1,
    backgroundColor: `${dashboardTheme.outlineVariant}80`,
  },
});
