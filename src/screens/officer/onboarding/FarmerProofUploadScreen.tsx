import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppCard } from '../../../components/AppCard';
import { LiveEvidenceCaptureCard } from '../../../components/evidence/LiveEvidenceCaptureCard';
import type { FileAsset } from '../../../context/OnboardingContext';
import { useOnboarding } from '../../../context/OnboardingContext';
import { useLiveEvidenceCapture } from '../../../hooks/useLiveEvidenceCapture';
import type { FieldOfficerStackParamList } from '../../../navigation/types';
import { colors } from '../../../theme/colors';
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

function FileRow({
  title,
  subtitle,
  file,
  onRemove,
}: {
  title: string;
  subtitle: string;
  file: FileAsset | null;
  onRemove: () => void;
}) {
  return (
    <View style={styles.fileBlock}>
      <AppCard
        title={title}
        subtitle={file ? `${file.name}${file.size ? ` · ${formatFileSize(file.size)}` : ''}` : subtitle}
      />
      {file ? (
        <Pressable onPress={onRemove}>
          <Text style={styles.remove}>Remove</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function FarmerProofUploadScreen() {
  const navigation = useNavigation<Nav>();
  const { draft, updateDraft } = useOnboarding();
  const [error, setError] = useState<string | null>(null);
  const landProofCapture = useLiveEvidenceCapture({ defaultName: 'land-proof.jpg', allowsEditing: true });
  const farmerPhotoCapture = useLiveEvidenceCapture({ defaultName: 'farmer-photo.jpg', allowsEditing: true });

  const applyLandProof = async () => {
    const captured = await landProofCapture.captureEvidence();

    if (captured) {
      updateDraft({
        proof_of_land_ownership: toAsset(captured.uri, captured.name, captured.type),
      });
    }
  };

  const applyFarmerPhoto = async () => {
    const captured = await farmerPhotoCapture.captureEvidence();

    if (captured) {
      updateDraft({
        farmer_photo: toAsset(captured.uri, captured.name, captured.type),
      });
    }
  };

  const displayError = error ?? landProofCapture.error ?? farmerPhotoCapture.error;

  const ownership = String(draft.ownership_type ?? '').toLowerCase();
  const requiresLandProof = ownership === 'owned';

  const next = () => {
    if (requiresLandProof && !draft.proof_of_land_ownership) {
      setError('Proof of land ownership is required for owned land.');
      return;
    }

    setError(null);
    navigation.navigate('FarmerOnboardingReview');
  };
  return (
    <OnboardingFormScreen
      stepCurrent={5}
      title="Documents"
      subtitle={
        requiresLandProof
          ? 'Upload proof of land ownership and farmer photo.'
          : 'Upload farmer verification photo. Proof of land is not required for leased/rented/shared land.'
      }
      onNext={next}
      footerError={displayError}
    >
      {requiresLandProof ? (
        <>
          <FileRow
            title="Proof of land ownership"
            subtitle="Capture a live photo of the land document"
            file={draft.proof_of_land_ownership}
            onRemove={() => {
              landProofCapture.clearEvidence();
              updateDraft({ proof_of_land_ownership: null });
            }}
          />
          <LiveEvidenceCaptureCard
            evidence={landProofCapture.evidence}
            capturing={landProofCapture.capturing}
            error={landProofCapture.error}
            onOpenCamera={() => void applyLandProof()}
            onRetake={() => void applyLandProof()}
          />
        </>
      ) : null}

      <FileRow
        title="Farmer photo"
        subtitle="Live camera photo for verification"
        file={draft.farmer_photo}
        onRemove={() => {
          farmerPhotoCapture.clearEvidence();
          updateDraft({ farmer_photo: null });
        }}
      />
      <LiveEvidenceCaptureCard
        evidence={farmerPhotoCapture.evidence}
        capturing={farmerPhotoCapture.capturing}
        error={farmerPhotoCapture.error}
        onOpenCamera={() => void applyFarmerPhoto()}
        onRetake={() => void applyFarmerPhoto()}
      />

      {displayError && !requiresLandProof ? <Text style={styles.error}>{displayError}</Text> : null}
    </OnboardingFormScreen>
  );
}

const styles = StyleSheet.create({
  fileBlock: { gap: 8 },
  remove: { color: colors.error, fontWeight: '600', textAlign: 'center', paddingVertical: 4 },
  error: { color: colors.error, fontSize: 14 },
});
