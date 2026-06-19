import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { saveFeedstockVerificationDraft } from '../../api/fieldOfficerApi';
import { getApiErrorMessage } from '../../api/authApi';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { officerTheme } from '../../theme/officerDashboardTheme';
import { buildVerificationPayload } from '../../utils/feedstockVerificationHelpers';
import { defaultChecklistItems } from '../../constants/feedstockVerificationChecklist';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'OfficerFeedstockCorrection'>;

export function OfficerFeedstockCorrectionScreen({ route, navigation }: Props) {
  const { verificationId, initialNotes = '', initialRequiredChanges = '' } = route.params;
  const [correctionNotes, setCorrectionNotes] = useState(initialNotes);
  const [requiredChanges, setRequiredChanges] = useState(initialRequiredChanges);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);

    try {
      await saveFeedstockVerificationDraft(
        verificationId,
        buildVerificationPayload({
          checklist: defaultChecklistItems(),
          photoReviews: [],
          weightSlipApproved: null,
          gpsVerified: null,
          gpsFlagged: false,
          officerRemarks: '',
          correctionNotes,
          requiredChanges,
          rejectionReason: '',
          verificationResult: 'correction_required',
        }),
      );

      Alert.alert('Correction requested', 'Correction notes saved to the verification draft.', [
        {
          text: 'OK',
          onPress: () =>
            navigation.navigate({
              name: 'FieldOfficerFeedstockVerification',
              params: { verificationId },
              merge: true,
            }),
        },
      ]);
    } catch (err) {
      Alert.alert('Save failed', getApiErrorMessage(err, 'Could not save correction request.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Correction Request</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>Correction Notes</Text>
        <TextInput
          value={correctionNotes}
          onChangeText={setCorrectionNotes}
          multiline
          style={styles.input}
          placeholder="Describe required corrections"
          placeholderTextColor={officerTheme.outline}
        />
        <Text style={styles.label}>Required Changes</Text>
        <TextInput
          value={requiredChanges}
          onChangeText={setRequiredChanges}
          multiline
          style={styles.input}
          placeholder="List required changes for farmer"
          placeholderTextColor={officerTheme.outline}
        />
        <Pressable style={styles.button} onPress={() => void handleSave()} disabled={saving}>
          <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save Correction Request'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: officerTheme.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: officerTheme.surfaceLowest,
    borderBottomWidth: 1,
    borderBottomColor: officerTheme.outlineVariant,
  },
  back: { color: officerTheme.primaryContainer, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '700', color: officerTheme.onSurface },
  content: { padding: 16, gap: 10 },
  label: { fontSize: 14, fontWeight: '600', color: officerTheme.onSurfaceVariant },
  input: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 10,
    padding: 12,
    backgroundColor: officerTheme.surfaceLowest,
    textAlignVertical: 'top',
    color: officerTheme.onSurface,
  },
  button: {
    marginTop: 8,
    backgroundColor: officerTheme.primaryContainer,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: { color: officerTheme.onPrimary, fontWeight: '700' },
});
