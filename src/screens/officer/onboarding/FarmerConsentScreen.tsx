import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import { OnboardingConsentLayout } from '../../../components/onboarding/OnboardingConsentLayout';
import {
  OnboardingSignatureCheckbox,
  OnboardingToggleSwitch,
} from '../../../components/onboarding/OnboardingConsentControls';
import { OnboardingDocumentUploadCard } from '../../../components/onboarding/OnboardingDocumentUploadCard';
import { ONBOARDING_NEXT_LABELS } from '../../../constants/onboardingSteps';
import type { FileAsset } from '../../../context/OnboardingContext';
import { useOnboarding } from '../../../context/OnboardingContext';
import type { FieldOfficerStackParamList } from '../../../navigation/types';
import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';
import { validateConsent } from '../../../utils/onboardingValidation';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList>;

const MAX_FILE_BYTES = 5 * 1024 * 1024;

function toAsset(uri: string, name: string, mimeType: string, size?: number): FileAsset {
  return { uri, name, mimeType, size };
}

export function FarmerConsentScreen() {
  const navigation = useNavigation<Nav>();
  const { draft, updateDraft } = useOnboarding();
  const [error, setError] = useState<string | null>(null);

  const pickConsentForm = async () => {
    setError(null);

    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets[0]) {
      const gallery = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
      });

      if (gallery.canceled || !gallery.assets[0]) {
        return;
      }

      const asset = gallery.assets[0];

      if (asset.fileSize && asset.fileSize > MAX_FILE_BYTES) {
        setError('Consent document must be 5MB or smaller.');
        return;
      }

      updateDraft({
        consent_form: toAsset(
          asset.uri,
          asset.fileName ?? 'consent.jpg',
          asset.mimeType ?? 'image/jpeg',
          asset.fileSize,
        ),
      });

      return;
    }

    const asset = result.assets[0];

    if (asset.size && asset.size > MAX_FILE_BYTES) {
      setError('Consent document must be 5MB or smaller.');
      return;
    }

    updateDraft({
      consent_form: toAsset(
        asset.uri,
        asset.name ?? 'consent.pdf',
        asset.mimeType ?? 'application/pdf',
        asset.size,
      ),
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

  return (
    <OnboardingConsentLayout
      stepCurrent={2}
      progressLabel="Step 2: Legal Agreements"
      onNext={next}
      nextLabel={ONBOARDING_NEXT_LABELS[2]}
      footerError={error}
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

      <OnboardingDocumentUploadCard
        title="Consent Form Upload"
        file={draft.consent_form}
        onPress={pickConsentForm}
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
