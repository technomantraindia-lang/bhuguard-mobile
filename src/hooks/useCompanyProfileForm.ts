import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '../api/authApi';
import { getCompanyProfile, updateCompanyProfile } from '../api/companyApi';
import { pickString, type ApiRecord } from '../utils/apiHelpers';

export interface CompanyProfileFormValues {
  companyName: string;
  contactPerson: string;
  mobile: string;
  email: string;
  gstNumber: string;
  address: string;
  city: string;
  district: string;
  state: string;
  industryType: string;
  status: string;
}

function mapProfile(data: ApiRecord): CompanyProfileFormValues {
  const root = (data.profile ?? data) as ApiRecord;
  const company = (root.company ?? root) as ApiRecord;

  return {
    companyName: pickString(company, 'company_name', 'name'),
    contactPerson: pickString(company, 'contact_person'),
    mobile: pickString(company, 'mobile'),
    email: pickString(company, 'email'),
    gstNumber: pickString(company, 'gst_number'),
    address: pickString(company, 'address'),
    city: pickString(company, 'city'),
    district: pickString(company, 'district'),
    state: pickString(company, 'state'),
    industryType: pickString(company, 'industry_type'),
    status: pickString(company, 'status'),
  };
}

export function useCompanyProfileForm() {
  const [values, setValues] = useState<CompanyProfileFormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getCompanyProfile();
      setValues(mapProfile(data as ApiRecord));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load company profile.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateField = (field: keyof CompanyProfileFormValues, value: string) => {
    setValues((current) => (current ? { ...current, [field]: value } : current));
    setSuccessMessage(null);
  };

  const save = async () => {
    if (!values) {
      return;
    }

    if (!values.companyName.trim()) {
      setError('Company name is required.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await updateCompanyProfile({
        company_name: values.companyName.trim(),
        contact_person: values.contactPerson.trim() || undefined,
        mobile: values.mobile.trim() || undefined,
        email: values.email.trim() || undefined,
        gst_number: values.gstNumber.trim() || undefined,
        address: values.address.trim() || undefined,
        city: values.city.trim() || undefined,
        district: values.district.trim() || undefined,
        state: values.state.trim() || undefined,
        industry_type: values.industryType.trim() || undefined,
      });

      setSuccessMessage('Profile updated successfully.');
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update profile.'));
    } finally {
      setSaving(false);
    }
  };

  return {
    values,
    loading,
    saving,
    error,
    successMessage,
    reload: load,
    updateField,
    save,
  };
}
