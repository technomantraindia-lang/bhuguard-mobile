export type BiocharMixingEvidenceKey =
  | 'farmer_photo'
  | 'biochar_picture'
  | 'compost_picture'
  | 'final_mixture_picture'
  | 'farmer_consent_signed_copy';

export type BiocharMixingEvidenceSlot = {
  key: BiocharMixingEvidenceKey;
  title: string;
  description: string;
  kind: 'photo' | 'document';
};

export const BIOCHAR_MIXING_EVIDENCE_SLOTS: BiocharMixingEvidenceSlot[] = [
  {
    key: 'farmer_photo',
    title: 'Farmer Photo',
    description: 'Capture live photo of the farmer at the mixing site.',
    kind: 'photo',
  },
  {
    key: 'biochar_picture',
    title: 'Biochar Picture',
    description: 'Capture live photo of biochar used for mixing.',
    kind: 'photo',
  },
  {
    key: 'compost_picture',
    title: 'Compost Picture',
    description: 'Capture live photo of compost used for mixing.',
    kind: 'photo',
  },
  {
    key: 'final_mixture_picture',
    title: 'Final mixture picture (Biochar + Compost)',
    description: 'Capture live photo of the final biochar and compost mixture.',
    kind: 'photo',
  },
  {
    key: 'farmer_consent_signed_copy',
    title: 'Farmer Consent Signed Copy',
    description: 'Capture or upload signed farmer consent copy.',
    kind: 'document',
  },
];

export const BIOCHAR_MIXING_EVIDENCE_API_FIELD: Record<BiocharMixingEvidenceKey, string> = {
  farmer_photo: 'farmer_photo',
  biochar_picture: 'biochar_picture',
  compost_picture: 'compost_picture',
  final_mixture_picture: 'final_mixture_picture',
  farmer_consent_signed_copy: 'farmer_consent_signed_copy',
};
