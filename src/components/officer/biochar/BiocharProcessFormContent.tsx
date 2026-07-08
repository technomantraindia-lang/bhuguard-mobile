import type { ReactNode } from 'react';
import { Alert } from 'react-native';

import {
  BIOCHAR_BATCH_EVIDENCE_SLOT,
  BIOCHAR_MOISTURE_EVIDENCE_SLOT,
  BIOCHAR_PROCESS_EVIDENCE_SLOTS,
  BIOCHAR_PROCESS_MOISTURE_READING_COUNT,
  type BiocharEvidenceKey,
} from '../../../constants/biocharProduction';
import type { FeedstockQuantityUnit, FeedstockTypeValue } from '../../../constants/feedstockTypes';
import type { useBiocharProductionForm } from '../../../hooks/useBiocharProductionForm';

import {
  BatchDetailsSection,
  BiocharEvidenceCaptureSection,
  FeedstockQuantitySection,
  FinalStageTimeSection,
  MoistureReadingsSection,
  OfficerNotesSection,
  QuenchingTimeSection,
} from './BiocharProductionSections';

type BiocharForm = ReturnType<typeof useBiocharProductionForm>;

interface BiocharProcessFormContentProps {
  form: BiocharForm;
  readOnly?: boolean;
  farmerCode?: string | null;
  headerSlot?: ReactNode;
  extraSectionsSlot?: ReactNode;
  onPreviewEvidence?: (key: BiocharEvidenceKey) => void;
  onEvidenceCaptured?: (key: BiocharEvidenceKey) => void;
}

export function BiocharProcessFormContent({
  form,
  readOnly = false,
  farmerCode = null,
  headerSlot,
  extraSectionsSlot,
  onPreviewEvidence,
  onEvidenceCaptured,
}: BiocharProcessFormContentProps) {
  const previewEvidence =
    onPreviewEvidence ??
    ((key: BiocharEvidenceKey) => {
      const asset = form.evidence[key];
      if (!asset) {
        return;
      }

      if (key === 'process_video') {
        Alert.alert('Process video', 'Video evidence captured and ready for upload.');
        return;
      }

      Alert.alert('Evidence', 'Image captured and ready for upload.');
    });

  const handleAddEvidence = async (key: BiocharEvidenceKey) => {
    await form.addEvidence(key);
    onEvidenceCaptured?.(key);
  };

  const renderEvidence = (slot: typeof BIOCHAR_BATCH_EVIDENCE_SLOT) => (
    <BiocharEvidenceCaptureSection
      key={slot.key}
      slot={slot}
      evidence={form.evidence[slot.key]}
      readOnly={readOnly}
      onAddEvidence={(key) => void handleAddEvidence(key)}
      onUploadEvidence={(key) => void form.uploadEvidence(key)}
      onRemoveEvidence={form.removeEvidence}
      onPreviewEvidence={previewEvidence}
    />
  );

  const pyrolysisSlots = BIOCHAR_PROCESS_EVIDENCE_SLOTS.slice(0, 3);
  const outputSlots = BIOCHAR_PROCESS_EVIDENCE_SLOTS.slice(3);

  return (
    <>
      {headerSlot}

      <BatchDetailsSection
        batchCode={form.batchCode}
        farmerId={form.selectedFarmerId}
        farmerCode={farmerCode}
        batchCodeError={form.batchCodeError}
        onGenerateBatchCode={() => void form.regenerateCodes()}
        onBatchCodeChange={form.setBatchCode}
        readOnly={readOnly}
      />

      <FeedstockQuantitySection
        feedstockQuantity={form.feedstockQuantity}
        feedstockUnit={form.feedstockUnit}
        feedstockType={form.feedstockType}
        onFeedstockQuantityChange={form.setFeedstockQuantity}
        onFeedstockUnitChange={(value) => form.setFeedstockUnit(value as FeedstockQuantityUnit)}
        onFeedstockTypeChange={(value) => form.setFeedstockType(value as FeedstockTypeValue)}
        readOnly={readOnly}
      />

      {renderEvidence(BIOCHAR_BATCH_EVIDENCE_SLOT)}
      {renderEvidence(BIOCHAR_MOISTURE_EVIDENCE_SLOT)}

      <MoistureReadingsSection
        readings={form.moistureReadings}
        readOnly={readOnly}
        showNotes
        fixedCount={BIOCHAR_PROCESS_MOISTURE_READING_COUNT}
        onAddReading={form.addMoistureReading}
        onRemoveReading={form.removeMoistureReading}
        onChangeReading={(key, value) => form.updateMoistureReading(key, 'moistureReading', value)}
        onChangeNotes={(key, value) => form.updateMoistureReading(key, 'notes', value)}
        onCapturePhoto={(key) => void form.captureMoistureReadingPhoto(key)}
        onUploadPhoto={(key) => void form.uploadMoistureReadingPhoto(key)}
      />

      {pyrolysisSlots.map(renderEvidence)}

      <FinalStageTimeSection
        finalStageTime={form.finalStageTime}
        onFinalStageTimeChange={form.setFinalStageTime}
        readOnly={readOnly}
      />

      <QuenchingTimeSection
        quenchingTime={form.quenchingTime}
        onQuenchingTimeChange={form.setQuenchingTime}
        readOnly={readOnly}
      />

      {outputSlots.map(renderEvidence)}

      {extraSectionsSlot}

      <OfficerNotesSection value={form.officerNotes} onChange={form.setOfficerNotes} />
    </>
  );
}
