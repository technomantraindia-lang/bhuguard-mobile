import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import {
  checkInFarmVerificationActivity,
  getFarmVerificationActivity,
  startFarmVerificationActivity,
  submitFarmVerificationActivity,
  uploadFarmVerificationEvidence,
} from '../../api/fieldOfficerApi';
import { getApiErrorMessage } from '../../api/authApi';
import { AppButton } from '../../components/AppButton';
import { KeyboardSafeScrollView } from '../../components/layout/KeyboardSafeScrollView';
import {
  PremiumInfoPanel,
  PremiumReadonlyField,
} from '../../components/officer/activity-workflow/PremiumActivityFormFields';
import { PremiumActivityFooter } from '../../components/officer/activity-workflow/PremiumActivityFooter';
import { PremiumActivityHeader } from '../../components/officer/activity-workflow/PremiumActivityHeader';
import { PremiumActivityProgressCard } from '../../components/officer/activity-workflow/PremiumActivityProgressCard';
import {
  PremiumActivitySectionCard,
  type FarmActivitySectionStatus,
} from '../../components/officer/activity-workflow/PremiumActivitySectionCard';
import {
  FARM_VERIFICATION_STEPS,
  premiumWorkflowTheme,
} from '../../components/officer/activity-workflow/premiumActivityWorkflowTheme';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { pickString, type ApiRecord } from '../../utils/apiHelpers';
import {
  appendClientStampMetadata,
  buildFormDataFilePart,
  captureLivePhotoEvidence,
  pickStampedPhotoEvidence,
  type LiveCapturedEvidence,
} from '../../utils/liveEvidenceCapture';
import { captureHighAccuracyGps } from '../../utils/officerGpsCapture';
import { getLinearGradient } from '../../utils/nativeGlass';
import { isActiveFarmActivityBlockMessage, sanitizeFarmActivityError } from '../../utils/farmActivityMessage';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList, 'FarmVerificationActivity'>;
type ScreenRoute = RouteProp<FieldOfficerStackParamList, 'FarmVerificationActivity'>;

export type FarmActivityWorkflowState =
  | 'not_started'
  | 'started'
  | 'checked_in'
  | 'evidence_completed'
  | 'submitting'
  | 'submitted'
  | 'failed';

type GpsSnapshot = {
  latitude: number;
  longitude: number;
  accuracyM: number | null;
  altitude: number | null;
  capturedAt: string;
};

type SubmissionSummary = {
  activityId: number;
  farmerName: string;
  farmCode: string;
  status: string;
  submittedAt: string;
  cycleNumber?: number | null;
  activityType?: string | null;
  nextDueAt?: string | null;
};

type LocalPhoto = LiveCapturedEvidence & { localId: string };

const SECTION_KEYS = ['start', 'checkin', 'upload'] as const;

function mapBackendStatus(status: string): FarmActivityWorkflowState | null {
  const normalized = status.toLowerCase();
  if (normalized === 'submitted') {
    return 'submitted';
  }
  if (normalized === 'evidence_uploaded') {
    return 'evidence_completed';
  }
  // farm_verified maps to checked_in so Upload Photo stays unlocked without a Verify UI.
  if (normalized === 'farm_verified' || normalized === 'checked_in') {
    return 'checked_in';
  }
  if (normalized === 'started') {
    return 'started';
  }
  return null;
}

function progressForState(state: FarmActivityWorkflowState): number {
  switch (state) {
    case 'not_started':
    case 'failed':
      return 0;
    case 'started':
      return 33;
    case 'checked_in':
    case 'evidence_completed':
    case 'submitting':
      return 66;
    case 'submitted':
      return 100;
    default:
      return 0;
  }
}

function activeStepIndex(state: FarmActivityWorkflowState): number {
  switch (state) {
    case 'not_started':
    case 'failed':
      return 0;
    case 'started':
      return 1;
    case 'checked_in':
    case 'evidence_completed':
    case 'submitting':
    case 'submitted':
      return 2;
    default:
      return 0;
  }
}

function completedCountForState(state: FarmActivityWorkflowState): number {
  switch (state) {
    case 'started':
      return 1;
    case 'checked_in':
    case 'evidence_completed':
    case 'submitting':
      return 2;
    case 'submitted':
      return 3;
    default:
      return 0;
  }
}

