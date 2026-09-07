import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppButton } from '../../components/AppButton';
import { EmptyState } from '../../components/EmptyState';
import { FormSelect, type SelectOption } from '../../components/FormSelect';
import { LoadingState } from '../../components/LoadingState';
import { LiveEvidenceCaptureCard } from '../../components/evidence/LiveEvidenceCaptureCard';
import { KeyboardSafeScrollView } from '../../components/layout/KeyboardSafeScrollView';
import {
  PremiumInfoPanel,
  PremiumReadonlyField,
} from '../../components/officer/activity-workflow/PremiumActivityFormFields';
import { PremiumActivityFooter } from '../../components/officer/activity-workflow/PremiumActivityFooter';
import { PremiumActivityHeader } from '../../components/officer/activity-workflow/PremiumActivityHeader';
import { PremiumActivityProgressCard } from '../../components/officer/activity-workflow/PremiumActivityProgressCard';
import { PremiumActivitySectionCard } from '../../components/officer/activity-workflow/PremiumActivitySectionCard';
import {
  FARM_VERIFICATION_STEPS,
  premiumWorkflowTheme,
} from '../../components/officer/activity-workflow/premiumActivityWorkflowTheme';
import { useFarmerFarmActivityForm } from '../../hooks/useFarmerFarmActivityForm';
import { useTranslation } from '../../i18n/I18nContext';
import type { FarmerStackParamList } from '../../navigation/types';
import { formatFarmDisplayId, formatFarmerDisplayId } from '../../utils/displayIds';
import { formatLocalizedDate } from '../../utils/localizedDate';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmerFarmActivity'>;
type WorkflowStep = 'start' | 'checkin' | 'upload';

function farmOptionLabel(farm: { farmId: number; farmCode: string; farmName: string; village: string }): string {
  const code = farm.farmCode && farm.farmCode !== '-' ? farm.farmCode : `Farm ${farm.farmId}`;
  const name = farm.farmName && farm.farmName !== '-' ? farm.farmName : farm.village;
  return name && name !== '-' ? `${code} - ${name}` : code;
}

