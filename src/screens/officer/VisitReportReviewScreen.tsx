import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../../api/authApi';
import { submitVisitReport } from '../../api/fieldOfficerApi';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { VisitVerificationProgressStepper } from '../../components/officer/VisitVerificationProgressStepper';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useVisitVerificationProgress } from '../../hooks/useVisitVerificationProgress';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { ensureAssignmentReadyForReportSubmit } from '../../utils/visitWorkflowHelpers';
import {
  clearVisitReportDraft,
  loadVisitReportDraft,
  saveVisitReportDraft,
} from '../../utils/visitVerificationStorage';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'VisitReportReview' | 'FieldOfficerDraftReportEditor'>;

type Recommendation = 'verified' | 'correction_requested' | 'rejected';

export function VisitReportReviewScreen({ route, navigation }: Props) {
  const { assignmentId } = route.params;
  const { progress, reload } = useVisitVerificationProgress(assignmentId, 'review');
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);

  const [recommendation, setRecommendation] = useState<Recommendation>('verified');
  const [summary, setSummary] = useState('');
  const [observationNotes, setObservationNotes] = useState('');
  const [riskNotes, setRiskNotes] = useState('');
  const [supportingNotes, setSupportingNotes] = useState('');

  const canSubmit = useMemo(() => summary.trim().length > 0, [summary]);

  useEffect(() => {
    const loadDraft = async () => {
      const draft = await loadVisitReportDraft(assignmentId);

      if (draft) {
        setRecommendation(draft.recommendation);
        setSummary(draft.summary);
        setObservationNotes(draft.observationNotes);
        setRiskNotes(draft.riskNotes);
        setSupportingNotes(draft.supportingNotes);
      }

      setDraftLoaded(true);
    };

    void loadDraft();
  }, [assignmentId]);

  useEffect(() => {
    if (!draftLoaded) {
      return;
    }

    const timer = setTimeout(() => {
      void saveVisitReportDraft(assignmentId, {
        recommendation,
        summary,
        observationNotes,
        riskNotes,
        supportingNotes,
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [
    assignmentId,
    draftLoaded,
    recommendation,
    summary,
    observationNotes,
    riskNotes,
    supportingNotes,
  ]);

  const saveDraftNow = async () => {
    setSavingDraft(true);
    setError(null);

    try {
      await saveVisitReportDraft(assignmentId, {
        recommendation,
        summary,
        observationNotes,
        riskNotes,
        supportingNotes,
      });
      Alert.alert('Saved', 'Report draft saved on this device.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to save draft.'));
    } finally {
      setSavingDraft(false);
    }
  };

  const submit = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!canSubmit) {
        Alert.alert('Missing summary', 'Officer summary is required.');
        return;
      }

      await ensureAssignmentReadyForReportSubmit(assignmentId);

      await submitVisitReport(assignmentId, {
        officer_recommendation: recommendation,
        officer_summary: summary.trim(),
        observation_notes: observationNotes.trim() ? observationNotes.trim() : undefined,
        risk_notes: riskNotes.trim() ? riskNotes.trim() : undefined,
        supporting_notes: supportingNotes.trim() ? supportingNotes.trim() : undefined,
      });

      await clearVisitReportDraft(assignmentId);
      await reload();
      navigation.replace('VisitReportSuccess', { assignmentId });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Visit report submission failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Review & Submit" subtitle={`Assignment #${assignmentId}`} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <VisitVerificationProgressStepper
          currentStep={progress.currentStep}
          completedSteps={progress.completedSteps}
        />

        <AppCard title="Recommendation" subtitle="Choose how you verified the documents and physical data">
          <View style={styles.recoRow}>
            {(
              [
                { key: 'verified', label: 'Verified' },
                { key: 'correction_requested', label: 'Correction requested' },
                { key: 'rejected', label: 'Rejected' },
              ] as Array<{ key: Recommendation; label: string }>
            ).map((opt) => {
              const active = opt.key === recommendation;

              return (
                <Pressable
                  key={opt.key}
                  style={[styles.recoChip, active && styles.recoChipActive]}
                  onPress={() => setRecommendation(opt.key)}
                >
                  <Text style={[styles.recoChipText, active && styles.recoChipTextActive]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </AppCard>

        <AppCard title="Officer summary" subtitle="This summary will be sent to admin along with checklist and evidence">
          <TextInput
            style={styles.textInput}
            value={summary}
            onChangeText={setSummary}
            placeholder="Write a short summary (required)"
            placeholderTextColor={colors.textMuted}
            multiline
          />
        </AppCard>

        <AppCard title="Optional notes">
          <TextInput
            style={styles.textInput}
            value={observationNotes}
            onChangeText={setObservationNotes}
            placeholder="Observation notes (optional)"
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <TextInput
            style={styles.textInput}
            value={riskNotes}
            onChangeText={setRiskNotes}
            placeholder="Risk notes (optional)"
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <TextInput
            style={styles.textInput}
            value={supportingNotes}
            onChangeText={setSupportingNotes}
            placeholder="Supporting notes (optional)"
            placeholderTextColor={colors.textMuted}
            multiline
          />
        </AppCard>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AppButton label="Save Draft" onPress={saveDraftNow} loading={savingDraft} variant="secondary" />
        <AppButton label="Submit Visit Report" onPress={submit} loading={loading} disabled={!canSubmit} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  container: { padding: 20, gap: 12, paddingBottom: 28 },
  error: { color: colors.error, fontSize: 13 },
  recoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  recoChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  recoChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.softGreen,
  },
  recoChipText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  recoChipTextActive: { color: colors.primary },
  textInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    minHeight: 46,
    marginTop: 10,
    color: colors.text,
    textAlignVertical: 'top',
  },
});
