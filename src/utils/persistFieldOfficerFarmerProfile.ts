import { updateFieldOfficerFarmer } from '../api/fieldOfficerApi';
import type { OnboardingDraft } from '../context/OnboardingContext';
import type { ApiRecord } from './apiHelpers';
import { buildFormDataFilePart } from './liveEvidenceCapture';
import { resolveOnboardingFileUri } from './onboardingFilePersistence';
import { logOnboardingStep1Request } from './onboardingStep1Diagnostics';
import { toPositiveEntityId } from './entityId';

function appendScalar(formData: FormData, key: string, value: string) {
  if (value.trim() !== '') {
    formData.append(key, value.trim());
  }
}

function appendFile(
  formData: FormData,
  key: string,
  file: OnboardingDraft['farmer_photo'],
) {
  if (!file) {
    return;
  }

  const part = buildFormDataFilePart(
    resolveOnboardingFileUri(file),
    file.name,
    file.mimeType || 'image/jpeg',
  );
  formData.append(key, part as unknown as Blob);
}

/** Build multipart payload for PUT /field-officer/farmers/{id} from onboarding draft. */
export function buildFieldOfficerFarmerProfileFormData(draft: OnboardingDraft): FormData {
  const formData = new FormData();

  appendScalar(formData, 'farmer_name', draft.farmer_name);
  appendScalar(formData, 'mobile', draft.mobile);
  appendScalar(formData, 'preferred_language', draft.preferred_language);
  appendScalar(formData, 'address_line', draft.address_line);
  appendScalar(formData, 'state', draft.state || 'Gujarat');
  appendScalar(formData, 'district_id', draft.district_id);
  appendScalar(formData, 'taluka_id', draft.taluka_id);
  appendScalar(formData, 'village_id', draft.village_id);
  appendScalar(formData, 'pincode', draft.pincode);
  appendFile(formData, 'farmer_photo', draft.farmer_photo);

  return formData;
}

/**
 * Persist FO-editable farmer profile when farmer_id already exists.
 * Returns null when there is no farmer_id to update.
 */
export async function persistFieldOfficerFarmerProfile(
  draft: OnboardingDraft,
): Promise<ApiRecord | null> {
  const farmerId = toPositiveEntityId(draft.farmer_id);
  if (farmerId == null) {
    return null;
  }

  logOnboardingStep1Request(farmerId);
  return updateFieldOfficerFarmer(farmerId, buildFieldOfficerFarmerProfileFormData(draft));
}
