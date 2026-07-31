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

export function FarmerProofUploadScreen() {
  const navigation = useNavigation<Nav>();
  const { draft, updateDraft } = useOnboarding();
  const [error, setError] = useState<string | null>(null);
  const documentCapture = useLiveEvidenceCapture({ defaultName: 'farmer-document.jpg', allowsEditing: false });
  const farmerPhotoCapture = useLiveEvidenceCapture({ defaultName: 'farmer-photo.jpg', allowsEditing: false });

  const addDocument = (file: FileAsset) => {
    const nextDocuments = [...draft.farmer_documents, file];
    updateDraft({
      farmer_documents: nextDocuments,
      proof_of_land_ownership: draft.proof_of_land_ownership ?? file,
    });
  };

  const captureDocument = async () => {
    setError(null);
    const captured = await documentCapture.captureEvidence();
    if (captured) {
      addDocument(toAsset(captured.uri, captured.name, captured.type));
    }
  };

  const uploadDocument = async () => {
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
    addDocument(toAsset(asset.uri, asset.name, asset.mimeType ?? 'application/octet-stream', asset.size));
  };

  const removeDocument = (index: number) => {
    const documents = draft.farmer_documents.filter((_, documentIndex) => documentIndex !== index);
    updateDraft({
      farmer_documents: documents,
      proof_of_land_ownership: documents[0] ?? null,
    });
  };

  const applyFarmerPhoto = async () => {
    const captured = await farmerPhotoCapture.captureEvidence();
    if (captured) {
      updateDraft({
        farmer_photo: toAsset(captured.uri, captured.name, captured.type),
      });
    }
  };

  const displayError = error ?? documentCapture.error ?? farmerPhotoCapture.error;

  const next = () => {
    const validationError = validateDocuments(draft);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    updateDraft({ documents_step_completed: true });
    navigation.navigate('FarmerOnboardingReview');
  };

  return (
    <OnboardingFormScreen
      stepCurrent={5}
      title="Documents"
      subtitle="Capture or upload supporting documents. Multiple files are allowed."
      onNext={next}
      footerError={displayError}
    >
      <AppCard title="Documents" subtitle={`${draft.farmer_documents.length} document(s) selected`} />

      <LiveEvidenceCaptureCard
        evidence={documentCapture.evidence}
        capturing={documentCapture.capturing}
        error={documentCapture.error}
        onOpenCamera={() => void captureDocument()}
        onRetake={() => void captureDocument()}
      />

      <Pressable style={styles.button} onPress={() => void captureDocument()}>
        <Text style={styles.buttonText}>Capture Document</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={() => void uploadDocument()}>
        <Text style={styles.buttonText}>Upload Document</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={() => void captureDocument()}>
        <Text style={styles.buttonText}>Add Another Document</Text>
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
          <Pressable onPress={() => removeDocument(index)}>
            <Text style={styles.remove}>Remove</Text>
          </Pressable>
        </View>
      ))}

      <AppCard
        title="Farmer photo"
        subtitle={draft.farmer_photo ? draft.farmer_photo.name : 'Optional farmer verification photo'}
      />
      <LiveEvidenceCaptureCard
        evidence={farmerPhotoCapture.evidence}
        capturing={farmerPhotoCapture.capturing}
        error={farmerPhotoCapture.error}
        onOpenCamera={() => void applyFarmerPhoto()}
        onRetake={() => void applyFarmerPhoto()}
      />
      {draft.farmer_photo ? (
        <Pressable onPress={() => updateDraft({ farmer_photo: null })}>
          <Text style={styles.remove}>Remove farmer photo</Text>
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
