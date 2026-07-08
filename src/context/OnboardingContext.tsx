import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { buildOnboardingNotes } from '../utils/onboardingNotes';
import type { AreaUnit, BoundaryPoint } from '../utils/boundaryGeometry';
import { buildOnboardingBoundaryPayload } from '../utils/onboardingBoundary';
import type { MappingStatus } from '../utils/landMappingHelpers';

export interface FileAsset {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
}

export interface OnboardingResult {
  farmer_id: number;
  farmer_name: string;
  mobile: string;
  village?: string;
  taluka?: string;
  district?: string;
  state?: string;
  onboarded_at?: string;
  photo_url?: string;
  farm_id?: number;
  land_survey_number?: string;
  land_area?: number | string;
  land_area_unit?: string;
}

export interface OnboardingDraft {
  farmer_name: string;
  mobile: string;
  username: string;
  password: string;
  confirm_password: string;
  alternate_mobile: string;
  email: string;
  gender: string;
  age: string;
  farmer_category: string;
  preferred_language: string;
  aadhaar_number: string;
  address_line: string;
  state: string;
  district_id: string;
  district_name: string;
  taluka_id: string;
  taluka_name: string;
  village_id: string;
  village_name: string;
  pincode: string;
  land_survey_number: string;
  land_area: string;
  land_area_unit: string;
  ownership_type: string;
  crop_type: string;
  irrigation_type: string;
  soil_type: string;
  existing_farming_practice: string;
  service_interest: string;
  project_interest: string[];
  service_interests: string[];
  remarks: string;
  gps_latitude: string;
  gps_longitude: string;
  gps_accuracy: string;
  gps_captured_at: string;
  data_usage_consent: boolean;
  carbon_rights_consent: boolean;
  project_participation_consent: boolean;
  farmer_signature_confirmed: boolean;
  notes: string;
  farmer_photo: FileAsset | null;
  consent_form: FileAsset | null;
  proof_of_land_ownership: FileAsset | null;
  boundary_mapping_status: MappingStatus;
  boundary_unit: AreaUnit;
  boundary_capture_method: 'gps' | 'camera';
  boundary_points: BoundaryPoint[];
  boundary_pending_reason: string;
  boundary_verification_status: string;
}

const defaultDraft: OnboardingDraft = {
  farmer_name: '',
  mobile: '',
  username: '',
  password: '',
  confirm_password: '',
  alternate_mobile: '',
  email: '',
  gender: '',
  age: '',
  farmer_category: '',
  preferred_language: 'Gujarati',
  aadhaar_number: '',
  address_line: '',
  state: 'Gujarat',
  district_id: '',
  district_name: '',
  taluka_id: '',
  taluka_name: '',
  village_id: '',
  village_name: '',
  pincode: '',
  land_survey_number: '',
  land_area: '',
  land_area_unit: 'acre',
  ownership_type: '',
  crop_type: '',
  irrigation_type: '',
  soil_type: '',
  existing_farming_practice: '',
  service_interest: '',
  project_interest: [],
  service_interests: [],
  remarks: '',
  gps_latitude: '',
  gps_longitude: '',
  gps_accuracy: '',
  gps_captured_at: '',
  data_usage_consent: true,
  carbon_rights_consent: true,
  project_participation_consent: false,
  farmer_signature_confirmed: false,
  notes: '',
  farmer_photo: null,
  consent_form: null,
  proof_of_land_ownership: null,
  boundary_mapping_status: 'not_mapped',
  boundary_unit: 'acre',
  boundary_capture_method: 'gps',
  boundary_points: [],
  boundary_pending_reason: '',
  boundary_verification_status: 'pending_review',
};

function appendFile(formData: FormData, key: string, file: FileAsset | null) {
  if (!file) {
    return;
  }

  formData.append(key, {
    uri: file.uri,
    name: file.name,
    type: file.mimeType,
  } as unknown as Blob);
}

function appendScalar(formData: FormData, key: string, value: string) {
  if (value.trim() !== '') {
    formData.append(key, value.trim());
  }
}

interface OnboardingContextValue {
  draft: OnboardingDraft;
  result: OnboardingResult | null;
  updateDraft: (patch: Partial<OnboardingDraft>) => void;
  setResult: (result: OnboardingResult | null) => void;
  resetDraft: () => void;
  toFormData: () => FormData;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<OnboardingDraft>(defaultDraft);
  const [result, setResult] = useState<OnboardingResult | null>(null);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      draft,
      result,
      updateDraft: (patch) => setDraft((prev) => ({ ...prev, ...patch })),
      setResult,
      resetDraft: () => {
        setDraft(defaultDraft);
        setResult(null);
      },
      toFormData: () => {
        const formData = new FormData();

        appendScalar(formData, 'farmer_name', draft.farmer_name);
        appendScalar(formData, 'mobile', draft.mobile);
        appendScalar(formData, 'username', draft.username);
        appendScalar(formData, 'password', draft.password);
        appendScalar(formData, 'confirm_password', draft.confirm_password);
        appendScalar(formData, 'email', draft.email);
        appendScalar(formData, 'preferred_language', draft.preferred_language);
        appendScalar(formData, 'address_line', draft.address_line);
        appendScalar(formData, 'state', draft.state || 'Gujarat');
        appendScalar(formData, 'district_id', draft.district_id);
        appendScalar(formData, 'taluka_id', draft.taluka_id);
        appendScalar(formData, 'village_id', draft.village_id);
        appendScalar(formData, 'pincode', draft.pincode);
        appendScalar(formData, 'land_survey_number', draft.land_survey_number);
        appendScalar(formData, 'land_area', draft.land_area);
        appendScalar(formData, 'land_area_unit', draft.land_area_unit);
        appendScalar(formData, 'gps_latitude', draft.gps_latitude);
        appendScalar(formData, 'gps_longitude', draft.gps_longitude);
        appendScalar(formData, 'gps_accuracy', draft.gps_accuracy);
        appendScalar(formData, 'crop_type', draft.crop_type);
        appendScalar(formData, 'ownership_type', draft.ownership_type);
        appendScalar(formData, 'irrigation_type', draft.irrigation_type);
        appendScalar(formData, 'soil_type', draft.soil_type);

        draft.project_interest.forEach((interest) => formData.append('project_interest[]', interest));
        draft.service_interests.forEach((interest) => formData.append('service_interests[]', interest));

        const notes = buildOnboardingNotes(draft);

        if (notes) {
          formData.append('notes', notes);
        }

        formData.append('data_usage_consent', draft.data_usage_consent ? '1' : '0');
        formData.append('carbon_rights_consent', draft.carbon_rights_consent ? '1' : '0');
        formData.append('project_participation_consent', draft.project_participation_consent ? '1' : '0');

        appendFile(formData, 'farmer_photo', draft.farmer_photo);
        appendFile(formData, 'consent_form', draft.consent_form);
        appendFile(formData, 'proof_of_land_ownership', draft.proof_of_land_ownership);

        const hasStampedImage =
          [draft.farmer_photo, draft.proof_of_land_ownership].some(
            (file) => file?.mimeType?.startsWith('image/'),
          );

        if (hasStampedImage) {
          formData.append('client_pre_stamped', '1');
        }

        if (draft.gps_captured_at.trim()) {
          formData.append('captured_at', draft.gps_captured_at.trim());
        }

        if (draft.boundary_points.length >= 3) {
          const mappingPayload = buildOnboardingBoundaryPayload(draft);
          formData.append('boundary_mapping', JSON.stringify(mappingPayload));
        }

        return formData;
      },
    }),
    [draft, result],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);

  if (!ctx) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }

  return ctx;
}