export function FarmerFarmActivityScreen({ navigation, route }: Props) {
  const { t, language } = useTranslation();
  const insets = useSafeAreaInsets();
  const form = useFarmerFarmActivityForm({ farmId: route.params?.farmId, activityId: route.params?.activityId });
  const farm = form.selectedFarm;
  const readOnly = form.status === 'submitted';
  const [started, setStarted] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);

  useEffect(() => {
    if (form.status === 'submitted') {
      setStarted(true);
      setCheckedIn(true);
      return;
    }
    if (form.latitude != null && form.longitude != null) {
      setStarted(true);
      setCheckedIn(true);
    }
  }, [form.latitude, form.longitude, form.status]);

  const farmSelectOptions: SelectOption[] = form.farms.map((item) => ({
    id: item.farmId,
    name: farmOptionLabel(item),
  }));

  const showFarmSelector = !readOnly && form.farms.length > 1;
  const farmLocked = started || readOnly;

  const farmerLabel = farm
    ? formatFarmerDisplayId({
        farmer_code: farm.farmerCode,
        farmer_id: farm.farmerId,
      })
    : '—';
  const farmLabel = farm
    ? formatFarmDisplayId({
        farm_code: farm.farmCode,
        farm_id: farm.farmId,
      })
    : '—';

  const currentStep: WorkflowStep = !started ? 'start' : !checkedIn ? 'checkin' : 'upload';
  const completedCount = readOnly ? 3 : started && checkedIn ? 2 : started ? 1 : 0;
  const currentStepIndex = currentStep === 'start' ? 0 : currentStep === 'checkin' ? 1 : 2;
  const progressPercent = readOnly ? 100 : currentStep === 'start' ? 0 : currentStep === 'checkin' ? 33 : 66;

  const hasPhoto = Boolean(form.liveEvidence.evidence || form.liveEvidence.pendingEvidence);
  const showFooter = !readOnly && farm != null && currentStep !== 'upload';

  const subtitle = useMemo(() => {
    if (!farm) {
      return t('farmer.activity.subtitle');
    }
    return [farmLabel, farm.farmerName !== '-' ? farm.farmerName : null, farm.village !== '-' ? farm.village : null]
      .filter(Boolean)
      .join(' · ');
  }, [farm, farmLabel, t]);

  const handleStart = async () => {
    if (!farm) {
      return;
    }
    const ok = await form.captureGps();
    if (ok) {
      setStarted(true);
    }
  };

  const handleCheckIn = async () => {
    const ok = await form.captureGps();
    if (ok) {
      setCheckedIn(true);
    }
  };

  const handleSubmit = async () => {
    const success = await form.submit();
    if (success) {
      Alert.alert(t('farmer.activity.submittedTitle'), t('farmer.activity.submittedMessage'), [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  };

  if (form.loading) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <LoadingState message={t('farmer.activity.loading')} />
      </SafeAreaView>
    );
  }

  if (form.farms.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <PremiumActivityHeader
          title={t('farmer.activity.title')}
          subtitle={t('farmer.activity.subtitle')}
          onBack={() => navigation.goBack()}
        />
        <EmptyState
          title={t('farmer.farmSelection.emptyTitle')}
          message={t('farmer.activity.noRegisteredFarm')}
        />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: premiumWorkflowTheme.gradient[0] }]} />
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <PremiumActivityHeader title={t('farmer.activity.title')} subtitle={subtitle} onBack={() => navigation.goBack()} />

        <KeyboardSafeScrollView
          extraBottomPadding={0}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + (showFooter ? 130 : 28) }]}
          showsVerticalScrollIndicator={false}
        >
            {showFarmSelector ? (
              <FormSelect
                label={t('farmer.farmSelection.title')}
                placeholder={t('farmer.farmSelection.selectFarm')}
                value={farm ? String(farm.farmId) : ''}
                displayValue={farm ? farmOptionLabel(farm) : undefined}
                options={farmSelectOptions}
                disabled={farmLocked}
                onSelect={(option) => form.setSelectedFarmId(option.id)}
              />
            ) : null}

            {!farm ? (
              <EmptyState
                title={t('farmer.farmSelection.title')}
                message={t('farmer.activity.selectFarmHelper')}
              />
            ) : (
              <>
                <PremiumActivityProgressCard
                  steps={FARM_VERIFICATION_STEPS}
                  completedCount={completedCount}
                  currentStep={currentStepIndex}
                  progressPercent={progressPercent}
                  progressLabel={t('farmer.activity.progress')}
                />

                {form.error ? (
                  <View style={styles.globalError}>
                    <Text style={styles.globalErrorText}>{form.error}</Text>
                  </View>
                ) : null}

                <PremiumActivitySectionCard
                  stepIndex={0}
                  step={FARM_VERIFICATION_STEPS[0]}
                  status={started || readOnly ? 'completed' : 'in_progress'}
                  completedAt={started ? formatLocalizedDate(form.activityDate, language) : undefined}
                  summaryLines={[
                    `${t('farmer.activity.farmerName')}: ${farm.farmerName !== '-' ? farm.farmerName : '—'}`,
                    `${t('farmer.activity.farmId')}: ${farmLabel}`,
                    `${t('farmer.activity.village')}: ${farm.village !== '-' ? farm.village : '—'}`,
                  ]}
                >
                  {started || readOnly ? null : (
                    <PremiumInfoPanel
                      title={t('farmer.activity.farmSummary')}
                      lines={[
                        `${t('farmer.activity.farmerName')}: ${farm.farmerName !== '-' ? farm.farmerName : '—'}`,
                        `${t('farmer.activity.farmerId')}: ${farmerLabel}`,
                        `${t('farmer.activity.farmId')}: ${farmLabel}`,
                        `${t('farmer.activity.village')}: ${farm.village !== '-' ? farm.village : '—'}`,
                        `${t('farmer.activity.activityDate')}: ${formatLocalizedDate(form.activityDate, language)}`,
                      ]}
                    />
                  )}
                </PremiumActivitySectionCard>

                <PremiumActivitySectionCard
                  stepIndex={1}
                  step={FARM_VERIFICATION_STEPS[1]}
                  status={checkedIn || readOnly ? 'completed' : started ? 'in_progress' : 'locked'}
                  lockedReason={t('farmer.activity.checkInLocked')}
                  completedAt={checkedIn ? formatLocalizedDate(form.capturedAt, language) : undefined}
                  summaryLines={[
                    form.latitude != null ? `${t('farmer.activity.latitude')}: ${form.latitude.toFixed(6)}` : `${t('farmer.activity.latitude')}: —`,
                    form.longitude != null ? `${t('farmer.activity.longitude')}: ${form.longitude.toFixed(6)}` : `${t('farmer.activity.longitude')}: —`,
                    form.accuracy != null
                      ? `${t('farmer.activity.gpsAccuracy')}: ±${form.accuracy.toFixed(1)} m`
                      : `${t('farmer.activity.gpsAccuracy')}: —`,
                  ]}
                >
                  {checkedIn || readOnly ? null : (
                    <View style={styles.checkinFields}>
                      <PremiumReadonlyField
                        label={t('farmer.activity.latitude')}
                        value={form.latitude != null ? form.latitude.toFixed(6) : t('farmer.activity.gpsPending')}
                      />
                      <PremiumReadonlyField
                        label={t('farmer.activity.longitude')}
                        value={form.longitude != null ? form.longitude.toFixed(6) : t('farmer.activity.gpsPending')}
                      />
                      <PremiumReadonlyField
                        label={t('farmer.activity.gpsAccuracy')}
                        value={form.accuracy != null ? `±${form.accuracy.toFixed(1)} m` : t('farmer.activity.gpsPending')}
                      />
                    </View>
                  )}
                </PremiumActivitySectionCard>

                <PremiumActivitySectionCard
                  stepIndex={2}
                  step={FARM_VERIFICATION_STEPS[2]}
                  status={readOnly ? 'completed' : checkedIn ? 'in_progress' : 'locked'}
                  lockedReason={t('farmer.activity.photoLocked')}
                  summaryLines={[
                    hasPhoto ? t('farmer.activity.photoReady') : t('farmer.activity.photoEmpty'),
                  ]}
                >
                  <LiveEvidenceCaptureCard
                    title={t('farmer.activity.photo')}
                    evidence={form.liveEvidence.evidence}
                    pendingEvidence={form.liveEvidence.pendingEvidence}
                    capturing={form.liveEvidence.capturing}
                    error={form.liveEvidence.error}
                    readOnly={readOnly || !checkedIn}
                    showUploadButton={!readOnly && checkedIn}
                    captureLabel={t('farmer.activity.capturePhoto')}
                    uploadLabel={t('farmer.activity.uploadGallery')}
                    onOpenCamera={() => void form.liveEvidence.captureEvidence()}
                    onRetake={() => void form.liveEvidence.retakeEvidence()}
                    onUpload={() => void form.liveEvidence.pickGalleryEvidence()}
                    onConfirmPending={() => form.liveEvidence.confirmPending()}
                    onRejectPending={() => form.liveEvidence.rejectPending()}
                    onOpenPreview={(uri) =>
                      navigation.navigate('FullscreenImage', { uri, title: t('farmer.activity.photo') })
                    }
                  />

                  <Text style={styles.notesLabel}>{t('farmer.activity.notes')}</Text>
                  <TextInput
                    style={styles.notesInput}
                    value={form.notes}
                    onChangeText={form.setNotes}
                    placeholder={t('farmer.activity.notesPlaceholder')}
                    editable={!readOnly}
                    multiline
                  />

                  {readOnly ? (
                    <Text style={styles.submittedHint}>{t('farmer.activity.submittedMessage')}</Text>
                  ) : (
                    <AppButton
                      label={form.submitting ? t('farmer.activity.submitting') : t('farmer.activity.submit')}
                      onPress={() => void handleSubmit()}
                      loading={form.submitting}
                      disabled={!checkedIn || !hasPhoto || form.submitting}
                    />
                  )}
                </PremiumActivitySectionCard>
              </>
            )}
          </KeyboardSafeScrollView>

        {showFooter ? (
          <PremiumActivityFooter
            showPrevious={false}
            primaryLabel={
              currentStep === 'start'
                ? form.capturingGps
                  ? t('farmer.activity.capturingGps')
                  : t('farmer.activity.startActivity')
                : form.capturingGps
                  ? t('farmer.activity.capturingGps')
                  : t('farmer.activity.checkIn')
            }
            onPrimary={() => {
              if (currentStep === 'start') {
                void handleStart();
                return;
              }
              void handleCheckIn();
            }}
            primaryDisabled={!farm || form.capturingGps}
            loading={form.capturingGps}
            loadingLabel={t('farmer.activity.capturingGps')}
          />
        ) : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, backgroundColor: premiumWorkflowTheme.gradient[0] },
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
  checkinFields: { gap: 8 },
  notesLabel: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '700',
    color: premiumWorkflowTheme.textPrimary,
  },
  notesInput: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: premiumWorkflowTheme.glassBorder,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    color: premiumWorkflowTheme.textPrimary,
    textAlignVertical: 'top',
  },
  submittedHint: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    color: premiumWorkflowTheme.primaryGreen,
  },
});
