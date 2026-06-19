import { useCallback, useEffect, useState } from 'react';
import { Alert, SafeAreaView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../../api/authApi';
import { getAssignmentEvidence, uploadVisitEvidence } from '../../api/fieldOfficerApi';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { LiveEvidenceCaptureCard } from '../../components/evidence/LiveEvidenceCaptureCard';
import { VisitVerificationProgressStepper } from '../../components/officer/VisitVerificationProgressStepper';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useLiveEvidenceCapture } from '../../hooks/useLiveEvidenceCapture';
import { useVisitVerificationProgress } from '../../hooks/useVisitVerificationProgress';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { extractList, type ApiRecord } from '../../utils/apiHelpers';
import { appendVisitEvidenceFields } from '../../utils/liveEvidenceCapture';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'VisitEvidenceUpload'>;

type EvidenceCategoryKey =
  | 'document_photo'
  | 'verification_photo'
  | 'site_photo'
  | 'supporting_document'
  | 'weekly_progress_photo';

const CATEGORY_OPTIONS: Array<{ key: EvidenceCategoryKey; label: string }> = [
  { key: 'document_photo', label: 'Document' },
  { key: 'verification_photo', label: 'Verification' },
  { key: 'site_photo', label: 'Site' },
  { key: 'supporting_document', label: 'Supporting Doc' },
  { key: 'weekly_progress_photo', label: 'Weekly Progress' },
];

export function VisitEvidenceUploadScreen({ route, navigation }: Props) {
  const { assignmentId } = route.params;
  const { progress, reload: reloadProgress } = useVisitVerificationProgress(assignmentId, 'evidence');
  const [uploading, setUploading] = useState(false);
  const [loadingEvidence, setLoadingEvidence] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<EvidenceCategoryKey>('verification_photo');
  const [notes, setNotes] = useState('');
  const [uploadedCount, setUploadedCount] = useState(0);
  const liveEvidence = useLiveEvidenceCapture({ defaultName: 'visit-evidence.jpg', allowsEditing: true });

  const loadEvidence = useCallback(async () => {
    setLoadingEvidence(true);

    try {
      const data = await getAssignmentEvidence(assignmentId);
      const items = extractList(data as ApiRecord, ['evidence', 'evidence_uploads', 'data']);
      setUploadedCount(items.length);
    } catch {
      setUploadedCount(0);
    } finally {
      setLoadingEvidence(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    void loadEvidence();
  }, [loadEvidence]);

  const uploadEvidence = async () => {
    if (!liveEvidence.evidence) {
      setError('Capture a live photo before uploading.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      appendVisitEvidenceFields(formData, liveEvidence.evidence);
      formData.append('category', category);

      if (notes.trim()) {
        formData.append('notes', notes.trim());
      }

      await uploadVisitEvidence(assignmentId, formData);
      await loadEvidence();
      await reloadProgress();
      liveEvidence.clearEvidence();
      setNotes('');

      Alert.alert('Evidence uploaded', 'Your live photo evidence was saved successfully.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Evidence upload failed.'));
    } finally {
      setUploading(false);
    }
  };

  const continueToReview = () => {
    navigation.navigate('VisitReportReview', { assignmentId });
  };

  const displayError = error ?? liveEvidence.error;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Upload Evidence" subtitle={`Assignment #${assignmentId}`} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <VisitVerificationProgressStepper
          currentStep={progress.currentStep}
          completedSteps={progress.completedSteps}
        />

        <AppCard
          title="Uploaded evidence"
          subtitle={
            loadingEvidence
              ? 'Loading saved evidence...'
              : `${uploadedCount} file${uploadedCount === 1 ? '' : 's'} saved on server`
          }
        />

        <AppCard title="Evidence category" subtitle="Choose what you are capturing">
          <View style={styles.categoryRow}>
            {CATEGORY_OPTIONS.map((opt) => {
              const active = opt.key === category;

              return (
                <PressableChip
                  key={opt.key}
                  label={opt.label}
                  active={active}
                  onPress={() => setCategory(opt.key)}
                />
              );
            })}
          </View>
        </AppCard>

        <LiveEvidenceCaptureCard
          evidence={liveEvidence.evidence}
          capturing={liveEvidence.capturing}
          uploading={uploading}
          error={displayError}
          onOpenCamera={() => void liveEvidence.captureEvidence()}
          onRetake={() => void liveEvidence.retakeEvidence()}
          onUpload={() => void uploadEvidence()}
          uploadLabel="Upload Evidence"
          showUploadButton
        />

        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional notes (for this evidence)"
          placeholderTextColor={colors.textMuted}
          multiline
        />

        <AppButton
          label="Continue to Review"
          onPress={continueToReview}
          variant="secondary"
          disabled={uploadedCount === 0}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function PressableChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.categoryChip, active && styles.categoryChipActive]} onPress={onPress}>
      <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  container: { padding: 20, gap: 12 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  categoryChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.softGreen,
  },
  categoryChipText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  categoryChipTextActive: { color: colors.primary },
  notesInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    minHeight: 46,
    color: colors.text,
  },
});
