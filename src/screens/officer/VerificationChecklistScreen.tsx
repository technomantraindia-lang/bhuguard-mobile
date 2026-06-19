import { useCallback, useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../../api/authApi';
import { getAssignmentChecklist, getVisitAssignmentDetail, submitChecklist } from '../../api/fieldOfficerApi';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { VisitVerificationProgressStepper } from '../../components/officer/VisitVerificationProgressStepper';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useVisitVerificationProgress } from '../../hooks/useVisitVerificationProgress';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { isApiNotFound } from '../../utils/apiError';
import type { ApiRecord } from '../../utils/apiHelpers';
import {
  buildVisitChecklistPayload,
  DEFAULT_VISIT_CHECKLIST_VALUES,
  parseVisitChecklistRecord,
  resolveVisitChecklistTarget,
  resolveVisitServiceCode,
  type VisitChecklistValues,
} from '../../utils/visitChecklistHelpers';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'VerificationChecklist'>;

export function VerificationChecklistScreen({ route, navigation }: Props) {
  const { assignmentId } = route.params;
  const { progress, reload: reloadProgress } = useVisitVerificationProgress(assignmentId, 'checklist');
  const [targetType, setTargetType] = useState<'farmer' | 'company'>('farmer');
  const [serviceCode, setServiceCode] = useState<string | null>(null);
  const [loadingAssignment, setLoadingAssignment] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<VisitChecklistValues>(DEFAULT_VISIT_CHECKLIST_VALUES);

  const load = useCallback(async () => {
    setLoadingAssignment(true);
    setError(null);

    try {
      const assignmentData = await getVisitAssignmentDetail(assignmentId);
      const assignment = assignmentData as ApiRecord;

      setTargetType(resolveVisitChecklistTarget(assignment));
      setServiceCode(resolveVisitServiceCode(assignment));

      const embeddedChecklist = assignment.verification_checklist ?? assignment.checklist;
      if (embeddedChecklist && typeof embeddedChecklist === 'object') {
        setValues(parseVisitChecklistRecord(embeddedChecklist as ApiRecord));
      } else {
        try {
          const checklistData = await getAssignmentChecklist(assignmentId);
          const checklist = (checklistData as ApiRecord).checklist ?? checklistData;
          if (checklist && typeof checklist === 'object') {
            setValues(parseVisitChecklistRecord(checklist as ApiRecord));
          }
        } catch (err) {
          if (!isApiNotFound(err)) {
            throw err;
          }
        }
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load assignment.'));
    } finally {
      setLoadingAssignment(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const setBool = <K extends keyof VisitChecklistValues>(key: K, value: boolean) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const persistChecklist = async (submit: boolean) => {
    const payload = buildVisitChecklistPayload(values, targetType, serviceCode, submit);
    await submitChecklist(assignmentId, payload);
  };

  const saveDraft = async () => {
    setSavingDraft(true);
    setError(null);

    try {
      await persistChecklist(false);
      Alert.alert('Saved', 'Checklist progress saved. You can continue later from this visit.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to save checklist.'));
    } finally {
      setSavingDraft(false);
    }
  };

  const submit = async () => {
    setLoading(true);
    setError(null);

    try {
      await persistChecklist(true);
      await reloadProgress();
      navigation.navigate('VisitEvidenceUpload', { assignmentId });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Checklist submit failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Verification Checklist" subtitle={`Assignment #${assignmentId}`} />

      {loadingAssignment ? (
        <Text style={styles.loadingText}>Loading assignment details...</Text>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
          <VisitVerificationProgressStepper
            currentStep={progress.currentStep}
            completedSteps={progress.completedSteps}
          />

          <AppCard title={targetType === 'farmer' ? 'Farmer Verification' : 'Site Verification'}>
            {targetType === 'farmer' ? (
              <>
                <ChecklistToggle
                  label="Farm location verified"
                  value={!!values.farm_location_verified}
                  onChange={(v) => setBool('farm_location_verified', v)}
                />
                <ChecklistToggle
                  label="Farm area verified (boundary match)"
                  value={!!values.farm_area_verified}
                  onChange={(v) => setBool('farm_area_verified', v)}
                />
                <ChecklistToggle
                  label="Weekly activity evidence checked (soil sample)"
                  value={!!values.weekly_activity_evidence_checked}
                  onChange={(v) => setBool('weekly_activity_evidence_checked', v)}
                />
                <ChecklistToggle
                  label="Farmer confirmation"
                  value={!!values.farmer_confirmation}
                  onChange={(v) => setBool('farmer_confirmation', v)}
                />
              </>
            ) : (
              <>
                <ChecklistToggle
                  label="Site location verified"
                  value={!!values.site_location_verified}
                  onChange={(v) => setBool('site_location_verified', v)}
                />
                <ChecklistToggle
                  label="Site activity verified"
                  value={!!values.site_activity_verified}
                  onChange={(v) => setBool('site_activity_verified', v)}
                />
                {serviceCode === 'WASTE_MGMT' ? (
                  <ChecklistToggle
                    label="Waste processing verified"
                    value={!!values.waste_processing_verified}
                    onChange={(v) => setBool('waste_processing_verified', v)}
                  />
                ) : null}
                {serviceCode === 'IND_CARBON' ? (
                  <ChecklistToggle
                    label="Industrial data checked"
                    value={!!values.industrial_data_checked}
                    onChange={(v) => setBool('industrial_data_checked', v)}
                  />
                ) : null}
                {serviceCode === 'BIOCHAR' ? (
                  <ChecklistToggle
                    label="Biochar batch verified"
                    value={!!values.biochar_batch_verified}
                    onChange={(v) => setBool('biochar_batch_verified', v)}
                  />
                ) : null}
              </>
            )}
          </AppCard>

          <AppCard title="Correction (if needed)">
            <View style={styles.row}>
              <Text style={styles.label}>Correction required</Text>
              <Switch
                value={values.correction_required}
                onValueChange={(next) =>
                  setValues((prev) => ({
                    ...prev,
                    correction_required: next,
                    correction_notes: next ? prev.correction_notes : '',
                  }))
                }
                trackColor={{ true: colors.primary }}
              />
            </View>

            {values.correction_required ? (
              <TextInput
                style={styles.textInput}
                value={values.correction_notes}
                onChangeText={(t) => setValues((prev) => ({ ...prev, correction_notes: t }))}
                placeholder="Enter correction notes for admin"
                placeholderTextColor={colors.textMuted}
                multiline
              />
            ) : null}

            <TextInput
              style={styles.textInput}
              value={values.officer_notes}
              onChangeText={(t) => setValues((prev) => ({ ...prev, officer_notes: t }))}
              placeholder="Optional officer notes"
              placeholderTextColor={colors.textMuted}
              multiline
            />
          </AppCard>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <AppButton label="Save Progress" onPress={saveDraft} loading={savingDraft} variant="secondary" />
          <AppButton label="Complete Checklist" onPress={submit} loading={loading} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  container: { padding: 20, gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginVertical: 8 },
  label: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '600' },
  error: { color: colors.error, fontSize: 13 },
  loadingText: { padding: 20, color: colors.text },
  textInput: {
    marginTop: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    minHeight: 46,
    color: colors.text,
  },
});

function ChecklistToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary }} />
    </View>
  );
}
