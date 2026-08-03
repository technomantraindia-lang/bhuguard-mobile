import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';

import { AppCard } from '../../../components/AppCard';
import { LiveEvidenceCaptureCard } from '../../../components/evidence/LiveEvidenceCaptureCard';
import type { FileAsset } from '../../../context/OnboardingContext';
import { useOnboarding } from '../../../context/OnboardingContext';
import { useLiveEvidenceCapture } from '../../../hooks/useLiveEvidenceCapture';
import type { FieldOfficerStackParamList } from '../../../navigation/types';
import { colors } from '../../../theme/colors';
import { validateDocuments } from '../../../utils/onboardingValidation';
import { OnboardingFormScreen } from './OnboardingFormScreen';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList>;

function toAsset(uri: string, name: string, mimeType: string, size?: number): FileAsset {
  return { uri, name, mimeType, size };
}

function formatFileSize(bytes?: number): string {
  if (!bytes) {
    return '';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Evidence order is fixed per Phase 10.4: (1) Ownership Document, (2) Farm Photos
 * (multi), (3) Farmer with Farm Photo. Do not reorder these sections.
 */
export function FarmerProofUploadScreen() {
  const navigation = useNavigation<Nav>();
  const { draft, updateDraft } = useOnboarding();
  const [error, setError] = useState<string | null>(null);

  const ownershipCapture = useLiveEvidenceCapture({ defaultName: 'ownership-document.jpg', allowsEditing: false });
  const farmPhotoCapture = useLiveEvidenceCapture({ defaultName: 'farm-photo.jpg', allowsEditing: false });
  const farmerWithFarmCapture = useLiveEvidenceCapture({ defaultName: 'farmer-with-farm.jpg', allowsEditing: false });

  const captureOwnershipDocument = async () => {
    setError(null);
    const captured = await ownershipCapture.captureEvidence();
    if (captured) {
      updateDraft({ proof_of_land_ownership: toAsset(captured.uri, captured.name, captured.type) });
    }
  };

  const uploadOwnershipDocument = async () => {
    setError(null);
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/jpeg', 'image/png', 'application/pdf'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled) {
      return;
    }
    const asset = result.assets[0];
    if (!asset || (asset.size ?? 0) <= 0) {
      setError('Selected document is empty or unreadable.');
      return;
    }
    updateDraft({
      proof_of_land_ownership: toAsset(asset.uri, asset.name, asset.mimeType ?? 'application/octet-stream', asset.size),
    });
  };

  const addFarmPhoto = async () => {
    setError(null);
    const captured = await farmPhotoCapture.captureEvidence();
    if (captured) {
      updateDraft({
        farmer_documents: [...draft.farmer_documents, toAsset(captured.uri, captured.name, captured.type)],
      });
    }
  };

  const removeFarmPhoto = (index: number) => {
    updateDraft({ farmer_documents: draft.farmer_documents.filter((_, photoIndex) => photoIndex !== index) });
  };

  const captureFarmerWithFarm = async () => {
    setError(null);
    const captured = await farmerWithFarmCapture.captureEvidence();
    if (captured) {
      updateDraft({ farmer_with_farm_photo: toAsset(captured.uri, captured.name, captured.type) });
    }
  };

  const displayError = error ?? ownershipCapture.error ?? farmPhotoCapture.error ?? farmerWithFarmCapture.error;
  const farmerWithFarmPhoto = draft.farmer_with_farm_photo;

  const next = () => {
    const validationError = validateDocuments(draft);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    updateDraft({ documents_step_completed: true });
    navigation.navigate('FarmerConsent');
  };

  return (
    <OnboardingFormScreen
      stepCurrent={4}
      title="Documents"
      subtitle="Capture or upload supporting evidence in order."
      onNext={next}
      footerError={displayError}
    >
      <AppCard
        title="1. Ownership Document"
        subtitle={draft.proof_of_land_ownership ? draft.proof_of_land_ownership.name : 'Required proof of land ownership'}
      />
      <LiveEvidenceCaptureCard
        evidence={ownershipCapture.evidence}
        capturing={ownershipCapture.capturing}
        error={ownershipCapture.error}
        onOpenCamera={() => void captureOwnershipDocument()}
        onRetake={() => void captureOwnershipDocument()}
      />
      <Pressable style={styles.button} onPress={() => void captureOwnershipDocument()}>
        <Text style={styles.buttonText}>Capture Ownership Document</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={() => void uploadOwnershipDocument()}>
        <Text style={styles.buttonText}>Upload Ownership Document</Text>
      </Pressable>
      {draft.proof_of_land_ownership ? (
        <View style={styles.row}>
          <View style={styles.copy}>
            <Text style={styles.name} numberOfLines={1}>
              {draft.proof_of_land_ownership.name}
            </Text>
            <Text style={styles.meta}>
              {draft.proof_of_land_ownership.mimeType}
              {draft.proof_of_land_ownership.size ? ` · ${formatFileSize(draft.proof_of_land_ownership.size)}` : ''}
            </Text>
          </View>
          <Pressable onPress={() => updateDraft({ proof_of_land_ownership: null })}>
            <Text style={styles.remove}>Remove</Text>
          </Pressable>
        </View>
      ) : null}

      <AppCard title="2. Farm Photos" subtitle={`${draft.farmer_documents.length} photo(s) added`} />
      <LiveEvidenceCaptureCard
        evidence={farmPhotoCapture.evidence}
        capturing={farmPhotoCapture.capturing}
        error={farmPhotoCapture.error}
        onOpenCamera={() => void addFarmPhoto()}
        onRetake={() => void addFarmPhoto()}
      />
      <Pressable style={styles.button} onPress={() => void addFarmPhoto()}>
        <Text style={styles.buttonText}>Add Farm Photo</Text>
      </Pressable>

      {draft.farmer_documents.map((document, index) => (
        <View key={`${document.uri}-${index}`} style={styles.row}>
          <View style={styles.copy}>
            <Text style={styles.name} numberOfLines={1}>
              {document.name}
            </Text>
            <Text style={styles.meta}>
              {document.mimeType}
              {document.size ? ` · ${formatFileSize(document.size)}` : ''}
            </Text>
          </View>
          <Pressable onPress={() => removeFarmPhoto(index)}>
            <Text style={styles.remove}>Remove</Text>
          </Pressable>
        </View>
      ))}

      <AppCard
        title="3. Farmer with Farm Photo"
        subtitle={farmerWithFarmPhoto ? farmerWithFarmPhoto.name : 'Farmer standing on the farm (photo evidence)'}
      />
      <LiveEvidenceCaptureCard
        evidence={farmerWithFarmCapture.evidence}
        capturing={farmerWithFarmCapture.capturing}
        error={farmerWithFarmCapture.error}
        onOpenCamera={() => void captureFarmerWithFarm()}
        onRetake={() => void captureFarmerWithFarm()}
      />
      <Pressable style={styles.button} onPress={() => void captureFarmerWithFarm()}>
        <Text style={styles.buttonText}>Capture Farmer with Farm Photo</Text>
      </Pressable>
      {farmerWithFarmPhoto ? (
        <Pressable onPress={() => updateDraft({ farmer_with_farm_photo: null })}>
          <Text style={styles.remove}>Remove photo</Text>
        </Pressable>
      ) : null}
    </OnboardingFormScreen>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  buttonText: { color: colors.primary, fontWeight: '700' },
  row: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  copy: { flex: 1, gap: 2 },
  name: { color: colors.text, fontWeight: '600' },
  meta: { color: colors.textMuted, fontSize: 12 },
  remove: { color: '#B91C1C', fontWeight: '700' },
});
