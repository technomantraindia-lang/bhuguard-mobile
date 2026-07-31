import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';

import {
  approveVisitVerification,
  getVisitAssignmentDetail,
  saveVisitFarmerDetails,
  saveVisitMobileNetworkVerification,
  startVisitRecord,
  submitVisitVerification,
  visitRecordReview,
} from '../../api/fieldOfficerApi';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { VisitVerificationProgressStepper } from '../../components/officer/VisitVerificationProgressStepper';
import { ScreenHeader } from '../../components/ScreenHeader';
import { OFFICER_UPLOAD_EVIDENCE_OPTIONS } from '../../constants/evidenceCategories';
import { OfficerVerificationEvidenceUpload } from '../../components/officer/evidence/OfficerVerificationEvidenceUpload';
import { useEvidenceUpload } from '../../hooks/useEvidenceUpload';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { officerTheme } from '../../theme/officerDashboardTheme';
import { getApiErrorMessage } from '../../api/authApi';
import type { ApiRecord } from '../../utils/apiHelpers';
import {
  ensureVisitReadyForGpsCheckIn,
  resolveVisitVerificationProgress,
  unwrapAssignmentRecord,
  VISIT_VERIFICATION_STEPS,
  type VisitVerificationStepKey,
} from '../../utils/visitWorkflowHelpers';
import type { LiveCapturedEvidence } from '../../utils/liveEvidenceCapture';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'FieldOfficerVisitVerification'>;

type YesNo = 'yes' | 'no' | null;

function pickString(record: ApiRecord | null, ...keys: string[]): string {
  if (!record) {
    return '-';
  }

  for (const key of keys) {
    const value = record[key];

    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value);
    }
  }

  return '-';
}

