import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '../api/authApi';
import { getFarmerBaselineAssessmentDetail } from '../api/farmerApi';
import { formatActivityDisplayDate, formatActivityTimestamp } from '../utils/activityDateHelpers';
import { pickString, type ApiRecord } from '../utils/apiHelpers';

export interface FarmerBaselineAssessmentViewModel {
  id: number;
  farmName: string;
  assessmentDateLabel: string;
  statusLabel: string;
  soilOrganicCarbonLabel: string;
  soilPhLabel: string;
  yieldLabel: string;
  fertilizerUse: string;
  waterUse: string;
  recordedAtLabel: string | null;
}

function mapAssessment(record: ApiRecord): FarmerBaselineAssessmentViewModel | null {
  const id = Number(record.id);

  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }

  const yieldValue = pickString(record, 'yield_value');
  const yieldUnit = pickString(record, 'yield_unit');
  const soc = pickString(record, 'soil_organic_carbon');
  const ph = pickString(record, 'soil_ph');

  return {
    id,
    farmName: pickString(record, 'farm_name', 'farm.farm_name') !== '-' ? pickString(record, 'farm_name', 'farm.farm_name') : 'Farm',
    assessmentDateLabel:
      pickString(record, 'assessment_date') !== '-'
        ? formatActivityDisplayDate(pickString(record, 'assessment_date').slice(0, 10))
        : '—',
    statusLabel: pickString(record, 'status') !== '-' ? pickString(record, 'status').replace(/_/g, ' ') : 'submitted',
    soilOrganicCarbonLabel: soc !== '-' ? `${soc}%` : '—',
    soilPhLabel: ph !== '-' ? ph : '—',
    yieldLabel:
      yieldValue !== '-' ? `${yieldValue}${yieldUnit !== '-' ? ` ${yieldUnit}` : ''}` : '—',
    fertilizerUse: pickString(record, 'fertilizer_use') !== '-' ? pickString(record, 'fertilizer_use') : '—',
    waterUse: pickString(record, 'water_use') !== '-' ? pickString(record, 'water_use') : '—',
    recordedAtLabel: formatActivityTimestamp(pickString(record, 'created_at')),
  };
}

export function useFarmerBaselineAssessmentDetail(assessmentId: number) {
  const [assessment, setAssessment] = useState<FarmerBaselineAssessmentViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getFarmerBaselineAssessmentDetail(assessmentId);
      const record = (data.baseline_assessment ?? data) as ApiRecord;
      const mapped = mapAssessment(record);

      if (!mapped) {
        throw new Error('Baseline assessment not found.');
      }

      setAssessment(mapped);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load baseline assessment.'));
      setAssessment(null);
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { assessment, loading, error, reload };
}
