import { useState } from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';

import { getApiErrorMessage } from '../../api/authApi';
import { uploadVisitEvidence } from '../../api/fieldOfficerApi';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { ScreenHeader } from '../../components/ScreenHeader';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'VisitEvidenceUpload'>;

export function VisitEvidenceUploadScreen({ route, navigation }: Props) {
  const { assignmentId } = route.params;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickedLabel, setPickedLabel] = useState('No image selected');

  const pickAndUpload = async () => {
    setLoading(true);
    setError(null);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('Gallery permission is required to upload evidence.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 0.8,
        allowsEditing: true,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      setPickedLabel(asset.fileName ?? 'evidence.jpg');

      const formData = new FormData();
      formData.append('evidence', {
        uri: asset.uri,
        name: asset.fileName ?? 'evidence.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      } as unknown as Blob);

      await uploadVisitEvidence(assignmentId, formData);
      navigation.navigate('VisitReportReview', { assignmentId });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Evidence upload failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Upload Evidence" subtitle={`Assignment #${assignmentId}`} />
      <AppCard title="Visit Evidence" subtitle={pickedLabel} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <AppButton label="Pick Image & Upload" onPress={pickAndUpload} loading={loading} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, padding: 20, gap: 12 },
  error: { color: colors.error, fontSize: 13 },
});
