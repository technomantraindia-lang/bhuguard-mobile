import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '../api/authApi';
import { uploadEvidence, buildEvidenceFormData } from '../api/evidenceApi';
import {
  createFarmerWeeklyUpdate,
  getFarmerFarms,
  getFarmerServices,
} from '../api/farmerApi';
import { useLiveEvidenceCapture } from './useLiveEvidenceCapture';
import { extractList, pickString, type ApiRecord } from '../utils/apiHelpers';

export interface CreateWeeklyUpdateFormState {
  farmId: number | null;
  serviceId: number | null;
  updateDate: string;
  weekNumber: string;
  cropOrStage: string;
  activityDone: string;
  inputsUsed: string;
  inputQuantity: string;
  inputUnit: string;
  remarks: string;
}

const INITIAL: CreateWeeklyUpdateFormState = {
  farmId: null,
  serviceId: null,
  updateDate: new Date().toISOString().slice(0, 10),
  weekNumber: '',
  cropOrStage: '',
  activityDone: '',
  inputsUsed: '',
  inputQuantity: '',
  inputUnit: '',
  remarks: '',
};

export function useCreateWeeklyUpdateForm(initialFarmId?: number) {
  const [form, setForm] = useState<CreateWeeklyUpdateFormState>({
    ...INITIAL,
    farmId: initialFarmId ?? null,
  });
  const [farms, setFarms] = useState<ApiRecord[]>([]);
  const [services, setServices] = useState<ApiRecord[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const liveEvidence = useLiveEvidenceCapture({
    defaultName: 'weekly-activity-photo.jpg',
    allowsEditing: false,
  });

  const loadOptions = useCallback(async () => {
    setLoadingOptions(true);
    setOptionsError(null);

    try {
      const [farmsData, servicesData] = await Promise.all([getFarmerFarms(), getFarmerServices()]);
      setFarms(extractList(farmsData as ApiRecord, ['farms']));
      setServices(extractList(servicesData as ApiRecord, ['services']));
    } catch (err) {
      setOptionsError(getApiErrorMessage(err, 'Failed to load farms and services.'));
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  const updateField = useCallback(
    <K extends keyof CreateWeeklyUpdateFormState>(key: K, value: CreateWeeklyUpdateFormState[K]) => {
      setForm((current) => ({ ...current, [key]: value }));
      setSubmitError(null);
    },
    [],
  );

  const submit = useCallback(async (): Promise<boolean> => {
    if (!form.farmId) {
      setSubmitError('Please select a farm.');
      return false;
    }

    if (!form.serviceId) {
      setSubmitError('Please select a service.');
      return false;
    }

    if (!form.updateDate.trim()) {
      setSubmitError('Update date is required.');
      return false;
    }

    if (!form.activityDone.trim()) {
      setSubmitError('Please describe the activity completed this week.');
      return false;
    }

    if (!liveEvidence.evidence) {
      setSubmitError('Capture a live photo of this week\'s activity before submitting.');
      return false;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const created = await createFarmerWeeklyUpdate({
        farm_id: form.farmId,
        service_id: form.serviceId,
        update_date: form.updateDate,
        week_number: form.weekNumber.trim() ? Number(form.weekNumber) : undefined,
        crop_or_stage: form.cropOrStage.trim() || undefined,
        activity_done: form.activityDone.trim() || undefined,
        inputs_used: form.inputsUsed.trim() || undefined,
        input_quantity: form.inputQuantity.trim() ? Number(form.inputQuantity) : undefined,
        input_unit: form.inputUnit.trim() || undefined,
        remarks: form.remarks.trim() || undefined,
        farmer_confirmation: true,
      });

      const weeklyUpdate = (created.weekly_update ?? created) as ApiRecord;
      const weeklyUpdateId = Number(weeklyUpdate.id);

      if (!weeklyUpdateId || !liveEvidence.evidence) {
        throw new Error('Weekly update was saved but photo upload could not be linked.');
      }

      const evidenceFormData = buildEvidenceFormData(
        liveEvidence.evidence,
        {
          evidence_category: 'weekly_progress_photo',
          title: form.activityDone.trim().slice(0, 120),
          remarks: form.remarks.trim() || form.activityDone.trim(),
          farm_id: form.farmId,
          weekly_update_id: weeklyUpdateId,
        },
        'farmer',
      );

      await uploadEvidence('farmer', evidenceFormData);

      return true;
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, 'Failed to create weekly update.'));
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [form, liveEvidence.evidence]);

  const farmOptions = farms.map((farm) => ({
    id: Number(farm.id),
    label: pickString(farm, 'farm_name', 'name'),
  }));

  const serviceOptions = services.map((service) => ({
    id: Number(service.id),
    label: pickString(service, 'name', 'service_name'),
  }));

  return {
    form,
    farmOptions,
    serviceOptions,
    loadingOptions,
    optionsError,
    submitting,
    submitError,
    updateField,
    submit,
    reloadOptions: loadOptions,
    activityEvidence: liveEvidence.evidence,
    activityEvidenceCapturing: liveEvidence.capturing,
    activityEvidenceError: liveEvidence.error,
    captureActivityPhoto: liveEvidence.captureEvidence,
    retakeActivityPhoto: liveEvidence.retakeEvidence,
    gpsCaptured: liveEvidence.gpsCaptured,
  };
}