function formatStamp(iso: string | null | undefined): string | null {
  if (!iso) {
    return null;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString();
}

function makeLocalId(): string {
  return `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readActivityTimestamp(activity: ApiRecord, key: string): string | null {
  const timeline = activity.timeline as ApiRecord | undefined;
  if (timeline) {
    const fromTimeline = pickString(timeline, key);
    if (fromTimeline !== '-') {
      return fromTimeline;
    }
  }

  const direct = pickString(activity, key);
  return direct !== '-' ? direct : null;
}

function applyActivityProgress(activity: ApiRecord): {
  activityId: number;
  mappedState: FarmActivityWorkflowState;
  farmCode: string | null;
  cycleNumber: number | null;
  activityType: string | null;
  dueAt: string | null;
  nextDueAt: string | null;
  startedAt: string | null;
  checkedInAt: string | null;
  evidenceAt: string | null;
} | null {
  const status = pickString(activity, 'status');
  const mapped = mapBackendStatus(status !== '-' ? status : '');
  if (!mapped) {
    return null;
  }

  const id = Number(activity.activity_id ?? activity.id);
  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }

  const code =
    pickString(activity, 'verified_farm_code') !== '-'
      ? pickString(activity, 'verified_farm_code')
      : pickString((activity.farm as ApiRecord) ?? {}, 'farm_code');

  const cycle = Number(activity.cycle_number ?? (activity.cycle as ApiRecord | undefined)?.cycle_number);
  const type = pickString(activity, 'activity_type');
  const due = pickString(activity, 'due_at');
  const nextDue = pickString(activity, 'next_due_at');

  return {
    activityId: id,
    mappedState: mapped,
    farmCode: code !== '-' ? code : null,
    cycleNumber: Number.isFinite(cycle) && cycle > 0 ? cycle : null,
    activityType: type !== '-' ? type : null,
    dueAt: due !== '-' ? due : null,
    nextDueAt: nextDue !== '-' ? nextDue : null,
    startedAt: readActivityTimestamp(activity, 'started_at'),
    checkedInAt: readActivityTimestamp(activity, 'checked_in_at'),
    evidenceAt: readActivityTimestamp(activity, 'evidence_uploaded_at'),
  };
}

export function FarmVerificationActivityScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<Record<string, number>>({});
  const actionScrollTokenRef = useRef<string | null>(null);
  const actionLockRef = useRef(false);
  const mountedRef = useRef(true);
  const returnToReviewLockRef = useRef(false);

  const [workflowState, setWorkflowState] = useState<FarmActivityWorkflowState>('not_started');
  const [failedSection, setFailedSection] = useState<(typeof SECTION_KEYS)[number] | null>(null);
  const [loading, setLoading] = useState(false);
  const [capturingPhoto, setCapturingPhoto] = useState(false);
  const [activityId, setActivityId] = useState<number | null>(null);
  const [farmCode, setFarmCode] = useState(route.params?.farmCode ?? '');
  const [startGps, setStartGps] = useState<GpsSnapshot | null>(null);
  const [checkInGps, setCheckInGps] = useState<GpsSnapshot | null>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [checkedInAt, setCheckedInAt] = useState<string | null>(null);
  const [evidenceAt, setEvidenceAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [submissionSummary, setSubmissionSummary] = useState<SubmissionSummary | null>(null);
  const [cycleNumber, setCycleNumber] = useState<number | null>(null);
  const [activityType, setActivityType] = useState<string | null>(null);
  const [dueAt, setDueAt] = useState<string | null>(null);
  const [nextDueAt, setNextDueAt] = useState<string | null>(null);
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);

  const farmerName = route.params?.farmerName ?? 'Farmer';
  const village = route.params?.village?.trim() || '—';
  const lockedFarmLabel = route.params?.farmCode || String(route.params?.farmId ?? '');
  const farmLocked = workflowState !== 'not_started' && workflowState !== 'failed';
  const readOnly = workflowState === 'submitted';
  const progressPercent = progressForState(workflowState);
  const currentStep = activeStepIndex(workflowState);
  const completedCount = completedCountForState(workflowState);
  const showStartCheckinFooter =
    !readOnly && (workflowState === 'not_started' || workflowState === 'started' || failedSection === 'start' || failedSection === 'checkin');

  const footerLabel = useMemo(() => {
    if (failedSection === 'start' || workflowState === 'not_started') {
      return 'Start Activity';
    }
    if (failedSection === 'checkin' || workflowState === 'started') {
      return 'Check-in';
    }
    return 'Continue';
  }, [failedSection, workflowState]);

  const sectionStatus = useCallback(
    (key: (typeof SECTION_KEYS)[number]): FarmActivitySectionStatus => {
      if (failedSection === key && error) {
        return 'error';
      }
      const order = SECTION_KEYS.indexOf(key);
      const done = completedCountForState(workflowState);
      if (order < done) {
        return 'completed';
      }
      if (workflowState === 'submitting' && key === 'upload') {
        return 'in_progress';
      }
      if (order === activeStepIndex(workflowState) && workflowState !== 'submitted') {
        return loading ? 'in_progress' : 'ready';
      }
      return 'locked';
    },
    [error, failedSection, loading, workflowState],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const scrollToSection = useCallback((key: string) => {
    const y = sectionY.current[key];
    if (y == null) {
      return;
    }
    scrollRef.current?.scrollTo({ y: Math.max(y - 12, 0), animated: true });
  }, []);

  const queueScrollTo = useCallback(
    (key: string) => {
      actionScrollTokenRef.current = key;
      requestAnimationFrame(() => {
        if (actionScrollTokenRef.current === key) {
          scrollToSection(key);
          actionScrollTokenRef.current = null;
        }
      });
    },
    [scrollToSection],
  );

  const onSectionLayout = useCallback((key: string, event: LayoutChangeEvent) => {
    sectionY.current[key] = event.nativeEvent.layout.y;
  }, []);

  const refreshGps = useCallback(async () => {
    const gps = await captureHighAccuracyGps();
    return {
      latitude: gps.latitude,
      longitude: gps.longitude,
      accuracyM: gps.accuracyM,
      altitude: gps.altitude,
      capturedAt: new Date().toISOString(),
    } satisfies GpsSnapshot;
  }, []);

  const hydrateFromActivity = useCallback(
    async (id: number) => {
      try {
        const response = await getFarmVerificationActivity(id);
        const activity = ((response as ApiRecord).activity ?? response) as ApiRecord;
        const progress = applyActivityProgress(activity);
        if (!progress) {
          return;
        }

        setActivityId(progress.activityId);
        if (progress.farmCode) {
          setFarmCode(progress.farmCode);
        }
        setStartedAt(progress.startedAt);
        setCheckedInAt(progress.checkedInAt);
        setEvidenceAt(progress.evidenceAt);
        setCycleNumber(progress.cycleNumber);
        setActivityType(progress.activityType);
        setDueAt(progress.dueAt);
        setNextDueAt(progress.nextDueAt);
        if (progress.mappedState === 'submitted') {
          setSubmissionSummary({
            activityId: progress.activityId,
            farmerName,
            farmCode: farmCode || lockedFarmLabel || '—',
            status: 'submitted',
            submittedAt: readActivityTimestamp(activity, 'submitted_at') ?? new Date().toISOString(),
            cycleNumber: progress.cycleNumber,
            activityType: progress.activityType,
            nextDueAt: progress.nextDueAt,
          });
        }
        setWorkflowState(progress.mappedState);
        setFailedSection(null);
        setError(null);
      } catch {
        // Ignore hydrate failures — user can continue from local state.
      }
    },
    [farmCode, farmerName, lockedFarmLabel],
  );

  useEffect(() => {
    if (activityId) {
      void hydrateFromActivity(activityId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStart = useCallback(async () => {
    if (actionLockRef.current || activityId) {
      if (activityId && workflowState === 'not_started') {
        setWorkflowState('started');
        queueScrollTo('checkin');
      }
      return;
    }
    actionLockRef.current = true;
    setLoading(true);
    setError(null);
    setInfoMessage(null);
    setFailedSection(null);
    try {
      const gps = await refreshGps();
      const response = (await startFarmVerificationActivity({
        visit_assignment_id: route.params?.assignmentId,
        farmer_id: route.params.farmerId,
        farm_id: route.params.farmId,
        start_latitude: gps.latitude,
        start_longitude: gps.longitude,
        start_gps_accuracy: gps.accuracyM,
      })) as ApiRecord;
      const activity = (response.activity ?? response) as ApiRecord;
      const resumed = Boolean(response.resumed);
      const progress = applyActivityProgress(activity);

      if (!progress) {
        throw new Error('Unable to load Farm Activity progress.');
      }

      setActivityId(progress.activityId);
      if (progress.farmCode) {
        setFarmCode(progress.farmCode);
      }
      setStartGps(gps);
      setStartedAt(progress.startedAt ?? new Date().toISOString());
      setCheckedInAt(progress.checkedInAt);
      setEvidenceAt(progress.evidenceAt);
      setCycleNumber(progress.cycleNumber);
      setActivityType(progress.activityType);
      setDueAt(progress.dueAt);
      setNextDueAt(progress.nextDueAt);
      setWorkflowState(progress.mappedState === 'not_started' ? 'started' : progress.mappedState);
      setFailedSection(null);
      setError(null);

      if (resumed) {
        setInfoMessage('Existing activity resumed.');
      }

      const scrollTarget =
        progress.mappedState === 'checked_in' || progress.mappedState === 'evidence_completed'
          ? 'upload'
          : progress.mappedState === 'started'
            ? 'checkin'
            : 'checkin';
      queueScrollTo(scrollTarget);
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to start activity.');
      if (isActiveFarmActivityBlockMessage(message)) {
        setFailedSection(null);
        setError(null);
        setInfoMessage('Existing activity found. Restoring progress…');

        try {
          // Current API is idempotent and returns the existing activity on start.
          const gps = await refreshGps();
          const response = (await startFarmVerificationActivity({
            visit_assignment_id: route.params?.assignmentId,
            farmer_id: route.params.farmerId,
            farm_id: route.params.farmId,
            start_latitude: gps.latitude,
            start_longitude: gps.longitude,
            start_gps_accuracy: gps.accuracyM,
          })) as ApiRecord;
          const activity = (response.activity ?? response) as ApiRecord;
          const progress = applyActivityProgress(activity);
          if (progress) {
            setActivityId(progress.activityId);
            if (progress.farmCode) {
              setFarmCode(progress.farmCode);
            }
            setStartGps(gps);
            setStartedAt(progress.startedAt ?? new Date().toISOString());
            setCheckedInAt(progress.checkedInAt);
            setEvidenceAt(progress.evidenceAt);
            setCycleNumber(progress.cycleNumber);
            setActivityType(progress.activityType);
            setDueAt(progress.dueAt);
            setNextDueAt(progress.nextDueAt);
            setWorkflowState(progress.mappedState === 'not_started' ? 'started' : progress.mappedState);
            setInfoMessage('Existing activity resumed.');
            const scrollTarget =
              progress.mappedState === 'checked_in' || progress.mappedState === 'evidence_completed'
                ? 'upload'
                : 'checkin';
            queueScrollTo(scrollTarget);
            return;
          }
        } catch {
          // Fall through to non-blocking info.
        }

        setInfoMessage('Existing activity resumed. Tap Start Activity again if the next step did not unlock.');
        return;
      }

      setFailedSection('start');
      setError(sanitizeFarmActivityError(message, 'Failed to start activity.'));
    } finally {
      actionLockRef.current = false;
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [activityId, queueScrollTo, refreshGps, route.params, workflowState]);

  const handleCheckIn = useCallback(async () => {
    if (!activityId || actionLockRef.current || completedCount >= 2) {
      if (completedCount >= 2) {
        queueScrollTo('upload');
      }
      return;
    }
    actionLockRef.current = true;
    setLoading(true);
    setError(null);
    setFailedSection(null);
    try {
      const gps = await refreshGps();
      await checkInFarmVerificationActivity(activityId, {
        latitude: gps.latitude,
        longitude: gps.longitude,
        altitude: gps.altitude,
        gps_accuracy: gps.accuracyM,
      });
      setCheckInGps(gps);
      setCheckedInAt(new Date().toISOString());
      setWorkflowState('checked_in');
      queueScrollTo('upload');
    } catch (err) {
      setFailedSection('checkin');
      setError(getApiErrorMessage(err, 'Check-in failed.'));
    } finally {
      actionLockRef.current = false;
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [activityId, completedCount, queueScrollTo, refreshGps]);

  const addPhotoFromResult = useCallback((evidence: LiveCapturedEvidence) => {
    setPhotos((prev) => [...prev, { ...evidence, localId: makeLocalId() }]);
    setError(null);
    setFailedSection(null);
  }, []);

  const handleCapturePhoto = useCallback(async () => {
    if (readOnly || capturingPhoto) {
      return;
    }
    setCapturingPhoto(true);
    setError(null);
    try {
      const result = await captureLivePhotoEvidence({ defaultName: 'farm-photo.jpg' });
      if (result.ok) {
        addPhotoFromResult(result.evidence);
      } else if (!result.cancelled && result.error) {
        setError(result.error);
        setFailedSection('upload');
      }
    } finally {
      if (mountedRef.current) {
        setCapturingPhoto(false);
      }
    }
  }, [addPhotoFromResult, capturingPhoto, readOnly]);

  const handlePickPhoto = useCallback(async () => {
    if (readOnly || capturingPhoto) {
      return;
    }
    setCapturingPhoto(true);
    setError(null);
    try {
      const result = await pickStampedPhotoEvidence({ defaultName: 'farm-photo.jpg' });
      if (result.ok) {
        addPhotoFromResult(result.evidence);
      } else if (!result.cancelled && result.error) {
        setError(result.error);
        setFailedSection('upload');
      }
    } finally {
      if (mountedRef.current) {
        setCapturingPhoto(false);
      }
    }
  }, [addPhotoFromResult, capturingPhoto, readOnly]);

  const handleRemovePhoto = useCallback((localId: string) => {
    setPhotos((prev) => prev.filter((photo) => photo.localId !== localId));
  }, []);

  const returnToReview = Boolean(route.params?.returnToReview);

  const goToDashboard = useCallback(() => {
    // Phase 10.12: Farm Activity launched from Review & Submit must return to the
    // Review screen (still in this same stack) instead of resetting to a dashboard.
    if (returnToReview) {
      if (returnToReviewLockRef.current) {
        return;
      }
      returnToReviewLockRef.current = true;
      navigation.navigate('FarmerOnboardingReview');
      setTimeout(() => {
        returnToReviewLockRef.current = false;
      }, 600);
      return;
    }
    const routeNames = navigation.getState()?.routeNames ?? [];
    if (routeNames.includes('ArtisanDashboard' as never)) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'ArtisanDashboard' as never }],
        }),
      );
      return;
    }
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'FieldOfficerTabs', params: { screen: 'Home' } }],
      }),
    );
  }, [navigation, returnToReview]);

  const goToFarmActivities = useCallback(() => {
    if (returnToReview) {
      if (returnToReviewLockRef.current) {
        return;
      }
      returnToReviewLockRef.current = true;
      navigation.navigate('FarmerOnboardingReview');
      setTimeout(() => {
        returnToReviewLockRef.current = false;
      }, 600);
      return;
    }
    const routeNames = navigation.getState()?.routeNames ?? [];
    if (routeNames.includes('ArtisanDashboard' as never)) {
      navigation.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [
            { name: 'ArtisanDashboard' as never },
            { name: 'FieldOfficerFarmActivityStart' as never },
          ],
        }),
      );
      return;
    }
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [
          { name: 'FieldOfficerTabs', params: { screen: 'Home' } },
          { name: 'FieldOfficerFarmActivityStart' },
        ],
      }),
    );
  }, [navigation, returnToReview]);

  const handleSubmit = useCallback(async () => {
    if (!activityId || actionLockRef.current || readOnly || workflowState === 'submitting') {
      return;
    }
    if (workflowState === 'not_started' || !startedAt) {
      setError('Start Activity before submitting.');
      setFailedSection('start');
      return;
    }
    if (completedCount < 2 || !checkedInAt) {
      setError('Complete Check-in before submitting.');
      setFailedSection('checkin');
      return;
    }
    if (photos.length < 1) {
      setError('Please upload at least 1 photo before submitting.');
      setFailedSection('upload');
      return;
    }

    actionLockRef.current = true;
    setLoading(true);
    setWorkflowState('submitting');
    setError(null);
    setFailedSection(null);

    try {
      for (let index = 0; index < photos.length; index += 1) {
        const photo = photos[index];
        const formData = new FormData();
        formData.append(
          'evidence_image',
          buildFormDataFilePart(photo.previewUri, `farm-photo-${index + 1}.jpg`, 'image/jpeg') as unknown as Blob,
        );
        appendClientStampMetadata(formData, photo);
        await uploadFarmVerificationEvidence(activityId, formData);
      }

      setEvidenceAt(new Date().toISOString());

      const response = await submitFarmVerificationActivity(activityId);
      const activity = ((response as ApiRecord).activity ?? response) as ApiRecord;
      const status = pickString(activity, 'status');
      const submittedAt =
        pickString(activity, 'submitted_at', 'submittedAt') !== '-'
          ? pickString(activity, 'submitted_at', 'submittedAt')
          : new Date().toISOString();

      if (status !== '-' && status.toLowerCase() !== 'submitted') {
        throw new Error('Submission response did not confirm a submitted status.');
      }

      setSubmissionSummary({
        activityId: Number(activity.activity_id ?? activity.id ?? activityId),
        farmerName,
        farmCode: farmCode || lockedFarmLabel || '—',
        status: status !== '-' ? status : 'submitted',
        submittedAt,
        cycleNumber: Number(activity.cycle_number) || cycleNumber,
        activityType:
          pickString(activity, 'activity_type') !== '-'
            ? pickString(activity, 'activity_type')
            : activityType,
        nextDueAt:
          pickString(activity, 'next_due_at') !== '-'
            ? pickString(activity, 'next_due_at')
            : ((activity.cycle as ApiRecord | undefined)?.next_due_at as string | undefined) ?? null,
      });
      setNextDueAt(pickString(activity, 'next_due_at') !== '-' ? pickString(activity, 'next_due_at') : null);
      setWorkflowState('submitted');
      Alert.alert('Success', 'Farm activity submitted successfully.', [
        { text: 'OK', onPress: goToFarmActivities },
      ]);
    } catch (err) {
      setFailedSection('upload');
      setWorkflowState('checked_in');
      setError(getApiErrorMessage(err, 'Submit failed.'));
    } finally {
      actionLockRef.current = false;
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [
    activityId,
    activityType,
    checkedInAt,
    completedCount,
    cycleNumber,
    farmCode,
    farmerName,
    goToFarmActivities,
    lockedFarmLabel,
    photos,
    readOnly,
    startedAt,
    workflowState,
  ]);

  const handlePrimary = useCallback(() => {
    if (loading || actionLockRef.current || readOnly) {
      return;
    }
    if (failedSection === 'start' || workflowState === 'not_started') {
      void handleStart();
      return;
    }
    if (failedSection === 'checkin' || workflowState === 'started') {
      void handleCheckIn();
    }
  }, [failedSection, handleCheckIn, handleStart, loading, readOnly, workflowState]);

  const primaryDisabled = useMemo(() => {
    return loading || readOnly || workflowState === 'submitting';
  }, [loading, readOnly, workflowState]);

  const submitDisabled =
    loading ||
    readOnly ||
    workflowState === 'submitting' ||
    photos.length < 1 ||
    !activityId ||
    completedCount < 2;

  const LinearGradient = getLinearGradient();
  const gradientColors = premiumWorkflowTheme.gradient;
  const cycleLabel = cycleNumber
    ? `Cycle ${cycleNumber}${activityType === 'initial' ? ' · Initial' : activityType === 'recurring' ? ' · Recurring' : ''}`
    : activityType === 'initial'
      ? 'Initial cycle'
      : null;
  const dueLabel = dueAt ? `Due ${formatStamp(dueAt) ?? dueAt}` : null;
  const subtitle = [
    `Selected Farm: ${lockedFarmLabel || '-'}`,
    farmerName,
    village,
    cycleLabel,
    dueLabel,
  ]
    .filter(Boolean)
    .join(' · ');

  const gpsForCheckIn = checkInGps;
  const nowDate = new Date().toLocaleDateString();
  const nowTime = new Date().toLocaleTimeString();

  return (
    <View style={styles.root}>
      {LinearGradient ? (
        <LinearGradient colors={[...gradientColors]} style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: gradientColors[0] ?? '#F0F9F3' }]} />
      )}

      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <PremiumActivityHeader title="Farm Activity" subtitle={subtitle} onBack={() => navigation.goBack()} />

        <KeyboardSafeScrollView
          ref={scrollRef}
          extraBottomPadding={0}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + (showStartCheckinFooter ? 130 : 28) },
          ]}
          showsVerticalScrollIndicator={false}
        >
            <PremiumActivityProgressCard
              steps={FARM_VERIFICATION_STEPS}
              completedCount={completedCount}
              currentStep={currentStep}
              progressPercent={progressPercent}
              progressLabel="Farm Activity Progress"
              onStepPress={(index) => {
                if (index < completedCount || index === currentStep) {
                  scrollToSection(SECTION_KEYS[index]);
                }
              }}
            />

            {infoMessage ? (
              <View style={styles.globalInfo}>
                <Text style={styles.globalInfoText}>{infoMessage}</Text>
              </View>
            ) : null}

            {error ? (
              <View style={styles.globalError}>
                <Text style={styles.globalErrorText}>{error}</Text>
              </View>
            ) : null}

            <View onLayout={(e) => onSectionLayout('start', e)}>
              <PremiumActivitySectionCard
                stepIndex={0}
                step={FARM_VERIFICATION_STEPS[0]}
                status={sectionStatus('start')}
                lockedReason="Ready when you are."
                completedAt={formatStamp(startedAt)}
                summaryLines={[
                  `Farmer: ${farmerName}`,
                  `Farm: ${lockedFarmLabel || farmCode || '—'}`,
                  `Village: ${village}`,
                  startGps
                    ? `Start GPS: ${startGps.latitude.toFixed(5)}, ${startGps.longitude.toFixed(5)} (±${startGps.accuracyM?.toFixed(1) ?? '—'} m)`
                    : 'Start GPS: pending',
                ]}
                error={failedSection === 'start' ? error : null}
                onRetry={() => void handleStart()}
              >
                {sectionStatus('start') === 'completed' ? null : (
                  <PremiumInfoPanel
                    title="Start Farm Activity"
                    lines={[
                      `Farmer: ${farmerName}`,
                      `Farm ID: ${lockedFarmLabel || '—'}`,
                      `Village: ${village}`,
                      `Date: ${nowDate}`,
                      `Time: ${nowTime}`,
                      farmLocked ? 'Farm selection is locked.' : 'Farm selection locks after Start.',
                    ]}
                  />
                )}
              </PremiumActivitySectionCard>
            </View>

            <View onLayout={(e) => onSectionLayout('checkin', e)}>
              <PremiumActivitySectionCard
                stepIndex={1}
                step={FARM_VERIFICATION_STEPS[1]}
                status={sectionStatus('checkin')}
                lockedReason="Complete Start Activity to unlock Check-in."
                completedAt={formatStamp(checkedInAt)}
                summaryLines={[
                  gpsForCheckIn
                    ? `Lat: ${gpsForCheckIn.latitude.toFixed(6)}`
                    : 'Latitude: pending',
                  gpsForCheckIn
                    ? `Lng: ${gpsForCheckIn.longitude.toFixed(6)}`
                    : 'Longitude: pending',
                  gpsForCheckIn
                    ? `Accuracy: ±${gpsForCheckIn.accuracyM?.toFixed(1) ?? '—'} m`
                    : 'GPS accuracy: pending',
                  checkedInAt ? `Check-in time: ${formatStamp(checkedInAt)}` : 'Check-in time: pending',
                ]}
                error={failedSection === 'checkin' ? error : null}
                onRetry={() => void handleCheckIn()}
              >
                {sectionStatus('checkin') === 'completed' ? null : (
                  <View style={styles.checkinFields}>
                    <PremiumReadonlyField
                      label="Latitude"
                      value={gpsForCheckIn ? gpsForCheckIn.latitude.toFixed(6) : 'Will capture on Check-in'}
                    />
                    <PremiumReadonlyField
                      label="Longitude"
                      value={gpsForCheckIn ? gpsForCheckIn.longitude.toFixed(6) : 'Will capture on Check-in'}
                    />
                    <PremiumReadonlyField
                      label="GPS accuracy"
                      value={
                        gpsForCheckIn
                          ? `±${gpsForCheckIn.accuracyM?.toFixed(1) ?? '—'} m`
                          : 'Will capture on Check-in'
                      }
                    />
                    <PremiumReadonlyField
                      label="Check-in time"
                      value={formatStamp(checkedInAt) ?? 'Will set on Check-in'}
                    />
                  </View>
                )}
              </PremiumActivitySectionCard>
            </View>

            <View onLayout={(e) => onSectionLayout('upload', e)}>
              <PremiumActivitySectionCard
                stepIndex={2}
                step={FARM_VERIFICATION_STEPS[2]}
                status={sectionStatus('upload')}
                lockedReason="Complete Check-in to unlock Upload Photo."
                completedAt={formatStamp(evidenceAt) ?? formatStamp(submissionSummary?.submittedAt)}
                summaryLines={[
                  photos.length > 0 ? `Photos ready: ${photos.length}` : 'Photos: none yet',
                  'At least 1 photo is required to submit.',
                ]}
                error={failedSection === 'upload' ? error : null}
                onRetry={() => void handleSubmit()}
              >
                {workflowState === 'submitted' && submissionSummary ? (
                  <View style={styles.successCard}>
                    <Text style={styles.successTitle}>Farm activity submitted successfully.</Text>
                    <Text style={styles.summaryLine}>Activity ID: {submissionSummary.activityId}</Text>
                    {submissionSummary.cycleNumber ? (
                      <Text style={styles.summaryLine}>Cycle: {submissionSummary.cycleNumber}</Text>
                    ) : null}
                    <Text style={styles.summaryLine}>Farmer: {submissionSummary.farmerName}</Text>
                    <Text style={styles.summaryLine}>Farm ID: {submissionSummary.farmCode}</Text>
                    <Text style={styles.summaryLine}>
                      Completed: {formatStamp(submissionSummary.submittedAt) ?? '—'}
                    </Text>
                    <Text style={styles.summaryLine}>
                      Next due: {formatStamp(submissionSummary.nextDueAt ?? nextDueAt) ?? '—'}
                    </Text>
                    {returnToReview ? (
                      <Pressable style={styles.secondaryChip} onPress={goToDashboard}>
                        <Text style={styles.secondaryChipText}>Back to Review &amp; Submit</Text>
                      </Pressable>
                    ) : (
                      <>
                        <Pressable style={styles.secondaryChip} onPress={goToFarmActivities}>
                          <Text style={styles.secondaryChipText}>Back to Farm Activities</Text>
                        </Pressable>
                        <Pressable style={styles.secondaryChip} onPress={goToDashboard}>
                          <Text style={styles.secondaryChipText}>Go to Dashboard</Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                ) : (
                  <View style={styles.uploadWrap}>
                    {!readOnly ? (
                      <View style={styles.photoActions}>
                        <AppButton
                          label={capturingPhoto ? 'Opening…' : 'Capture Photo'}
                          onPress={() => void handleCapturePhoto()}
                          loading={capturingPhoto}
                          disabled={capturingPhoto || loading}
                          style={styles.photoActionBtn}
                        />
                        <AppButton
                          label="Upload from Gallery"
                          onPress={() => void handlePickPhoto()}
                          variant="secondary"
                          disabled={capturingPhoto || loading}
                          style={styles.photoActionBtn}
                        />
                      </View>
                    ) : null}

                    {photos.length > 0 ? (
                      <View style={styles.photoGrid}>
                        {photos.map((photo) => (
                          <View key={photo.localId} style={styles.photoCard}>
                            <Pressable
                              onPress={() => {
                                const routeNames = navigation.getState()?.routeNames ?? [];
                                if (routeNames.includes('OfficerFullscreenImage')) {
                                  navigation.navigate('OfficerFullscreenImage', {
                                    uri: photo.previewUri,
                                    title: 'Farm Photo',
                                  });
                                  return;
                                }
                                if (routeNames.includes('FullscreenImage')) {
                                  navigation.navigate('FullscreenImage' as never, {
                                    uri: photo.previewUri,
                                    title: 'Farm Photo',
                                  } as never);
                                }
                              }}
                            >
                              <Image source={{ uri: photo.previewUri }} style={styles.photoThumb} />
                            </Pressable>
                            {!readOnly ? (
                              <Pressable
                                style={styles.removePhotoBtn}
                                onPress={() => handleRemovePhoto(photo.localId)}
                              >
                                <Text style={styles.removePhotoText}>Remove</Text>
                              </Pressable>
                            ) : null}
                          </View>
                        ))}
                      </View>
                    ) : (
                      <PremiumInfoPanel
                        title="Photos"
                        lines={['Capture or upload one or more farm photos.', 'Submit stays locked until at least 1 photo is added.']}
                      />
                    )}

                    {!readOnly ? (
                      <View style={[styles.submitWrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
                        <AppButton
                          label={workflowState === 'submitting' ? 'Submitting…' : 'Submit'}
                          onPress={() => void handleSubmit()}
                          loading={workflowState === 'submitting' || loading}
                          disabled={submitDisabled}
                        />
                      </View>
                    ) : null}
                  </View>
                )}
              </PremiumActivitySectionCard>
            </View>
          </KeyboardSafeScrollView>

        {showStartCheckinFooter ? (
          <PremiumActivityFooter
            showPrevious={false}
            primaryLabel={footerLabel}
            onPrimary={handlePrimary}
            primaryDisabled={primaryDisabled}
            loading={loading}
            loadingLabel="Please wait…"
          />
        ) : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  globalError: {
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.15)',
  },
  globalErrorText: {
    color: '#BA1A1A',
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 18,
  },
  globalInfo: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(14, 116, 144, 0.2)',
  },
  globalInfoText: {
    color: '#0E7490',
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 18,
  },
  checkinFields: { gap: 10 },
  uploadWrap: { gap: 12 },
  photoActions: { gap: 8 },
  photoActionBtn: { width: '100%' },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoCard: {
    width: '47%',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: premiumWorkflowTheme.glassBorder,
    backgroundColor: '#FFFFFF',
  },
  photoThumb: {
    width: '100%',
    height: 120,
    backgroundColor: '#E8EEE9',
  },
  removePhotoBtn: {
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
  },
  removePhotoText: {
    color: '#BA1A1A',
    fontWeight: '700',
    fontSize: 12,
  },
  submitWrap: {
    marginTop: 4,
    gap: 8,
  },
  secondaryChip: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: premiumWorkflowTheme.glassBorder,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    marginTop: 4,
  },
  secondaryChipText: {
    color: premiumWorkflowTheme.primaryGreen,
    fontWeight: '700',
    fontSize: 14,
  },
  successCard: {
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  successTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 4,
  },
  summaryLine: {
    fontSize: 13,
    fontWeight: '600',
    color: premiumWorkflowTheme.textSecondary,
    lineHeight: 18,
  },
});
