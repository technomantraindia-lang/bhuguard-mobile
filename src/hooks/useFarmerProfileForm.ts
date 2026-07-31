import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '../api/authApi';
import { getFarmerBankDetails, getFarmerProfile, saveFarmerBankDetails, updateFarmerProfile } from '../api/farmerApi';
import { genderLabel } from '../constants/farmerGenderOptions';
import { useTranslation } from '../i18n/I18nContext';
import { getAuthUser } from '../storage/authStorage';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { pickString, type ApiRecord } from '../utils/apiHelpers';
import { normalizeAppLanguage } from '../utils/preferredLanguage';

export interface FarmerProfileViewModel {
  fullName: string;
  farmerId: string;
  mobile: string;
  email: string;
  verificationStatus: string;
  projectName: string;
  gender: string;
  genderValue: string;
  aadhaarMasked: string;
  aadhaarNumber: string;
  panMasked: string;
  panNumber: string;
  village: string;
  taluka: string;
  district: string;
  state: string;
  pincode: string;
  fullAddress: string;
  gpsStatus: string;
  accountHolder: string;
  bankName: string;
  accountNumber: string;
  accountNumberRaw: string;
  ifscCode: string;
  branchName: string;
  accountType: string;
  upiId: string;
  preferredLanguage: string;
  photoUrl: string | null;
}

function formatFarmerId(code: string, id: string): string {
  if (code && code !== '-') {
    return code.startsWith('BG-') ? code : `BG-${code}`;
  }

  if (id && id !== '-') {
    return `BG-F-${id.padStart(6, '0')}`;
  }

  return 'BG-F-000000';
}

function emptyField(): string {
  return '—';
}

function maskAadhaar(value: string): string {
  const digits = value.replace(/\D/g, '');

  if (digits.length < 4) {
    return emptyField();
  }

  return `XXXX-XXXX-${digits.slice(-4)}`;
}

function maskPan(value: string): string {
  const normalized = value.replace(/\s/g, '').toUpperCase();

  if (normalized.length < 4) {
    return emptyField();
  }

  return `${normalized.slice(0, 2)}XXXXX${normalized.slice(-1)}`;
}

function buildDefaultProfile(authName?: string, authMobile?: string): FarmerProfileViewModel {
  return {
    fullName: authName ?? emptyField(),
    farmerId: emptyField(),
    mobile: authMobile ?? emptyField(),
    email: emptyField(),
    verificationStatus: emptyField(),
    projectName: 'Biochar',
    gender: emptyField(),
    genderValue: '',
    aadhaarMasked: emptyField(),
    aadhaarNumber: '',
    panMasked: emptyField(),
    panNumber: '',
    village: emptyField(),
    taluka: emptyField(),
    district: emptyField(),
    state: emptyField(),
    pincode: emptyField(),
    fullAddress: emptyField(),
    gpsStatus: emptyField(),
    accountHolder: authName ?? emptyField(),
    bankName: emptyField(),
    accountNumber: emptyField(),
    accountNumberRaw: '',
    ifscCode: emptyField(),
    branchName: emptyField(),
    accountType: emptyField(),
    upiId: emptyField(),
    preferredLanguage: 'en',
    photoUrl: null,
  };
}

