import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { buildOnboardingNotes } from '../utils/onboardingNotes';
import { DEFAULT_FIELD_OFFICER_SERVICE_INTERESTS } from '../constants/fieldOfficerOnboarding';
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
  farmer_id: number | null;
  farm_id: number | null;
  farmer_code: string;
  farmer_display_id: string;
  farm_code: string;
  farm_display_id: string;
  farm_name: string;
  farmer_name: string;
  mobile: string;
  mpin: string;
  confirm_mpin: string;
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
  ownership_other_detail: string;
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
  agreement_otp_verified: boolean;
  agreement_verification_token: string;
  agreement_verified_at: string;
  agreement_verified_mobile: string;
  notes: string;
  farmer_photo: FileAsset | null;
  consent_form: FileAsset | null;
  consent_documents: FileAsset[];
  onboarding_evidences: FileAsset[];
  farmer_documents: FileAsset[];
  proof_of_land_ownership: FileAsset | null;
  /** "Farmer with Farm Photo" evidence — Phase 10.4 step 3, distinct from `farmer_photo` (profile pic). */
  farmer_with_farm_photo: FileAsset | null;
  /** Set when the user continues past the Documents step (prevents false green on overview). */
  documents_step_completed: boolean;
  boundary_mapping_status: MappingStatus;
  boundary_unit: AreaUnit;
  boundary_capture_method: 'gps' | 'camera' | 'manual';
  boundary_points: BoundaryPoint[];
  boundary_pending_reason: string;
  boundary_verification_status: string;
}

const defaultDraft: OnboardingDraft = {
  farmer_id: null,
  farm_id: null,
  farmer_code: '',
  farmer_display_id: '',
  farm_code: '',
  farm_display_id: '',
  farm_name: '',
  farmer_name: '',
  mobile: '',
  mpin: '',
  confirm_mpin: '',
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
  ownership_other_detail: '',
  crop_type: '',
  irrigation_type: '',
  soil_type: '',
  existing_farming_practice: '',
  service_interest: 'Biochar',
  project_interest: ['Biochar'],
  service_interests: [...DEFAULT_FIELD_OFFICER_SERVICE_INTERESTS],
  remarks: '',
  gps_latitude: '',
  gps_longitude: '',
  gps_accuracy: '',
  gps_captured_at: '',
  data_usage_consent: true,
  carbon_rights_consent: true,
  project_participation_consent: false,
  farmer_signature_confirmed: false,
  agreement_otp_verified: false,
  agreement_verification_token: '',
  agreement_verified_at: '',
  agreement_verified_mobile: '',
  notes: '',
  farmer_photo: null,
  consent_form: null,
  consent_documents: [],
  onboarding_evidences: [],
  farmer_documents: [],
  proof_of_land_ownership: null,
  farmer_with_farm_photo: null,
  documents_step_completed: false,
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
  /** Lean multipart for POST finalize-onboarding (token, consents, evidence only). */
  toFinalizeFormData: () => FormData;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);
