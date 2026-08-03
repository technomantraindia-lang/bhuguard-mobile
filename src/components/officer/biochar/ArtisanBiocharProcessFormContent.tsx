import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';



import {

  ARTISAN_BIOCHAR_WORKFLOW_STEPS,

  ARTISAN_CHAR_SAMPLE_EVIDENCE_SLOT,

  ARTISAN_PROCESS_EVIDENCE_SLOTS,

  BIOCHAR_PROCESS_MOISTURE_READING_COUNT,

  FEEDSTOCK_TYPES,

  type ArtisanBiocharWorkflowStepKey,

  type BiocharEvidenceKey,

} from '../../../constants/biocharProduction';

import type { FeedstockQuantityUnit, FeedstockTypeValue } from '../../../constants/feedstockTypes';

import type { useBiocharProductionForm } from '../../../hooks/useBiocharProductionForm';

import { artisanTheme } from '../../../theme/artisanTheme';

import {

  isValidArtisanKilnId,

  kilnIdValidationError,

} from '../../../utils/biocharProductionHelpers';

import { formatProcessDurationHoursMinutes } from '../../../utils/farmDisplayLabel';
import {
  isValidMoistureReadingValue,
  moistureReadingValidationError,
} from '../../../utils/moistureReadingValidation';

import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';

import {

  BatchDetailsSection,

  BiocharEvidenceCaptureSection,

  FeedstockQuantitySection,

  InitialDataSection,

  MoistureReadingsSection,

  ProcessDataSection,

} from './BiocharProductionSections';

import {

  ArtisanLiveEvidenceCameraModal,

  type ArtisanLiveCameraCapture,

} from './ArtisanLiveEvidenceCameraModal';



const END_PROCESS_EVIDENCE_KEY: BiocharEvidenceKey = 'end_stage_before_quenching_photo';

const CHAR_SAMPLE_EVIDENCE_KEY: BiocharEvidenceKey = 'char_sample_photo';



type LiveCameraTarget =

  | { kind: 'evidence'; key: BiocharEvidenceKey; title: string; requestId: number }

  | { kind: 'moisture'; key: string; title: string; requestId: number };



type BiocharForm = ReturnType<typeof useBiocharProductionForm>;



export interface ArtisanFarmOption {

  id: number;

  label: string;

}



interface ArtisanBiocharProcessFormContentProps {

  form: BiocharForm;

  readOnly?: boolean;

  farmerCode?: string | null;

  farmCode?: string | null;

  farmLabel?: string | null;

  farmOptions?: ArtisanFarmOption[];

  onSelectFarm?: (farmId: number) => void;

  headerSlot?: ReactNode;

  onPreviewEvidence?: (key: BiocharEvidenceKey) => void;

  onEvidenceCaptured?: (key: BiocharEvidenceKey) => void;

  onCaptureBatchStartTime?: () => void;

  onCaptureCompletionTime?: () => void;

  batchStartedAt?: string | null;

  processCompletedAt?: string | null;

}



function formatDateTime24h(iso: string | null | undefined): string {

  if (!iso) {

    return '—';

  }

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {

    return iso;

  }

  const day = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

  return `${day} ${time}`;

}



function isValidFeedstockSizeCm(value: string | null | undefined): boolean {

  const trimmed = String(value ?? '').trim();

  if (!trimmed) {

    return false;

  }

  const numeric = Number(trimmed);

  return Number.isFinite(numeric) && numeric > 0;

}



function StepShell({

  title,

  index,

  status,

  statusLabel,

  expanded,

  onToggle,

  children,

}: {

  title: string;

  index: number;

  status: 'locked' | 'current' | 'completed';

  statusLabel: string;

  expanded: boolean;

  onToggle: () => void;

  children?: ReactNode;

}) {

  const locked = status === 'locked';



  return (

    <View style={[styles.stepCard, locked && styles.stepCardLocked]}>

      <Pressable

        style={styles.stepHeader}

        onPress={() => {

          if (locked) {

            Alert.alert('Step locked', 'Complete the previous step before opening this one.');

            return;

          }

          onToggle();

        }}

      >

        <View style={styles.stepHeaderLeft}>

          <View

            style={[

              styles.stepBadge,

              status === 'completed' && styles.stepBadgeDone,

              status === 'current' && styles.stepBadgeCurrent,

              locked && styles.stepBadgeLocked,

            ]}

          >

            <Text style={styles.stepBadgeText}>{status === 'completed' ? '✓' : index + 1}</Text>

          </View>

          <View style={{ flex: 1 }}>

            <Text style={styles.stepTitle}>{title}</Text>

            <Text style={styles.stepStatus}>{statusLabel}</Text>

          </View>

        </View>

        <BhuguardMaterialIcon

          name={locked ? 'lock' : 'chevron_right'}

          size={22}

          color={locked ? artisanTheme.secondaryText : artisanTheme.actionGreen}

        />

      </Pressable>

      {!locked && expanded ? <View style={styles.stepBody}>{children}</View> : null}

    </View>

  );

}



