import { useCallback, useEffect, useMemo, useState } from 'react';

import { getApiErrorMessage } from '../api/authApi';
import { createFarmerBaselineAssessment, getFarmerFarms } from '../api/farmerApi';
import { DEFAULT_BASELINE_YIELD_UNIT, type BaselineYieldUnit } from '../constants/baselineAssessmentUnits';
import { extractList, type ApiRecord } from '../utils/apiHelpers';
import { todayIsoDate } from '../utils/activityDateHelpers';
import { getFarmLocationLabel, mapFarmRecord } from '../utils/farmMapHelpers';

export interface BaselineFarmOption {
  id: number;
  name: string;
  subtitle: string;
}

export interface BaselineAssessmentFormState {
  farmId: number | null;
  assessmentDate: string;
  soilOrganicCarbon: string;
  soilPh: string;
  yieldValue: string;
  yieldUnit: string;
  fertilizerUse: string;
  waterUse: string;
}

interface UseAddBaselineAssessmentFormOptions {
  initialFarmId?: number;
}

function validateForm(form: BaselineAssessmentFormState): string | null {
  if (!form.farmId) {
    return 'Please select a farm.';
  }

  if (!form.assessmentDate) {
    return 'Please choose the assessment date.';
  }

  const soc = Number(form.soilOrganicCarbon);
  const ph = Number(form.soilPh);
  const yieldValue = Number(form.yieldValue);

  if (!Number.isFinite(soc) || soc < 0) {
    return 'Enter a valid soil organic carbon value.';
  }

  if (!Number.isFinite(ph) || ph < 0 || ph > 14) {
    return 'Enter soil pH between 0 and 14.';
  }

  if (!Number.isFinite(yieldValue) || yieldValue <= 0) {
    return 'Enter a valid yield value.';
  }

  if (!form.fertilizerUse.trim()) {
    return 'Describe fertilizer use before the project.';
  }

  if (!form.waterUse.trim()) {
    return 'Describe water use before the project.';
  }

  return null;
}

export function useAddBaselineAssessmentForm({ initialFarmId }: UseAddBaselineAssessmentFormOptions = {}) {
  const [farms, setFarms] = useState<BaselineFarmOption[]>([]);
  const [farmsLoading, setFarmsLoading] = useState(true);
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(initialFarmId ?? null);
  const [assessmentDate, setAssessmentDate] = useState(todayIsoDate());
  const [soilOrganicCarbon, setSoilOrganicCarbon] = useState('');
  const [soilPh, setSoilPh] = useState('');
  const [yieldValue, setYieldValue] = useState('');
  const [yieldUnit, setYieldUnit] = useState<BaselineYieldUnit>(DEFAULT_BASELINE_YIELD_UNIT);
  const [fertilizerUse, setFertilizerUse] = useState('');
  const [waterUse, setWaterUse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedFarm = useMemo(
    () => farms.find((farm) => farm.id === selectedFarmId) ?? null,
    [farms, selectedFarmId],
  );

  const loadFarms = useCallback(async () => {
    setFarmsLoading(true);

    try {
      const data = await getFarmerFarms();
      const records = extractList(data as ApiRecord, ['farms']);
      const options = records
        .map((record) => {
          const farm = mapFarmRecord(record);

          return {
            id: farm.id,
            name: farm.name,
            subtitle: `${farm.areaLabel} • ${getFarmLocationLabel(record)}`,
          };
        })
        .filter((farm) => farm.id > 0);

      setFarms(options);

      if (initialFarmId && options.some((farm) => farm.id === initialFarmId)) {
        setSelectedFarmId(initialFarmId);
      } else {
        setSelectedFarmId((current) => current ?? (options.length === 1 ? options[0].id : null));
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load farms.'));
    } finally {
      setFarmsLoading(false);
    }
  }, [initialFarmId]);

  useEffect(() => {
    void loadFarms();
  }, [loadFarms]);

  const submit = useCallback(async (): Promise<boolean> => {
    const form: BaselineAssessmentFormState = {
      farmId: selectedFarmId,
      assessmentDate,
      soilOrganicCarbon,
      soilPh,
      yieldValue,
      yieldUnit,
      fertilizerUse,
      waterUse,
    };

    const validationError = validateForm(form);

    if (validationError) {
      setError(validationError);
      return false;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createFarmerBaselineAssessment({
        farm_id: selectedFarmId,
        assessment_date: assessmentDate,
        soil_organic_carbon: Number(soilOrganicCarbon),
        soil_ph: Number(soilPh),
        yield_value: Number(yieldValue),
        yield_unit: yieldUnit,
        fertilizer_use: fertilizerUse.trim(),
        water_use: waterUse.trim(),
      });

      return true;
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to submit baseline assessment.'));
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [
    assessmentDate,
    fertilizerUse,
    selectedFarmId,
    soilOrganicCarbon,
    soilPh,
    waterUse,
    yieldUnit,
    yieldValue,
  ]);

  return {
    farms,
    farmsLoading,
    selectedFarmId,
    selectedFarm,
    setSelectedFarmId,
    assessmentDate,
    setAssessmentDate,
    soilOrganicCarbon,
    setSoilOrganicCarbon,
    soilPh,
    setSoilPh,
    yieldValue,
    setYieldValue,
    yieldUnit,
    setYieldUnit,
    fertilizerUse,
    setFertilizerUse,
    waterUse,
    setWaterUse,
    submitting,
    error,
    setError,
    submit,
  };
}
