import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';

import { LiveEvidenceCaptureCard } from '../../../components/evidence/LiveEvidenceCaptureCard';
import { ONBOARDING_NEXT_LABELS } from '../../../constants/onboardingSteps';
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

function isImageAsset(asset: FileAsset): boolean {
  return asset.mimeType.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(asset.name);
}

/**
 * Evidence order is fixed: (1) Ownership Document, (2) Farm Photos (multi),
 * (3) Farmer with Farm Photo. One capture card per evidence type — no duplicate actions.
 */
export function FarmerProofUploadScreen() {
  const navigation = useNavigation<Nav>();
  const { draft, updateDraft } = useOnboarding();
  const [error, setError] = useState<string | null>(null);

  const ownershipCapture = useLiveEvidenceCapture({ defaultName: 'ownership-document.jpg', allowsEditing: false });
  const farmPhotoCapture = useLiveEvidenceCapture({ defaultName: 'farm-photo.jpg', allowsEditing: false });
  const farmerWithFarmCapture = useLiveEvidenceCapture({ defaultName: 'farmer-with-farm.jpg', allowsEditing: false });

  const canContinue = useMemo(() => validateDocuments(draft) === null, [draft]);

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
    ownershipCapture.clearEvidence();
    updateDraft({
      proof_of_land_ownership: toAsset(asset.uri, asset.name, asset.mimeType ?? 'application/octet-stream', asset.size),
    });
  };

  const removeOwnershipDocument = () => {
    ownershipCapture.clearEvidence();
    updateDraft({ proof_of_land_ownership: null });
  };

  const addFarmPhoto = async () => {
    setError(null);
    const captured = await farmPhotoCapture.captureEvidence();
    if (captured) {
      updateDraft({
        farmer_documents: [...draft.farmer_documents, toAsset(captured.uri, captured.name, captured.type)],
      });
      farmPhotoCapture.clearEvidence();
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

  const removeFarmerWithFarm = () => {
    farmerWithFarmCapture.clearEvidence();
    updateDraft({ farmer_with_farm_photo: null });
  };

  const displayError = error ?? ownershipCapture.error ?? farmPhotoCapture.error ?? farmerWithFarmCapture.error;
  const uploadedOwnership =
    draft.proof_of_land_ownership && !ownershipCapture.evidence
      ? draft.proof_of_land_ownership
      : null;
  const farmerWithFarmPhoto = draft.farmer_with_farm_photo;

  const next = () => {
    const validationError = validateDocuments(draft);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    updateDraft({ documents_step_completed: true });
    navigation.navigate('OnboardingBoundaryStart');
  };

  return (
    <OnboardingFormScreen
      stepCurrent={6}
      title="Documents & Evidence"
      subtitle="Capture supporting evidence in order."
      onNext={next}
      nextLabel={ONBOARDING_NEXT_LABELS[6]}
      nextDisabled={!canContinue}
      footerError={displayError}
    >
      <Text style={styles.sectionTitle}>1. Ownership Document</Text>
      {uploadedOwnership ? (
        <View style={styles.uploadedCard}>
          {isImageAsset(uploadedOwnership) ? (
            <Image source={{ uri: uploadedOwnership.uri }} style={styles.uploadedPreview} resizeMode="contain" />
          ) : null}
          <Text style={styles.uploadedName} numberOfLines={2}>
            {uploadedOwnership.name}
          </Text>
          <Text style={styles.uploadedMeta}>
            {uploadedOwnership.mimeType}
            {uploadedOwnership.size ? ` · ${formatFileSize(uploadedOwnership.size)}` : ''}
          </Text>
          <View style={styles.uploadedActions}>
            <Pressable style={styles.secondaryAction} onPress={() => void captureOwnershipDocument()}>
              <Text style={styles.secondaryActionText}>Capture Ownership Document</Text>
            </Pressable>
            <Pressable onPress={removeOwnershipDocument}>
              <Text style={styles.remove}>Remove Photo</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <LiveEvidenceCaptureCard
          title="Capture Ownership Document"
          subtitle="Take a real-time photo of the ownership document"
          captureLabel="Capture Ownership Document"
          emptyPlaceholderText="No ownership document captured yet"
          evidence={ownershipCapture.evidence}
          capturing={ownershipCapture.capturing}
          error={ownershipCapture.error}
          onOpenCamera={() => void captureOwnershipDocument()}
          onRetake={() => void captureOwnershipDocument()}
          onRemove={removeOwnershipDocument}
          showUploadButton
          uploadLabel="Upload Ownership Document"
          onUpload={() => void uploadOwnershipDocument()}
        />
      )}

      <Text style={styles.sectionTitle}>2. Farm Photos</Text>
      {draft.farmer_documents.map((document, index) => (
        <View key={`${document.uri}-${index}`} style={styles.farmPhotoCard}>
          {isImageAsset(document) ? (
            <Image source={{ uri: document.uri }} style={styles.farmPhotoPreview} resizeMode="contain" />
          ) : null}
          <View style={styles.farmPhotoCopy}>
            <Text style={styles.farmPhotoTitle}>Farm Photo {index + 1}</Text>
            <Text style={styles.uploadedMeta} numberOfLines={1}>
              {document.name}
            </Text>
          </View>
          <Pressable onPress={() => removeFarmPhoto(index)}>
            <Text style={styles.remove}>Remove</Text>
          </Pressable>
        </View>
      ))}
      <LiveEvidenceCaptureCard
        title="Capture Farm Photo"
        subtitle="Take a real-time photo of the farm"
        captureLabel={draft.farmer_documents.length > 0 ? 'Add Another Farm Photo' : 'Capture Farm Photo'}
        emptyPlaceholderText="No farm photo captured yet"
        evidence={farmPhotoCapture.evidence}
        capturing={farmPhotoCapture.capturing}
        error={farmPhotoCapture.error}
        onOpenCamera={() => void addFarmPhoto()}
        onRetake={() => void addFarmPhoto()}
      />

      <Text style={styles.sectionTitle}>3. Farmer with Farm Photo</Text>
      {farmerWithFarmPhoto && !farmerWithFarmCapture.evidence ? (
        <View style={styles.uploadedCard}>
          {isImageAsset(farmerWithFarmPhoto) ? (
            <Image source={{ uri: farmerWithFarmPhoto.uri }} style={styles.uploadedPreview} resizeMode="contain" />
          ) : null}
          <Text style={styles.uploadedName} numberOfLines={2}>
            {farmerWithFarmPhoto.name}
          </Text>
          <View style={styles.uploadedActions}>
            <Pressable style={styles.secondaryAction} onPress={() => void captureFarmerWithFarm()}>
              <Text style={styles.secondaryActionText}>Retake Photo</Text>
            </Pressable>
            <Pressable onPress={removeFarmerWithFarm}>
              <Text style={styles.remove}>Remove Photo</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <LiveEvidenceCaptureCard
          title="Capture Farmer with Farm Photo"
          subtitle="Take a real-time photo of the farmer at the farm"
          captureLabel="Capture Farmer with Farm Photo"
          emptyPlaceholderText="No farmer with farm photo captured yet"
          evidence={farmerWithFarmCapture.evidence}
          capturing={farmerWithFarmCapture.capturing}
          error={farmerWithFarmCapture.error}
          onOpenCamera={() => void captureFarmerWithFarm()}
          onRetake={() => void captureFarmerWithFarm()}
          onRemove={removeFarmerWithFarm}
        />
      )}
    </OnboardingFormScreen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  uploadedCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },
  uploadedPreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  uploadedName: { color: colors.text, fontWeight: '600' },
  uploadedMeta: { color: colors.textMuted, fontSize: 12 },
  uploadedActions: { gap: 10, marginTop: 4 },
  secondaryAction: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  secondaryActionText: { color: colors.primary, fontWeight: '700' },
  farmPhotoCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
  },
  farmPhotoPreview: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  farmPhotoCopy: { flex: 1, gap: 2 },
  farmPhotoTitle: { color: colors.text, fontWeight: '700' },
  remove: { color: '#B91C1C', fontWeight: '700' },
});