function hasEvidencePreviewUri(
  asset: { localUri?: string; uri?: string; remoteUrl?: string } | null | undefined,
): boolean {
  return Boolean(asset?.localUri || asset?.uri || asset?.remoteUrl);
}

function isEvidenceReady(form: BiocharForm, key: BiocharEvidenceKey): boolean {
  // Count a captured preview as ready so stamp/GPS processing does not lock the step.
  // Watermarking still runs in the background; failed stamp keeps the preview.
  return hasEvidencePreviewUri(form.evidence[key]);
}

function isMoistureReadingLocallyComplete(reading: BiocharForm['moistureReadings'][number] | undefined): boolean {
  return Boolean(
    reading &&
      isValidMoistureReadingValue(reading.moistureReading) &&
      hasEvidencePreviewUri(reading.photo),
  );
}

function moistureStepKeyToSequence(key: ArtisanBiocharWorkflowStepKey): number | null {
  const match = /^moisture_(\d)$/.exec(key);
  if (!match) {
    return null;
  }

  const sequence = Number(match[1]);
  return sequence >= 1 && sequence <= BIOCHAR_PROCESS_MOISTURE_READING_COUNT ? sequence : null;
}



export function ArtisanBiocharProcessFormContent({

  form,

  readOnly = false,

  farmerCode = null,

  farmCode = null,

  farmLabel = null,

  farmOptions = [],

  onSelectFarm,

  headerSlot,

  onPreviewEvidence,

  onEvidenceCaptured,

  onCaptureBatchStartTime,

  onCaptureCompletionTime,

  batchStartedAt = null,

  processCompletedAt = null,

}: ArtisanBiocharProcessFormContentProps) {

  const [activeStep, setActiveStep] = useState<ArtisanBiocharWorkflowStepKey>('farm_batch_context');

  const captureRequestIdRef = useRef(0);
  const captureProcessingRef = useRef(false);
  const [isCaptureProcessing, setIsCaptureProcessing] = useState(false);



  const selectedFarmLabel =

    farmLabel ||

    farmOptions.find((option) => option.id === form.resolvedFarmId)?.label ||

    farmCode ||

    (form.resolvedFarmId != null ? String(form.resolvedFarmId) : '—');



  const processDurationLabel =

    batchStartedAt && processCompletedAt

      ? formatProcessDurationHoursMinutes(batchStartedAt, processCompletedAt)

      : null;



  const stepCompletion = useMemo(() => {

    const hasFarm = Boolean(form.selectedFarmerId) && Boolean(form.resolvedFarmId);

    const hasBatchStart = Boolean(batchStartedAt);

    const hasBatch = Boolean(form.batchCode.trim());

    const hasKiln = Boolean(form.selectedUnitId) || isValidArtisanKilnId(form.kilnId);

    const hasFarmer = Boolean(form.selectedFarmerId);

    const hasGps = form.latitude != null && form.longitude != null && form.accuracyM != null;

    const hasFeedstock =

      Boolean(form.feedstockQuantity.trim()) &&

      Number(form.feedstockQuantity) > 0 &&

      Boolean(form.feedstockType.trim()) &&

      isValidFeedstockSizeCm(form.feedstockSize);

    const moistureComplete = Array.from({ length: BIOCHAR_PROCESS_MOISTURE_READING_COUNT }, (_, index) =>
      isMoistureReadingLocallyComplete(form.moistureReadings[index]),
    );

    const feedstockPhoto = isEvidenceReady(form, 'feedstock_photo');
    const startImage = isEvidenceReady(form, 'starting_pyrolysis_photo');

    const midImage = isEvidenceReady(form, 'mid_stage_photo');

    const endImage = isEvidenceReady(form, 'end_stage_before_quenching_photo');

    const quenchImage = isEvidenceReady(form, 'quenching_photo');

    const unloadedImage = isEvidenceReady(form, 'biochar_unloaded_photo');

    const charSampleImage = isEvidenceReady(form, CHAR_SAMPLE_EVIDENCE_KEY);

    const processOk =

      Boolean(form.temperature.trim()) &&

      Boolean(form.residenceTime.trim()) &&

      Boolean(form.biocharOutput.trim());



    return {

      farm_batch_context: hasFarm && hasBatchStart && hasBatch && hasKiln && hasFarmer,

      feedstock_details: hasGps && hasFeedstock,

      feedstock_photo: feedstockPhoto,

      moisture_1: moistureComplete[0],

      moisture_2: moistureComplete[1],

      moisture_3: moistureComplete[2],

      moisture_4: moistureComplete[3],

      moisture_5: moistureComplete[4],

      start_pyrolysis: startImage,

      mid_pyrolysis: midImage,

      end_pyrolysis: endImage,

      quenching: quenchImage,

      unloaded: unloadedImage,

      production_finish_time: Boolean(processCompletedAt) && processOk,

      char_sample: charSampleImage,

      review_submit: charSampleImage,

      submit: false,

    } satisfies Record<ArtisanBiocharWorkflowStepKey, boolean>;

  }, [batchStartedAt, form, processCompletedAt]);



  const unlockedIndex = useMemo(() => {

    let max = 0;

    for (let i = 0; i < ARTISAN_BIOCHAR_WORKFLOW_STEPS.length; i += 1) {

      const key = ARTISAN_BIOCHAR_WORKFLOW_STEPS[i].key;

      if (key === 'review_submit') {

        const priorComplete = ARTISAN_BIOCHAR_WORKFLOW_STEPS.slice(0, i).every(

          (step) => stepCompletion[step.key],

        );

        max = priorComplete ? i : max;

        break;

      }

      if (stepCompletion[key]) {

        max = i + 1;

      } else {

        break;

      }

    }

    return Math.min(max, ARTISAN_BIOCHAR_WORKFLOW_STEPS.length - 1);

  }, [stepCompletion]);



  // Intentionally no auto-advance: completing a step must never jump the user
  // to the next one automatically. They tap the next unlocked step themselves.
  // The only exception is a one-time positioning when a draft/batch finishes
  // loading, so resuming work lands on the first incomplete step instead of
  // always restarting at step 1.
  const didInitialPositionRef = useRef(false);
  useEffect(() => {
    if (didInitialPositionRef.current || form.loading) {
      return;
    }
    didInitialPositionRef.current = true;
    const resumeKey = ARTISAN_BIOCHAR_WORKFLOW_STEPS[unlockedIndex]?.key;
    if (resumeKey) {
      setActiveStep(resumeKey);
    }
  }, [form.loading, unlockedIndex]);



  const missingItems = useMemo(() => {

    const missing: string[] = [];

    if (!form.selectedFarmerId) missing.push('Farmer ID');

    if (!form.resolvedFarmId) missing.push('Farm selection');

    if (!batchStartedAt) missing.push('Batch Start Time');

    if (!form.batchCode.trim()) missing.push('Batch ID');

    if (!form.selectedUnitId && !isValidArtisanKilnId(form.kilnId)) missing.push('Kiln ID (BHG-###)');

    if (form.latitude == null || form.longitude == null) missing.push('GPS Captured Location');

    if (!form.feedstockQuantity.trim()) missing.push('Feedstock Quantity');

    if (!isValidFeedstockSizeCm(form.feedstockSize)) missing.push('Feedstock Size (cm)');

    if (!form.feedstockType.trim()) missing.push('Feedstock Type');

    if (!isEvidenceReady(form, 'feedstock_photo')) missing.push('Feedstock Photo');

    form.moistureReadings.forEach((reading, index) => {

      if (!reading.moistureReading.trim()) missing.push(`Moisture Reading ${index + 1}`);
      else if (moistureReadingValidationError(reading.moistureReading)) {
        missing.push(`Moisture Reading ${index + 1} must be less than 20`);
      }

      if (!reading.photo?.localUri && !reading.photo?.uri && !reading.photo?.remoteUrl) {
        missing.push(`Moisture Reading ${index + 1} live photo`);
      }

    });

    if (!isEvidenceReady(form, 'starting_pyrolysis_photo')) missing.push('Start Pyrolysis Image');

    if (!isEvidenceReady(form, 'mid_stage_photo')) missing.push('Mid Stage Image');

    if (!isEvidenceReady(form, 'end_stage_before_quenching_photo')) missing.push('Final Stage Image');

    if (!isEvidenceReady(form, 'quenching_photo')) missing.push('Quenching Photo');

    if (!isEvidenceReady(form, 'biochar_unloaded_photo')) missing.push('Unloaded Photo');

    if (!processCompletedAt) missing.push('Completion Time');

    if (!form.temperature.trim()) missing.push('Process Data temperature');

    if (!form.residenceTime.trim()) missing.push('Process Data residence time');

    if (!form.biocharOutput.trim()) missing.push('Process Data biochar output');

    if (!isEvidenceReady(form, CHAR_SAMPLE_EVIDENCE_KEY)) missing.push('Sample Photo Collection');

    return missing;

  }, [batchStartedAt, form, processCompletedAt]);



  const previewEvidence =

    onPreviewEvidence ??

    ((key: BiocharEvidenceKey) => {

      if (!form.evidence[key]) {

        Alert.alert('Evidence', 'No image captured yet.');

        return;

      }

      Alert.alert('Evidence', 'Image captured and ready for upload.');

    });



  const [cameraTarget, setCameraTarget] = useState<LiveCameraTarget | null>(null);



  const evidenceTitle = (key: BiocharEvidenceKey): string => {

    if (key === CHAR_SAMPLE_EVIDENCE_KEY) {

      return ARTISAN_CHAR_SAMPLE_EVIDENCE_SLOT.title;

    }

    return ARTISAN_PROCESS_EVIDENCE_SLOTS.find((slot) => slot.key === key)?.title ?? 'Live Evidence';

  };



  const handleAddEvidence = async (key: BiocharEvidenceKey) => {

    if (form.endProcessProcessing || cameraTarget || captureProcessingRef.current) {

      return;

    }

    const requestId = captureRequestIdRef.current + 1;
    captureRequestIdRef.current = requestId;
    setCameraTarget({ kind: 'evidence', key, title: evidenceTitle(key), requestId });

  };



  const handleMoistureCapture = (key: string) => {

    if (cameraTarget || captureProcessingRef.current) {

      return;

    }

    const reading = form.moistureReadings.find((item) => item.key === key);
    const requestId = captureRequestIdRef.current + 1;
    captureRequestIdRef.current = requestId;

    setCameraTarget({

      kind: 'moisture',

      key,

      title: `Moisture Reading ${reading?.sequence ?? ''} Photo`,

      requestId,

    });

  };



  const handleLiveCameraCaptured = (capture: ArtisanLiveCameraCapture) => {

    const target = cameraTarget;

    setCameraTarget(null);

    if (!target || target.requestId !== captureRequestIdRef.current || captureProcessingRef.current) {

      return;

    }
    captureProcessingRef.current = true;
    setIsCaptureProcessing(true);



    void (async () => {
      try {

      if (target.kind === 'moisture') {

        await form.processArtisanMoistureCameraCapture(target.key, capture.uri, capture.shutterEpochMs);

        return;

      }



      const ok = await form.processArtisanEvidenceCameraCapture(

        target.key,

        capture.uri,

        capture.shutterEpochMs,

      );

      if (ok) {

        onEvidenceCaptured?.(target.key);

      }
      } finally {
        if (target.requestId === captureRequestIdRef.current) {
          captureProcessingRef.current = false;
          setIsCaptureProcessing(false);
        }
      }

    })();

  };



  const renderEvidence = (key: BiocharEvidenceKey) => {

    const slot =

      key === CHAR_SAMPLE_EVIDENCE_KEY

        ? ARTISAN_CHAR_SAMPLE_EVIDENCE_SLOT

        : ARTISAN_PROCESS_EVIDENCE_SLOTS.find((item) => item.key === key);

    if (!slot) {

      return null;

    }

    const isEndProcess = key === END_PROCESS_EVIDENCE_KEY;



    return (

      <BiocharEvidenceCaptureSection

        key={slot.key}

        slot={slot}

        evidence={form.evidence[slot.key]}

        readOnly={readOnly}

        liveCameraOnly

        processing={isEndProcess ? form.endProcessProcessing || isCaptureProcessing : isCaptureProcessing}

        processingLabel={isEndProcess ? 'Processing End-Process Image…' : undefined}

        processError={isEndProcess ? form.endProcessProcessError : null}

        pendingOfflineLabel={isEndProcess}

        onRetryProcessing={

          isEndProcess ? () => void form.retryEndProcessProcessing() : undefined

        }

        onAddEvidence={(evidenceKey) => void handleAddEvidence(evidenceKey)}

        onUploadEvidence={() => void form.syncPendingEvidence()}

        onRemoveEvidence={form.removeEvidence}

        onPreviewEvidence={previewEvidence}

      />

    );

  };



  const stepStatus = (index: number): 'locked' | 'current' | 'completed' => {

    const key = ARTISAN_BIOCHAR_WORKFLOW_STEPS[index].key;

    if (index > unlockedIndex) return 'locked';

    if (key !== 'review_submit' && stepCompletion[key]) return 'completed';

    if (index === unlockedIndex) return 'current';

    return 'completed';

  };



  const stepStatusLabel = (index: number, status: 'locked' | 'current' | 'completed'): string => {

    const key = ARTISAN_BIOCHAR_WORKFLOW_STEPS[index].key;

    if (moistureStepKeyToSequence(key) != null && form.moistureStepError && status === 'current') {

      return 'Needs retry';

    }

    if (status === 'completed') return 'Completed';

    if (status === 'current') return 'In progress';

    return 'Locked';

  };



  return (

    <>

      {headerSlot}



      {ARTISAN_BIOCHAR_WORKFLOW_STEPS.map((step, index) => {

        const status = stepStatus(index);

        const expanded = activeStep === step.key && status !== 'locked';



        return (

          <StepShell

            key={step.key}

            title={step.title}

            index={index}

            status={status}

            statusLabel={stepStatusLabel(index, status)}

            expanded={expanded}

            onToggle={() => setActiveStep((current) => (current === step.key ? current : step.key))}

          >

            {step.key === 'farm_batch_context' ? (

              <>
              <View style={styles.selectionBlock}>

                <Text style={styles.metaLabel}>Farmer ID</Text>

                <Text style={styles.metaValue}>{farmerCode || form.selectedFarmerId || '—'}</Text>

                {form.farmerName ? (

                  <>

                    <Text style={styles.metaLabel}>Farmer Name</Text>

                    <Text style={styles.metaValue}>{form.farmerName}</Text>

                  </>

                ) : null}

                <Text style={[styles.metaLabel, styles.fieldSpacing]}>Farm</Text>

                {farmOptions.length > 0 && !readOnly ? (

                  <View style={styles.farmOptionList}>

                    {farmOptions.map((option) => {

                      const selected = option.id === form.resolvedFarmId;

                      return (

                        <Pressable

                          key={option.id}

                          style={[styles.farmOption, selected && styles.farmOptionSelected]}

                          onPress={() => onSelectFarm?.(option.id)}

                        >

                          <Text style={[styles.farmOptionText, selected && styles.farmOptionTextSelected]}>

                            {option.label}

                          </Text>

                        </Pressable>

                      );

                    })}

                  </View>

                ) : (

                  <Text style={styles.metaValue}>{selectedFarmLabel}</Text>

                )}

              </View>

              <View style={styles.actionBlock}>

                <Text style={styles.metaLabel}>Batch Start Time</Text>

                <Text style={styles.metaValue}>{formatDateTime24h(batchStartedAt)}</Text>

                {!readOnly && !batchStartedAt ? (

                  <Pressable style={styles.actionButton} onPress={() => onCaptureBatchStartTime?.()}>

                    <Text style={styles.actionButtonText}>Capture Batch Start Time</Text>

                  </Pressable>

                ) : null}

                {batchStartedAt ? (

                  <Text style={styles.immutableHint}>Batch start time is locked and cannot be changed.</Text>

                ) : null}

              </View>

              <BatchDetailsSection

                batchCode={form.batchCode}

                kilnId={form.kilnId}

                kilnIdError={kilnIdValidationError(form.kilnId, 'artisan')}

                farmerId={form.selectedFarmerId}

                farmerCode={farmerCode}

                batchCodeError={form.batchCodeError}

                units={form.units.map((unit) => ({

                  id: unit.id,

                  label: unit.label,

                  kilnId: unit.kilnId,

                  kilnType: unit.kilnType,

                  village: unit.village,

                  status: unit.status,

                }))}

                selectedUnitId={form.selectedUnitId}

                onSelectUnit={form.selectUnit}

                onKilnIdChange={form.setKilnId}

                onGenerateBatchCode={() => void form.regenerateCodes()}

                onBatchCodeChange={form.setBatchCode}

                readOnly={readOnly}

                allowKilnSelect

              />
              </>

            ) : null}



            {step.key === 'feedstock_details' ? (

              <>

                <InitialDataSection

                  timestampDate={form.timestampDate}

                  timestampTime={form.timestampTime}

                  altitude={form.altitude}

                  villageName={form.villageName}

                  talukaName={form.talukaName}

                  districtName={form.districtName}

                  stateName={form.stateName}

                  latitude={form.latitude}

                  longitude={form.longitude}

                  accuracyM={form.accuracyM}

                  accuracyTier={form.gpsAccuracyTier}

                  farmerCode={farmerCode}

                  farmCode={farmCode}

                  onTimestampDateChange={form.setTimestampDate}

                  onTimestampTimeChange={form.setTimestampTime}

                  onAltitudeChange={form.setAltitudeInput}

                  onVillageNameChange={form.setVillageName}

                  onTalukaNameChange={form.setTalukaName}

                  onDistrictNameChange={form.setDistrictName}

                  onStateNameChange={form.setStateName}

                  onCaptureGps={() => void form.recaptureGps()}

                  onRecaptureGps={() => void form.recaptureGps()}

                  mapPreviewUrl={form.mapPreviewUrl}

                />

                <FeedstockQuantitySection

                  feedstockQuantity={form.feedstockQuantity}

                  feedstockUnit={form.feedstockUnit}

                  feedstockType={form.feedstockType}

                  feedstockSize={form.feedstockSize}

                  onFeedstockQuantityChange={form.setFeedstockQuantity}

                  onFeedstockUnitChange={(value) => form.setFeedstockUnit(value as FeedstockQuantityUnit)}

                  onFeedstockTypeChange={(value) => form.setFeedstockType(value as FeedstockTypeValue)}

                  onFeedstockSizeChange={form.setFeedstockSize}

                  readOnly={readOnly}

                  showFeedstockType

                  showFeedstockSize

                  sizeInputMode="cm"

                />

              </>

            ) : null}



            {step.key === 'feedstock_photo' ? renderEvidence('feedstock_photo') : null}



            {moistureStepKeyToSequence(step.key) ? (

              <MoistureReadingsSection

                readings={form.moistureReadings}

                readOnly={readOnly}

                showNotes={false}

                fixedCount={BIOCHAR_PROCESS_MOISTURE_READING_COUNT}

                focusSequence={moistureStepKeyToSequence(step.key) ?? undefined}

                liveCameraOnly

                sequentialUnlock

                saving={form.moistureSaving || isCaptureProcessing}

                stepError={form.moistureStepError}

                onAddReading={form.addMoistureReading}

                onRemoveReading={form.removeMoistureReading}

                onChangeReading={(key, value) => form.updateMoistureReading(key, 'moistureReading', value)}

                onChangeNotes={(key, value) => form.updateMoistureReading(key, 'notes', value)}

                onCapturePhoto={handleMoistureCapture}

                onUploadPhoto={() => {

                  Alert.alert('Live camera required', 'Gallery upload is not allowed for moisture photos.');

                }}

                onCompleteStep={() => {
                  if (moistureStepKeyToSequence(step.key) === BIOCHAR_PROCESS_MOISTURE_READING_COUNT) {
                    void form.completeMoistureReadings();
                  }
                }}

                onRetryFailed={() => void form.completeMoistureReadings({ retryFailedOnly: true })}

              />

            ) : null}



            {step.key === 'start_pyrolysis' ? renderEvidence('starting_pyrolysis_photo') : null}

            {step.key === 'mid_pyrolysis' ? renderEvidence('mid_stage_photo') : null}

            {step.key === 'end_pyrolysis' ? renderEvidence('end_stage_before_quenching_photo') : null}

            {step.key === 'quenching' ? renderEvidence('quenching_photo') : null}

            {step.key === 'unloaded' ? renderEvidence('biochar_unloaded_photo') : null}



            {step.key === 'production_finish_time' ? (

              <>

              <View style={styles.actionBlock}>

                <Text style={styles.metaLabel}>Production Finish Time</Text>

                <Text style={styles.metaValue}>{formatDateTime24h(processCompletedAt)}</Text>

                {processDurationLabel ? (

                  <Text style={styles.durationText}>Total Process Duration: {processDurationLabel}</Text>

                ) : null}

                {!readOnly && !processCompletedAt ? (

                  <Pressable style={styles.actionButton} onPress={() => onCaptureCompletionTime?.()}>

                    <Text style={styles.actionButtonText}>Capture Production Finish Time</Text>

                  </Pressable>

                ) : null}

              </View>

              <ProcessDataSection

                temperature={form.temperature}

                residenceTime={form.residenceTime}

                biocharOutput={form.biocharOutput}

                biocharOutputUnit={form.biocharOutputUnit}

                feedstockQuantity={form.feedstockQuantity}

                onTemperatureChange={form.setTemperature}

                onResidenceTimeChange={form.setResidenceTime}

                onBiocharOutputChange={form.setBiocharOutput}

                onBiocharOutputUnitChange={form.setBiocharOutputUnit}

              />
              </>

            ) : null}



            {step.key === 'char_sample' ? renderEvidence(CHAR_SAMPLE_EVIDENCE_KEY) : null}



            {step.key === 'review_submit' ? (

              <View style={styles.reviewBlock}>

                <Text style={styles.reviewTitle}>Final Review</Text>

                <Text style={styles.reviewLine}>Batch Start Time: {formatDateTime24h(batchStartedAt)}</Text>

                <Text style={styles.reviewLine}>Batch ID: {form.batchCode || '—'}</Text>

                <Text style={styles.reviewLine}>Farm: {selectedFarmLabel}</Text>

                <Text style={styles.reviewLine}>Farm ID: {farmCode || form.resolvedFarmCode || '—'}</Text>

                <Text style={styles.reviewLine}>Farmer ID: {farmerCode || form.selectedFarmerId || '—'}</Text>

                <Text style={styles.reviewLine}>Kiln ID: {form.kilnId || '—'}</Text>

                <Text style={styles.reviewLine}>

                  GPS: {form.latitude ?? '—'}, {form.longitude ?? '—'} (±{form.accuracyM ?? '—'} m)

                </Text>

                <Text style={styles.reviewLine}>

                  Feedstock: {form.feedstockQuantity} {form.feedstockUnit} / {form.feedstockSize || '—'} cm /{' '}

                  {FEEDSTOCK_TYPES.find((item) => item.value === form.feedstockType)?.label || form.feedstockType || '—'}

                </Text>

                <Text style={styles.reviewLine}>

                  Feedstock Photo: {isEvidenceReady(form, 'feedstock_photo') ? 'Photo Uploaded' : 'Missing'}

                </Text>

                <Text style={styles.reviewLine}>

                  Moisture readings: {form.moistureReadings.filter((r) => isMoistureReadingLocallyComplete(r)).length}/5 complete

                </Text>

                <Text style={styles.reviewLine}>

                  Start Pyrolysis: {isEvidenceReady(form, 'starting_pyrolysis_photo') ? 'Uploaded' : 'Missing'}

                </Text>

                <Text style={styles.reviewLine}>

                  Mid Stage: {isEvidenceReady(form, 'mid_stage_photo') ? 'Uploaded' : 'Missing'}

                </Text>

                <Text style={styles.reviewLine}>

                  Final Stage: {isEvidenceReady(form, 'end_stage_before_quenching_photo') ? 'Uploaded' : 'Missing'}

                </Text>

                <Text style={styles.reviewLine}>

                  Quenching: {isEvidenceReady(form, 'quenching_photo') ? 'Uploaded' : 'Missing'}

                </Text>

                <Text style={styles.reviewLine}>

                  Unloaded: {isEvidenceReady(form, 'biochar_unloaded_photo') ? 'Uploaded' : 'Missing'}

                </Text>

                <Text style={styles.reviewLine}>Completion Time: {formatDateTime24h(processCompletedAt)}</Text>

                <Text style={styles.reviewLine}>Duration: {processDurationLabel || '—'}</Text>

                <Text style={styles.reviewLine}>

                  Process Data: temp {form.temperature || '—'}, residence {form.residenceTime || '—'}, output{' '}

                  {form.biocharOutput || '—'} {form.biocharOutputUnit}

                </Text>

                <Text style={styles.reviewLine}>

                  Sample Photo Collection: {isEvidenceReady(form, CHAR_SAMPLE_EVIDENCE_KEY) ? 'Photo Uploaded' : 'Missing'}

                </Text>

                {missingItems.length > 0 ? (

                  <View style={styles.missingBox}>

                    <Text style={styles.missingTitle}>Cannot submit. Complete the following:</Text>

                    {missingItems.map((item) => (

                      <Text key={item} style={styles.missingItem}>

                        • {item}

                      </Text>

                    ))}

                  </View>

                ) : (

                  <Text style={styles.readyText}>All required items are complete. Ready to submit.</Text>

                )}

              </View>

            ) : null}



            {step.key === 'submit' ? (

              <View style={styles.reviewBlock}>

                <Text style={styles.reviewTitle}>Submit</Text>

                <Text style={styles.readyText}>
                  All Biochar Production steps are complete. Use Submit Biochar Production below to send the final record.
                </Text>

              </View>

            ) : null}

          </StepShell>

        );

      })}



      <ArtisanLiveEvidenceCameraModal

        visible={cameraTarget != null}

        title={cameraTarget?.title ?? 'Live Evidence'}

        onCancel={() => setCameraTarget(null)}

        onCaptured={handleLiveCameraCaptured}

      />

    </>

  );

}