export function FieldOfficerVisitVerificationScreen({ route, navigation }: Props) {
  const initialAssignmentId = route.params?.assignmentId;
  const initialFarmerId = route.params?.farmerId;
  const initialFarmId = route.params?.farmId;

  const [loading, setLoading] = useState(Boolean(initialAssignmentId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignmentId, setAssignmentId] = useState<number | null>(initialAssignmentId ?? null);
  const [assignment, setAssignment] = useState<ApiRecord | null>(null);
  const [activeStep, setActiveStep] = useState<VisitVerificationStepKey>('start_visit');
  const [completedSteps, setCompletedSteps] = useState<VisitVerificationStepKey[]>([]);
  const [review, setReview] = useState<ApiRecord | null>(null);

  const [farmerHasMobile, setFarmerHasMobile] = useState<YesNo>(null);
  const [farmerHasNetwork, setFarmerHasNetwork] = useState<YesNo>(null);
  const [verificationStatus, setVerificationStatus] = useState<'verified' | 'not_verified' | 'pending'>('pending');
  const [evidenceCategory, setEvidenceCategory] = useState('verification_photo');
  const [evidenceRemarks, setEvidenceRemarks] = useState('');

  const evidenceUpload = useEvidenceUpload({
    role: 'field_officer',
    visitId: assignmentId ?? undefined,
    onSuccess: () => {
      if (assignmentId) {
        void loadAssignment(assignmentId);
      }
    },
  });

  const farmer = useMemo(() => {
    const embedded = assignment?.farmer;

    return embedded && typeof embedded === 'object' ? (embedded as ApiRecord) : null;
  }, [assignment]);

  const farm = useMemo(() => {
    const embedded = assignment?.farm;

    return embedded && typeof embedded === 'object' ? (embedded as ApiRecord) : null;
  }, [assignment]);

  const applyVisitProgress = useCallback((record: ApiRecord) => {
    const progress = resolveVisitVerificationProgress(record);
    setCompletedSteps(progress.completedSteps);
    setActiveStep(progress.currentStep);
  }, []);

  const loadAssignment = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      const detail = await getVisitAssignmentDetail(id);
      const record = unwrapAssignmentRecord(detail as ApiRecord);
      setAssignment(record);
      setAssignmentId(Number(record.id));
      applyVisitProgress(record);

      if (record.farmer_has_mobile !== undefined && record.farmer_has_mobile !== null) {
        setFarmerHasMobile(record.farmer_has_mobile ? 'yes' : 'no');
      }

      if (record.farmer_has_network !== undefined && record.farmer_has_network !== null) {
        setFarmerHasNetwork(record.farmer_has_network ? 'yes' : 'no');
      }

      if (record.verification_status) {
        setVerificationStatus(String(record.verification_status) as typeof verificationStatus);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load visit details.'));
    } finally {
      setLoading(false);
    }
  }, [applyVisitProgress]);

  useFocusEffect(
    useCallback(() => {
      const id = assignmentId ?? initialAssignmentId;

      if (id) {
        void loadAssignment(id);
      }
    }, [assignmentId, initialAssignmentId, loadAssignment]),
  );

  const markCompleted = (step: VisitVerificationStepKey) => {
    setCompletedSteps((current) => (current.includes(step) ? current : [...current, step]));
  };

  const goToStep = (step: VisitVerificationStepKey) => {
    setActiveStep(step);
  };

  const handleStartVisit = async () => {
    setSaving(true);
    setError(null);

    try {
      if (assignmentId) {
        const started = await ensureVisitReadyForGpsCheckIn(assignmentId);
        setAssignment(started);
        setAssignmentId(Number(started.id));
        markCompleted('start_visit');
        goToStep('check_in');
        navigation.navigate('VisitCheckIn', { assignmentId: Number(started.id) });
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }).catch(() => null);
      const response = await startVisitRecord({
        farmer_id: initialFarmerId,
        farm_id: initialFarmId,
        latitude: position?.coords.latitude,
        longitude: position?.coords.longitude,
        gps_accuracy: position?.coords.accuracy,
      });
      const visit = unwrapAssignmentRecord(response as ApiRecord);
      const id = Number(visit.id);
      setAssignmentId(id);
      setAssignment(visit);
      markCompleted('start_visit');
      goToStep('check_in');
      navigation.navigate('VisitCheckIn', { assignmentId: id });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to start visit.'));
    } finally {
      setSaving(false);
    }
  };

  const handleFarmerDetailsContinue = async () => {
    if (!assignmentId || !farmer?.id) {
      setError('Farmer details are required before continuing.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await saveVisitFarmerDetails({
        visit_id: assignmentId,
        farmer_id: Number(farmer.id),
        farm_id: farm?.id ? Number(farm.id) : undefined,
      });
      setAssignment(unwrapAssignmentRecord(response as ApiRecord));
      markCompleted('farmer_details');
      goToStep('mobile_network');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to save farmer details.'));
    } finally {
      setSaving(false);
    }
  };

  const handleMobileNetworkContinue = async () => {
    if (!assignmentId) {
      return;
    }

    if (!farmerHasMobile || !farmerHasNetwork) {
      setError('Please answer both mobile and network questions.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await saveVisitMobileNetworkVerification({
        visit_id: assignmentId,
        farmer_has_mobile: farmerHasMobile === 'yes',
        farmer_has_network: farmerHasNetwork === 'yes',
        verification_status: verificationStatus,
      });
      setAssignment(unwrapAssignmentRecord(response as ApiRecord));
      markCompleted('mobile_network');
      goToStep('start_biochar_activity');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to save mobile/network verification.'));
    } finally {
      setSaving(false);
    }
  };

  const handleStartBiocharActivity = () => {
    markCompleted('start_biochar_activity');
    markCompleted('biochar_process');
    goToStep('evidence');
  };

  const handleEvidenceUpload = async (file: LiveCapturedEvidence | { uri: string; name: string; type: string }) => {
    if (!assignmentId) {
      return;
    }

    const saved = await evidenceUpload.submitEvidence(file, {
      evidence_category: evidenceCategory,
      visit_id: assignmentId,
      remarks: evidenceRemarks,
      notes: evidenceRemarks,
    });

    if (saved) {
      setEvidenceRemarks('');
      markCompleted('evidence');
    }
  };

  const handleLoadReview = async () => {
    if (!assignmentId) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await visitRecordReview(assignmentId);
      setReview((response as ApiRecord).review as ApiRecord);
      markCompleted('evidence');
      goToStep('review');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load review.'));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitVerification = async () => {
    if (!assignmentId) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await submitVisitVerification(assignmentId);
      markCompleted('review');
      markCompleted('submit');
      goToStep('submit');
      Alert.alert('Verification submitted', 'Visit verification has been submitted for approval.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to submit verification.'));
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!assignmentId) {
      return;
    }

    setSaving(true);

    try {
      await approveVisitVerification(assignmentId);
      Alert.alert('Approved', 'Verification approved successfully.');
      navigation.navigate('FieldOfficerTabs', { screen: 'Home' });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to approve verification.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading && !assignment) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading verification flow..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Start Verification"
        subtitle="Complete each step before submitting verification."
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <VisitVerificationProgressStepper currentStep={activeStep} completedSteps={completedSteps} />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {activeStep === 'start_visit' ? (
          <AppCard title="Step 1: Start Visit" subtitle="Create or open the visit record for this field verification.">
            <Text style={styles.body}>
              {assignmentId
                ? `Visit #${assignmentId} is ready. Continue to GPS check-in.`
                : 'Tap below to start a new visit and capture your current location if available.'}
            </Text>
            <AppButton label={saving ? 'Starting...' : 'Start Visit'} onPress={() => void handleStartVisit()} disabled={saving} />
          </AppCard>
        ) : null}

        {activeStep === 'check_in' ? (
          <AppCard title="Step 2: Check-in" subtitle="Capture GPS location at the farmer field.">
            <Text style={styles.body}>
              Open GPS Check-in to verify you are inside the farm radius before continuing verification.
            </Text>
            <AppButton
              label="Open GPS Check-in"
              onPress={() => {
                if (!assignmentId) {
                  setError('Start the visit before check-in.');
                  return;
                }

                navigation.navigate('VisitCheckIn', { assignmentId });
              }}
            />
          </AppCard>
        ) : null}

        {activeStep === 'farmer_details' ? (
          <AppCard title="Step 3: Farmer Details" subtitle="Confirm farmer and farm information.">
            <DetailLine label="Farmer ID" value={pickString(farmer, 'farmer_code', 'id')} />
            <DetailLine label="Farmer Name" value={pickString(farmer?.user as ApiRecord, 'name', 'farmer_name')} />
            <DetailLine label="Mobile" value={pickString(farmer?.user as ApiRecord, 'mobile')} />
            <DetailLine label="Village" value={pickString(farmer, 'village')} />
            <DetailLine label="Taluka" value={pickString(farmer, 'taluka')} />
            <DetailLine label="District" value={pickString(farmer, 'district')} />
            <DetailLine label="State" value={pickString(farmer, 'state')} />
            <DetailLine label="Farm ID" value={pickString(farm, 'farm_code', 'id')} />
            <DetailLine label="Farm area" value={pickString(farm, 'land_area', 'area_acres')} />
            <View style={styles.actions}>
              <AppButton
                label="Onboard New Farmer"
                variant="secondary"
                onPress={() => navigation.navigate('FarmerOnboardingStart')}
              />
              <AppButton
                label={saving ? 'Saving...' : 'Continue'}
                onPress={() => void handleFarmerDetailsContinue()}
                disabled={saving || !farmer?.id}
              />
            </View>
          </AppCard>
        ) : null}

        {activeStep === 'mobile_network' ? (
          <AppCard title="Step 4: Farmer Mobile / Network Verification">
            <YesNoGroup label="Does farmer have mobile?" value={farmerHasMobile} onChange={setFarmerHasMobile} />
            <YesNoGroup label="Is farmer currently in network coverage?" value={farmerHasNetwork} onChange={setFarmerHasNetwork} />
            <Text style={styles.fieldLabel}>Verification status</Text>
            <View style={styles.chipRow}>
              {(['verified', 'not_verified', 'pending'] as const).map((status) => (
                <Pressable
                  key={status}
                  style={[styles.chip, verificationStatus === status && styles.chipActive]}
                  onPress={() => setVerificationStatus(status)}
                >
                  <Text style={[styles.chipText, verificationStatus === status && styles.chipTextActive]}>
                    {status === 'not_verified' ? 'Not Verified' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
            <AppButton
              label={saving ? 'Saving...' : 'Continue'}
              onPress={() => void handleMobileNetworkContinue()}
              disabled={saving}
            />
          </AppCard>
        ) : null}

        {activeStep === 'start_biochar_activity' ? (
          <AppCard title="Step 5: Biochar Activity" subtitle="Artisan biochar production is reviewed in the artisan workflow.">
            <AppButton
              label="Continue to Evidence"
              onPress={handleStartBiocharActivity}
            />
          </AppCard>
        ) : null}

        {activeStep === 'biochar_process' ? (
          <AppCard title="Step 6: Biochar Activity" subtitle="Continue with visit evidence after completing the artisan workflow.">
            <AppButton
              label="Continue to Evidence"
              onPress={() => {
                markCompleted('biochar_process');
                goToStep('evidence');
              }}
            />
          </AppCard>
        ) : null}

        {activeStep === 'evidence' ? (
          <AppCard title="Evidence Upload" subtitle="Before Photo, During Photo, and After Photo are required.">
            {assignmentId ? (
              <OfficerVerificationEvidenceUpload
                assignmentId={assignmentId}
                onProgressChange={() => void evidenceUpload.refreshList()}
                onSubmitVerification={() => {
                  markCompleted('evidence');
                  goToStep('review');
                }}
              />
            ) : null}
            <AppButton label="Continue to Review" variant="secondary" onPress={() => void handleLoadReview()} disabled={saving} />
          </AppCard>
        ) : null}

        {activeStep === 'review' ? (
          <AppCard title="Step 7: Evidence/Submit" subtitle="Confirm visit details before submission.">
            <DetailLine label="Visit ID" value={assignmentId ? String(assignmentId) : '-'} />
            <DetailLine
              label="Check-in location"
              value={
                review?.check_in_location
                  ? `${(review.check_in_location as ApiRecord).latitude}, ${(review.check_in_location as ApiRecord).longitude}`
                  : pickString(assignment, 'check_in_latitude', 'latitude')
              }
            />
            <DetailLine label="Farmer" value={pickString(farmer?.user as ApiRecord, 'name')} />
            <DetailLine
              label="Mobile available"
              value={farmerHasMobile === 'yes' ? 'Yes' : farmerHasMobile === 'no' ? 'No' : '-'}
            />
            <DetailLine
              label="Network available"
              value={farmerHasNetwork === 'yes' ? 'Yes' : farmerHasNetwork === 'no' ? 'No' : '-'}
            />
            <DetailLine
              label="Evidence files"
              value={String((review?.evidence_summary as ApiRecord)?.count ?? evidenceUpload.uploadedCount)}
            />
            <View style={styles.actions}>
              <AppButton
                label={saving ? 'Submitting...' : 'Submit Verification'}
                onPress={() => void handleSubmitVerification()}
                disabled={saving}
              />
              <AppButton label="Approve Now" variant="secondary" onPress={() => void handleApprove()} disabled={saving} />
            </View>
          </AppCard>
        ) : null}

        {activeStep === 'submit' ? (
          <AppCard title="Step 7: Evidence/Submit" subtitle="The visit verification has been saved.">
            <Text style={styles.body}>You can approve this submission now or return to the dashboard.</Text>
            <View style={styles.actions}>
              <AppButton label="Approve Verification" onPress={() => void handleApprove()} disabled={saving} />
              <AppButton
                label="Go To Dashboard"
                variant="secondary"
                onPress={() => navigation.navigate('FieldOfficerTabs', { screen: 'Home' })}
              />
            </View>
          </AppCard>
        ) : null}

        <View style={styles.stepNav}>
          {VISIT_VERIFICATION_STEPS.map((step) => (
            <Pressable key={step.key} style={styles.stepLink} onPress={() => goToStep(step.key)}>
              <Text style={[styles.stepLinkText, activeStep === step.key && styles.stepLinkTextActive]}>{step.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <Text style={styles.line}>
      {label}: {value}
    </Text>
  );
}

function YesNoGroup({
  label,
  value,
  onChange,
}: {
  label: string;
  value: YesNo;
  onChange: (value: YesNo) => void;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.chipRow}>
        {(['yes', 'no'] as const).map((option) => (
          <Pressable
            key={option}
            style={[styles.chip, value === option && styles.chipActive]}
            onPress={() => onChange(option)}
          >
            <Text style={[styles.chipText, value === option && styles.chipTextActive]}>
              {option === 'yes' ? 'Yes' : 'No'}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: officerTheme.background },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  body: { fontSize: 14, lineHeight: 20, color: officerTheme.onSurfaceVariant, marginBottom: 12 },
  error: { color: officerTheme.error, fontSize: 14 },
  line: { fontSize: 14, color: officerTheme.onSurface, marginTop: 6 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: officerTheme.onSurface, marginBottom: 8 },
  group: { marginBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: officerTheme.surfaceLowest,
  },
  chipActive: { backgroundColor: '#EAF7EF', borderColor: officerTheme.primary },
  chipText: { color: officerTheme.onSurfaceVariant, fontWeight: '600' },
  chipTextActive: { color: officerTheme.primary },
  actions: { gap: 10, marginTop: 12 },
  stepNav: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stepLink: {
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  stepLinkText: { fontSize: 12, color: officerTheme.onSurfaceVariant },
  stepLinkTextActive: { color: officerTheme.primary, fontWeight: '700' },
});
