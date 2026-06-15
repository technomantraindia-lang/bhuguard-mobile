export type ProfileDocumentStatus = 'uploaded' | 'pending' | 'verified';

export interface ProfileDocumentItem {
  id: string;
  title: string;
  status: ProfileDocumentStatus;
}

export const FARMER_PROFILE_DOCUMENTS: ProfileDocumentItem[] = [
  { id: 'aadhaar', title: 'Aadhaar Card', status: 'verified' },
  { id: 'pan', title: 'PAN Card', status: 'uploaded' },
  { id: 'land', title: 'Land Ownership Document', status: 'verified' },
  { id: 'bank_passbook', title: 'Bank Passbook', status: 'pending' },
  { id: 'agreement', title: 'Project Agreement', status: 'verified' },
];

export const PROFILE_LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'gu', label: 'Gujarati' },
  { value: 'mr', label: 'Marathi' },
] as const;
