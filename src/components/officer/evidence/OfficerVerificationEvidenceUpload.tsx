import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getAssignmentEvidence } from '../../../api/evidenceApi';
import { AppButton } from '../../AppButton';
import { EvidenceCapturedPreview } from '../../evidence/EvidenceCapturedPreview';
import { LiveEvidenceCaptureCard } from '../../evidence/LiveEvidenceCaptureCard';
import {
  OFFICER_UPLOAD_EVIDENCE_OPTIONS,
  type OfficerEvidenceCategoryKey,
} from '../../../constants/evidenceCategories';
import { useEvidenceUpload } from '../../../hooks/useEvidenceUpload';
import { useLiveEvidenceCapture } from '../../../hooks/useLiveEvidenceCapture';
import type { FieldOfficerStackParamList } from '../../../navigation/types';
import { colors } from '../../../theme/colors';
import { extractList, type ApiRecord } from '../../../utils/apiHelpers';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList>;

interface OfficerVerificationEvidenceUploadProps {
  assignmentId: number;
  onProgressChange?: () => void;
  onSubmitVerification?: () => void;
}

function normalizeCategory(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

function OfficerVerificationEvidenceSlot({
  label,
  category,
  assignmentId,
  saved,
  onUploaded,
}: {
  label: string;
  category: OfficerEvidenceCategoryKey;
  assignmentId: number;
  saved: ApiRecord | null;
  onUploaded: () => void;
}) {
  const navigation = useNavigation<Nav>();
  const liveEvidence = useLiveEvidenceCapture({ defaultName: `${category}.jpg` });
  const evidenceUpload = useEvidenceUpload({
    role: 'field_officer',
    visitId: assignmentId,
    onSuccess: onUploaded,
  });

  const uploadPhoto = async () => {
    if (!liveEvidence.evidence) {
      liveEvidence.setError('Capture Photo before uploading.');
      return;
    }

    const savedItem = await evidenceUpload.submitEvidence(liveEvidence.evidence, {
      evidence_category: category,
      visit_id: assignmentId,
    });

    if (savedItem) {
      liveEvidence.clearEvidence();
      Alert.alert('Upload Photo', `${label} uploaded successfully.`);
    }
  };

  const savedUrl = String(saved?.stamped_file_url ?? saved?.file_url ?? saved?.url ?? '').trim();

  return (
    <View style={styles.slotCard}>
      <Text style={styles.slotTitle}>{label}</Text>
      {saved && savedUrl ? (
        <View style={styles.savedBlock}>
          <Text style={styles.savedLabel}>Uploaded to server</Text>
          <Pressable
            onPress={() => navigation.navigate('OfficerFullscreenImage', { uri: savedUrl, title: label })}
          >
            <Text style={styles.viewFullText}>Show Full Image</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <LiveEvidenceCaptureCard
            evidence={liveEvidence.evidence}
            capturing={liveEvidence.capturing}
            uploading={evidenceUpload.uploading}
            error={evidenceUpload.error ?? liveEvidence.error}
            onOpenCamera={() => void liveEvidence.captureEvidence()}
            onRetake={() => void liveEvidence.retakeEvidence()}
            onUpload={() => void uploadPhoto()}
            uploadLabel="Upload Photo"
            showUploadButton
            hideInlinePreview
            onOpenPreview={(uri) => navigation.navigate('OfficerFullscreenImage', { uri, title: label })}
          />
          {liveEvidence.evidence ? (
            <View style={styles.previewActions}>
              <EvidenceCapturedPreview evidence={liveEvidence.evidence} />
              <Pressable style={styles.deleteButton} onPress={liveEvidence.clearEvidence}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

export function OfficerVerificationEvidenceUpload({
  assignmentId,
  onProgressChange,
  onSubmitVerification,
}: OfficerVerificationEvidenceUploadProps) {
  const [savedByCategory, setSavedByCategory] = useState<Record<string, ApiRecord>>({});
  const [loading, setLoading] = useState(true);

  const loadSavedEvidence = useCallback(async () => {
    setLoading(true);

    try {
      const data = await getAssignmentEvidence(assignmentId);
      const items = extractList(data as ApiRecord, ['evidence', 'evidence_uploads', 'data']);
      const mapped: Record<string, ApiRecord> = {};

      for (const item of items) {
        const category = normalizeCategory(item.category ?? item.evidence_category);

        if (!mapped[category]) {
          mapped[category] = item;
        }
      }

      setSavedByCategory(mapped);
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    void loadSavedEvidence();
  }, [loadSavedEvidence]);

  const requiredCategories = useMemo(
    () => OFFICER_UPLOAD_EVIDENCE_OPTIONS.map((option) => option.key),
    [],
  );

  const completedCount = requiredCategories.filter((category) => {
    const saved = savedByCategory[category] ?? savedByCategory[normalizeCategory(category)];

    return Boolean(saved);
  }).length;

  const allRequiredUploaded = completedCount === requiredCategories.length;

  const handleUploaded = () => {
    void loadSavedEvidence();
    onProgressChange?.();
  };

  const handleSubmitVerification = () => {
    if (!allRequiredUploaded) {
      Alert.alert('Evidence required', 'Before Photo, During Photo, and After Photo are all required.');
      return;
    }

    onSubmitVerification?.();
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.intro}>
        Capture Before Photo, During Photo, and After Photo with GPS timestamp stamp.
      </Text>
      <Text style={styles.progress}>
        {loading ? 'Loading saved evidence...' : `${completedCount} of 3 required photos uploaded`}
      </Text>

      {OFFICER_UPLOAD_EVIDENCE_OPTIONS.map((option) => (
        <OfficerVerificationEvidenceSlot
          key={option.key}
          label={option.label}
          category={option.key}
          assignmentId={assignmentId}
          saved={savedByCategory[option.key] ?? null}
          onUploaded={handleUploaded}
        />
      ))}

      <AppButton
        label="Submit Verification"
        onPress={handleSubmitVerification}
        disabled={!allRequiredUploaded}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  intro: { fontSize: 13, lineHeight: 20, color: colors.textMuted },
  progress: { fontSize: 12, fontWeight: '700', color: colors.primary },
  slotCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    backgroundColor: colors.surface,
  },
  slotTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  savedBlock: { gap: 6 },
  savedLabel: { fontSize: 13, color: colors.textMuted },
  viewFullText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  previewActions: { gap: 8 },
  deleteButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deleteButtonText: { color: colors.error, fontWeight: '700', fontSize: 13 },
});
