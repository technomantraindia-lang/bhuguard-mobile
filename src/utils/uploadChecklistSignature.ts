import { buildEvidenceFormData, uploadVerificationEvidence } from '../api/evidenceApi';
import { buildFormDataFilePart } from './liveEvidenceCapture';
import { inferSignatureMimeType, signatureFileName } from './signatureImageCapture';
import { pickString, type ApiRecord } from './apiHelpers';

export type ChecklistSignatureRole = 'farmer' | 'officer';

function signatureCategory(role: ChecklistSignatureRole): 'farmer_signature' | 'officer_signature' {
  return role === 'farmer' ? 'farmer_signature' : 'officer_signature';
}

export async function uploadChecklistSignature(
  assignmentId: number | string,
  role: ChecklistSignatureRole,
  fileUri: string,
): Promise<{ evidence: ApiRecord; fileUrl: string | null }> {
  const category = signatureCategory(role);
  const mimeType = inferSignatureMimeType(fileUri);
  const formData = buildEvidenceFormData(
    {
      uri: fileUri,
      name: signatureFileName(role, fileUri),
      type: mimeType,
    },
    {
      evidence_category: category,
      title: role === 'farmer' ? 'Farmer signature' : 'Officer signature',
    },
    'field_officer',
  );

  const response = await uploadVerificationEvidence(assignmentId, formData);
  const evidence = (response.evidence ?? response) as ApiRecord;
  const fileUrl = pickString(evidence, 'file_url', 'url', 'download_url');

  return {
    evidence,
    fileUrl: fileUrl !== '-' ? fileUrl : null,
  };
}

export function buildReceiverSignatureFormPart(uri: string): Blob {
  return buildFormDataFilePart(uri, 'receiver-signature.png', 'image/png') as unknown as Blob;
}
