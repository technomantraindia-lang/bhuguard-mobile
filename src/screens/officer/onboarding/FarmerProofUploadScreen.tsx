import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import { AppButton } from '../../../components/AppButton';
import { AppCard } from '../../../components/AppCard';
import type { FileAsset } from '../../../context/OnboardingContext';
import { useOnboarding } from '../../../context/OnboardingContext';
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
  onPick,
  onRemove,
  pickLabel,
}: {
  title: string;
  subtitle: string;
  file: FileAsset | null;
  onPick: () => void;
  onRemove: () => void;
  pickLabel: string;
}) {
  return (
    <View style={styles.fileBlock}>
      <AppCard
        title={title}
        subtitle={file ? `${file.name}${file.size ? ` · ${formatFileSize(file.size)}` : ''}` : subtitle}
      />
      <View style={styles.fileActions}>
        <AppButton label={pickLabel} onPress={onPick} variant="secondary" />
        {file ? (
          <Pressable onPress={onRemove}>
            <Text style={styles.remove}>Remove</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function FarmerProofUploadScreen() {
  const navigation = useNavigation<Nav>();
  const { draft, updateDraft } = useOnboarding();
  const [error, setError] = useState<string | null>(null);

  const pickProof = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      updateDraft({
        proof_of_land_ownership: toAsset(
          asset.uri,
          asset.name ?? 'proof.pdf',
          asset.mimeType ?? 'application/pdf',
          asset.size,
        ),
      });
    }
  };

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      setError('Camera permission is required for farmer photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      updateDraft({
        farmer_photo: toAsset(asset.uri, 'farmer_photo.jpg', asset.mimeType ?? 'image/jpeg', asset.fileSize),
      });
    }
  };

  const pickPhotoFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError('Gallery permission is required to pick farmer photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      allowsEditing: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      updateDraft({
        farmer_photo: toAsset(
          asset.uri,
          asset.fileName ?? 'farmer_photo.jpg',
          asset.mimeType ?? 'image/jpeg',
          asset.fileSize,
        ),
      });
    }
  };

  return (
    <OnboardingFormScreen
      stepCurrent={5}
      title="Documents"
      subtitle="Upload land proof and farmer photo for verification."
      onNext={() => navigation.navigate('FarmerOnboardingReview')}
    >
      <FileRow
        title="Proof of land ownership"
        subtitle="Recommended — PDF or image"
        file={draft.proof_of_land_ownership}
        onPick={pickProof}
        onRemove={() => updateDraft({ proof_of_land_ownership: null })}
        pickLabel="Upload land proof"
      />
      <FileRow
        title="Farmer photo"
        subtitle="Optional — camera or gallery"
        file={draft.farmer_photo}
        onPick={pickPhoto}
        onRemove={() => updateDraft({ farmer_photo: null })}
        pickLabel="Capture photo"
      />
      {draft.farmer_photo ? null : (
        <AppButton label="Pick photo from gallery" onPress={pickPhotoFromGallery} variant="secondary" />
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </OnboardingFormScreen>
  );
}

const styles = StyleSheet.create({
  fileBlock: { gap: 8 },
  fileActions: { gap: 8 },
  remove: { color: colors.error, fontWeight: '600', textAlign: 'center', paddingVertical: 4 },
  error: { color: colors.error, fontSize: 14 },
});