export function useFarmerProfileForm() {
  const { setLanguage } = useTranslation();
  const [profile, setProfile] = useState<FarmerProfileViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [authUser, profileData, bankData] = await Promise.all([
        getAuthUser(),
        getFarmerProfile(),
        getFarmerBankDetails().catch(() => ({ bank_details: null })),
      ]);

      const defaults = buildDefaultProfile(authUser?.name, authUser?.mobile);
      const root = (profileData.profile ?? profileData) as ApiRecord;
      const farmerProfile = (root.farmer_profile ?? root) as ApiRecord;
      const bankRoot = (bankData.bank_details ?? bankData) as ApiRecord | null;

      const name = pickString(root, 'name') !== '-' ? pickString(root, 'name') : defaults.fullName;
      const email = pickString(root, 'email') !== '-' ? pickString(root, 'email') : defaults.email;
      const mobile = pickString(root, 'mobile') !== '-' ? pickString(root, 'mobile') : defaults.mobile;
      const status = pickString(farmerProfile, 'status') !== '-' ? pickString(farmerProfile, 'status') : defaults.verificationStatus;
      const genderValue = pickString(farmerProfile, 'gender') !== '-' ? pickString(farmerProfile, 'gender') : '';
      const aadhaarRaw = pickString(farmerProfile, 'aadhaar_number', 'aadhaar_masked', 'aadhaar');
      const panRaw = pickString(farmerProfile, 'pan_number', 'pan_masked', 'pan');
      const fromBackend = normalizeAppLanguage(pickString(farmerProfile, 'preferred_language'));

      if (fromBackend) {
        void setLanguage(fromBackend);
      }

      setProfile({
        ...defaults,
        fullName: name,
        farmerId: formatFarmerId(pickString(farmerProfile, 'farmer_code'), pickString(farmerProfile, 'id')),
        mobile,
        email,
        verificationStatus: ['verified', 'active', 'approved'].includes(status.toLowerCase()) ? 'Verified' : status,
        village: pickString(farmerProfile, 'village') !== '-' ? pickString(farmerProfile, 'village') : defaults.village,
        taluka: pickString(farmerProfile, 'taluka') !== '-' ? pickString(farmerProfile, 'taluka') : defaults.taluka,
        district: pickString(farmerProfile, 'district') !== '-' ? pickString(farmerProfile, 'district') : defaults.district,
        state: pickString(farmerProfile, 'state') !== '-' ? pickString(farmerProfile, 'state') : defaults.state,
        pincode: pickString(farmerProfile, 'pincode') !== '-' ? pickString(farmerProfile, 'pincode') : defaults.pincode,
        fullAddress: pickString(farmerProfile, 'address') !== '-' ? pickString(farmerProfile, 'address') : defaults.fullAddress,
        preferredLanguage: fromBackend ?? defaults.preferredLanguage,
        genderValue,
        gender: genderValue ? genderLabel(genderValue) : emptyField(),
        aadhaarMasked: aadhaarRaw !== '-' ? maskAadhaar(aadhaarRaw) : emptyField(),
        panMasked: panRaw !== '-' ? maskPan(panRaw) : emptyField(),
        accountHolder:
          bankRoot && pickString(bankRoot, 'account_holder_name') !== '-'
            ? pickString(bankRoot, 'account_holder_name')
            : name,
        bankName: bankRoot && pickString(bankRoot, 'bank_name') !== '-' ? pickString(bankRoot, 'bank_name') : emptyField(),
        accountNumber:
          bankRoot && pickString(bankRoot, 'account_number') !== '-'
            ? pickString(bankRoot, 'account_number')
            : emptyField(),
        ifscCode: bankRoot && pickString(bankRoot, 'ifsc_code') !== '-' ? pickString(bankRoot, 'ifsc_code') : emptyField(),
        branchName:
          bankRoot && pickString(bankRoot, 'branch_name') !== '-' ? pickString(bankRoot, 'branch_name') : emptyField(),
        accountType:
          bankRoot && pickString(bankRoot, 'account_type') !== '-' ? pickString(bankRoot, 'account_type') : emptyField(),
        upiId: bankRoot && pickString(bankRoot, 'upi_id') !== '-' ? pickString(bankRoot, 'upi_id') : emptyField(),
        photoUrl: resolveMediaUrl(pickString(farmerProfile, 'photo_url')),
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load profile.'));
      const authUser = await getAuthUser();
      setProfile(buildDefaultProfile(authUser?.name, authUser?.mobile));
    } finally {
      setLoading(false);
    }
  }, [setLanguage]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveProfileFields = async (payload: ApiRecord): Promise<boolean> => {
    setSaving(true);
    setError(null);

    try {
      await updateFarmerProfile(payload);
      await load();
      return true;
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update profile.'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveBankDetails = async (payload: ApiRecord): Promise<boolean> => {
    setSaving(true);
    setError(null);

    try {
      await saveFarmerBankDetails(payload);
      await load();
      return true;
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to save bank details.'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof FarmerProfileViewModel>(key: K, value: FarmerProfileViewModel[K]) => {
    setProfile((current) => (current ? { ...current, [key]: value } : current));
  };

  return {
    profile,
    loading,
    saving,
    error,
    reload: load,
    saveProfileFields,
    saveBankDetails,
    updateField,
    setProfile,
  };
}