const styles = StyleSheet.create({

  stepCard: {

    backgroundColor: artisanTheme.white,

    borderRadius: 14,

    borderWidth: 1,

    borderColor: artisanTheme.softBorder,

    overflow: 'hidden',

  },

  stepCardLocked: {

    opacity: 0.85,

  },

  stepHeader: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    paddingHorizontal: 14,

    paddingVertical: 14,

  },

  stepHeaderLeft: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 12,

    flex: 1,

  },

  stepBadge: {

    width: 28,

    height: 28,

    borderRadius: 14,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: artisanTheme.lightGreenSurface,

  },

  stepBadgeDone: { backgroundColor: artisanTheme.actionGreen },

  stepBadgeCurrent: { backgroundColor: artisanTheme.actionGreen },

  stepBadgeLocked: { backgroundColor: '#E5E7EB' },

  stepBadgeText: { color: artisanTheme.white, fontWeight: '800', fontSize: 12 },

  stepTitle: { fontSize: 15, fontWeight: '700', color: artisanTheme.deepText },

  stepStatus: { fontSize: 12, color: artisanTheme.secondaryText, marginTop: 2 },

  stepBody: { paddingHorizontal: 12, paddingBottom: 14, gap: 12 },

  selectionBlock: { gap: 6 },

  farmOptionList: { gap: 8, marginTop: 4 },

  farmOption: {

    borderWidth: 1,

    borderColor: artisanTheme.softBorder,

    borderRadius: 10,

    paddingHorizontal: 12,

    paddingVertical: 10,

    backgroundColor: artisanTheme.white,

  },

  farmOptionSelected: {

    borderColor: artisanTheme.actionGreen,

    backgroundColor: artisanTheme.lightGreenSurface,

  },

  farmOptionText: { fontSize: 14, fontWeight: '600', color: artisanTheme.deepText },

  farmOptionTextSelected: { color: artisanTheme.actionGreen },

  actionBlock: { gap: 10 },

  actionButton: {

    backgroundColor: artisanTheme.actionGreen,

    borderRadius: 12,

    paddingVertical: 12,

    alignItems: 'center',

  },

  actionButtonText: { color: artisanTheme.white, fontWeight: '800', fontSize: 15 },

  metaLabel: { fontSize: 13, fontWeight: '700', color: artisanTheme.secondaryText },

  metaValue: { fontSize: 15, color: artisanTheme.deepText, fontWeight: '600' },

  fieldSpacing: { marginTop: 8 },

  durationText: { fontSize: 14, fontWeight: '700', color: artisanTheme.actionGreen },

  immutableHint: { fontSize: 12, color: artisanTheme.secondaryText, fontStyle: 'italic' },

  reviewBlock: { gap: 6 },

  reviewTitle: { fontSize: 16, fontWeight: '800', color: artisanTheme.deepText, marginBottom: 4 },

  reviewLine: { fontSize: 13, color: artisanTheme.deepText, lineHeight: 20 },

  missingBox: {

    marginTop: 8,

    backgroundColor: '#FEF2F2',

    borderRadius: 10,

    padding: 12,

    gap: 4,

  },

  missingTitle: { color: artisanTheme.error, fontWeight: '700', marginBottom: 4 },

  missingItem: { color: artisanTheme.error, fontSize: 13 },

  readyText: { marginTop: 8, color: artisanTheme.actionGreen, fontWeight: '700' },

});