const ONBOARDING_DRAFT_STORAGE_KEY = '@bhuguard/onboarding-draft-v1';

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<OnboardingDraft>(defaultDraft);
  const [result, setResult] = useState<OnboardingResult | null>(null);
  const hydratedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    const hydrate = async () => {
      try {
        const raw = await AsyncStorage.getItem(ONBOARDING_DRAFT_STORAGE_KEY);
        if (!raw || !mounted) {
          return;
        }
        const parsed = JSON.parse(raw) as { draft?: Partial<OnboardingDraft>; result?: OnboardingResult | null };
        if (parsed.draft && typeof parsed.draft === 'object') {
          setDraft((prev) => ({ ...prev, ...parsed.draft }));
        }
        if (parsed.result !== undefined) {
          setResult(parsed.result);
        }
      } catch {
        // Ignore invalid cache; fresh draft will be used.
      } finally {
        hydratedRef.current = true;
      }
    };
    void hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) {
      return;
    }
    const payload = JSON.stringify({ draft, result });
    void AsyncStorage.setItem(ONBOARDING_DRAFT_STORAGE_KEY, payload);
  }, [draft, result]);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      draft,
      result,
      updateDraft: (patch) => setDraft((prev) => ({ ...prev, ...patch })),
      setResult,
      resetDraft: () => {
        setDraft(defaultDraft);
        setResult(null);
        void AsyncStorage.removeItem(ONBOARDING_DRAFT_STORAGE_KEY);
      },
      toFormData: () => {
        const formData = new FormData();

        appendScalar(formData, 'farmer_name', draft.farmer_name);
        appendScalar(formData, 'mobile', draft.mobile);
        // Farmer unlock is Pattern-based after OTP; do not send legacy MPIN from onboarding.
        appendScalar(formData, 'agreement_verification_token', draft.agreement_verification_token);
        appendScalar(formData, 'email', draft.email);
        appendScalar(formData, 'preferred_language', draft.preferred_language);
        appendScalar(formData, 'address_line', draft.address_line);
        appendScalar(formData, 'state', draft.state || 'Gujarat');
        appendScalar(formData, 'district_id', draft.district_id);
        appendScalar(formData, 'taluka_id', draft.taluka_id);
        appendScalar(formData, 'village_id', draft.village_id);
        appendScalar(formData, 'pincode', draft.pincode);
        appendScalar(formData, 'land_survey_number', draft.land_survey_number);
        appendScalar(formData, 'farm_name', draft.farm_name);
        appendScalar(formData, 'land_area', draft.land_area);
        appendScalar(formData, 'land_area_unit', draft.land_area_unit);
        appendScalar(formData, 'gps_latitude', draft.gps_latitude);
        appendScalar(formData, 'gps_longitude', draft.gps_longitude);
        appendScalar(formData, 'gps_accuracy', draft.gps_accuracy);
        appendScalar(formData, 'crop_type', draft.crop_type);
        appendScalar(formData, 'ownership_type', draft.ownership_type);
        if (draft.ownership_type.trim() === 'other') {
          appendScalar(formData, 'ownership_other_detail', draft.ownership_other_detail);
        }
        appendScalar(formData, 'irrigation_type', draft.irrigation_type);
        appendScalar(formData, 'soil_type', draft.soil_type);

        draft.project_interest.forEach((interest) => formData.append('project_interest[]', interest));
        formData.append('service_interests[]', 'Biochar');

        const notes = buildOnboardingNotes(draft);

        if (notes) {
          formData.append('notes', notes);
        }

        formData.append('data_usage_consent', draft.data_usage_consent ? '1' : '0');
        formData.append('carbon_rights_consent', draft.carbon_rights_consent ? '1' : '0');
        formData.append('project_participation_consent', draft.project_participation_consent ? '1' : '0');
        formData.append('farmer_signature_confirmed', draft.farmer_signature_confirmed ? '1' : '0');

        appendFile(formData, 'farmer_photo', draft.farmer_photo);
        appendFile(formData, 'consent_form', draft.consent_form);
        draft.consent_documents.forEach((file) => appendFile(formData, 'consent_documents[]', file));
        draft.onboarding_evidences.forEach((file) => appendFile(formData, 'legal_agreement_photos[]', file));
        appendFile(formData, 'legal_agreement_photos[]', draft.farmer_with_farm_photo);
        draft.farmer_documents.forEach((file) => appendFile(formData, 'documents[]', file));
        appendFile(formData, 'proof_of_land_ownership', draft.proof_of_land_ownership);

        const hasStampedImage = [
          draft.farmer_photo,
          draft.proof_of_land_ownership,
          draft.farmer_with_farm_photo,
          ...draft.onboarding_evidences,
        ].some((file) => file?.mimeType?.startsWith('image/'));

        if (hasStampedImage) {
          formData.append('client_pre_stamped', '1');
        }

        if (draft.gps_captured_at.trim()) {
          formData.append('captured_at', draft.gps_captured_at.trim());
        }

        if (
          draft.boundary_points.length >= 3
          && (draft.boundary_mapping_status === 'mapped' || draft.boundary_mapping_status === 'pending_review')
        ) {
          const mappingPayload = buildOnboardingBoundaryPayload(draft);
          formData.append('boundary_mapping', JSON.stringify(mappingPayload));
        }

        return formData;
      },
      toFinalizeFormData: () => {
        const formData = new FormData();

        appendScalar(formData, 'agreement_verification_token', draft.agreement_verification_token);
        if (draft.farm_id != null) {
          formData.append('farm_id', String(draft.farm_id));
        }

        formData.append('data_usage_consent', draft.data_usage_consent ? '1' : '0');
        formData.append('carbon_rights_consent', draft.carbon_rights_consent ? '1' : '0');
        formData.append('project_participation_consent', draft.project_participation_consent ? '1' : '0');

        appendScalar(formData, 'gps_latitude', draft.gps_latitude);
        appendScalar(formData, 'gps_longitude', draft.gps_longitude);
        appendScalar(formData, 'gps_accuracy', draft.gps_accuracy);

        appendFile(formData, 'consent_form', draft.consent_form);
        draft.consent_documents.forEach((file) => appendFile(formData, 'consent_documents[]', file));
        draft.onboarding_evidences.forEach((file) => appendFile(formData, 'legal_agreement_photos[]', file));
        appendFile(formData, 'legal_agreement_photos[]', draft.farmer_with_farm_photo);
        draft.farmer_documents.forEach((file) => appendFile(formData, 'documents[]', file));
        appendFile(formData, 'proof_of_land_ownership', draft.proof_of_land_ownership);

        const hasStampedImage = [
          draft.proof_of_land_ownership,
          draft.farmer_with_farm_photo,
          ...draft.onboarding_evidences,
        ].some((file) => file?.mimeType?.startsWith('image/'));

        if (hasStampedImage) {
          formData.append('client_pre_stamped', '1');
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
