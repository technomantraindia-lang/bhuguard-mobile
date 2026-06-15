import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '../api/authApi';
import { getFarmerProfile, updateFarmerProfile } from '../api/farmerApi';
import { getAuthUser } from '../storage/authStorage';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { pickString, type ApiRecord } from '../utils/apiHelpers';

export interface FarmerProfileViewModel {
  fullName: string;
  farmerId: string;
  mobile: string;
  email: string;
  verificationStatus: string;
  projectName: string;
  dateOfBirth: string;
  gender: string;
  aadhaarMasked: string;
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
  ifscCode: string;
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

  return 'BG-F-000123';
}

function maskAadhaar(value: string): string {
  const digits = value.replace(/\D/g, '');

  if (digits.length < 4) {
    return 'XXXX-XXXX-1234';
  }

  return `XXXX-XXXX-${digits.slice(-4)}`;
}

function buildDefaultProfile(authName?: string, authMobile?: string): FarmerProfileViewModel {
  return {
    fullName: authName ?? 'Ramesh Patel',
    farmerId: 'BG-F-000123',
    mobile: authMobile ?? '9876543210',
    email: 'ramesh@example.com',
    verificationStatus: 'Verified',
    projectName: 'Regenerative Agriculture',
    dateOfBirth: '12 Mar 1985',
    gender: 'Male',
    aadhaarMasked: 'XXXX-XXXX-1234',
    village: 'Sanand',
    taluka: 'Sanand',
    district: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '382110',
    fullAddress: 'Near Green Valley Farm, Sanand, Ahmedabad',
    gpsStatus: 'Captured',
    accountHolder: authName ?? 'Ramesh Patel',
    bankName: 'State Bank of India',
    accountNumber: 'XXXXXX4521',
    ifscCode: 'SBIN0001234',
    upiId: 'ramesh@upi',
    preferredLanguage: 'en',
    photoUrl: null,
  };
}

export function useFarmerProfileForm() {
  const [profile, setProfile] = useState<FarmerProfileViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [authUser, profileData] = await Promise.all([
        getAuthUser(),
        getFarmerProfile(),
      ]);

      const defaults = buildDefaultProfile(authUser?.name, authUser?.mobile);
      const root = (profileData.profile ?? profileData) as ApiRecord;
      const farmerProfile = (root.farmer_profile ?? root) as ApiRecord;

      const name = pickString(root, 'name') !== '-' ? pickString(root, 'name') : defaults.fullName;
      const email = pickString(root, 'email') !== '-' ? pickString(root, 'email') : defaults.email;
      const mobile = pickString(root, 'mobile') !== '-' ? pickString(root, 'mobile') : defaults.mobile;
      const status = pickString(farmerProfile, 'status') !== '-' ? pickString(farmerProfile, 'status') : defaults.verificationStatus;

      setProfile({
        ...defaults,
        fullName: name,
        farmerId: formatFarmerId(pickString(farmerProfile, 'farmer_code'), pickString(farmerProfile, 'id')),
        mobile,
        email,
        verificationStatus: ['verified', 'active', 'approved'].includes(status.toLowerCase()) ? 'Verified' : status,
        projectName: defaults.projectName,
        village: pickString(farmerProfile, 'village') !== '-' ? pickString(farmerProfile, 'village') : defaults.village,
        taluka: pickString(farmerProfile, 'taluka') !== '-' ? pickString(farmerProfile, 'taluka') : defaults.taluka,
        district: pickString(farmerProfile, 'district') !== '-' ? pickString(farmerProfile, 'district') : defaults.district,
        state: pickString(farmerProfile, 'state') !== '-' ? pickString(farmerProfile, 'state') : defaults.state,
        pincode: pickString(farmerProfile, 'pincode') !== '-' ? pickString(farmerProfile, 'pincode') : defaults.pincode,
        fullAddress: pickString(farmerProfile, 'address') !== '-' ? pickString(farmerProfile, 'address') : defaults.fullAddress,
        preferredLanguage:
          pickString(farmerProfile, 'preferred_language') !== '-'
            ? pickString(farmerProfile, 'preferred_language')
            : defaults.preferredLanguage,
        aadhaarMasked: maskAadhaar(pickString(farmerProfile, 'aadhaar_number', 'aadhaar')),
        accountHolder: name,
        photoUrl: resolveMediaUrl(pickString(farmerProfile, 'photo_url')),
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load profile.'));
      const authUser = await getAuthUser();
      setProfile(buildDefaultProfile(authUser?.name, authUser?.mobile));
    } finally {
      setLoading(false);
    }
  }, []);

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
    updateField,
    setProfile,
  };
}
