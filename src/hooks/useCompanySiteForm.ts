import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '../api/authApi';
import { createCompanySite, getCompanySiteDetail, updateCompanySite } from '../api/companyApi';
import { pickString, type ApiRecord } from '../utils/apiHelpers';

export interface CompanySiteFormValues {
  siteName: string;
  contactPerson: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  latitude: string;
  longitude: string;
  notes: string;
}

function emptyValues(): CompanySiteFormValues {
  return {
    siteName: '',
    contactPerson: '',
    mobile: '',
    email: '',
    address: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    latitude: '',
    longitude: '',
    notes: '',
  };
}

function mapSite(data: ApiRecord): CompanySiteFormValues {
  const site = (data.site ?? data) as ApiRecord;

  return {
    siteName: pickString(site, 'site_name', 'name'),
    contactPerson: pickString(site, 'contact_person'),
    mobile: pickString(site, 'mobile'),
    email: pickString(site, 'email'),
    address: pickString(site, 'address'),
    city: pickString(site, 'city'),
    district: pickString(site, 'district'),
    state: pickString(site, 'state'),
    pincode: pickString(site, 'pincode'),
    latitude: pickString(site, 'latitude'),
    longitude: pickString(site, 'longitude'),
    notes: pickString(site, 'notes'),
  };
}

function buildPayload(values: CompanySiteFormValues): ApiRecord {
  const payload: ApiRecord = {
    site_name: values.siteName.trim(),
    contact_person: values.contactPerson.trim() || undefined,
    mobile: values.mobile.trim() || undefined,
    email: values.email.trim() || undefined,
    address: values.address.trim() || undefined,
    city: values.city.trim() || undefined,
    district: values.district.trim() || undefined,
    state: values.state.trim() || undefined,
    pincode: values.pincode.trim() || undefined,
    notes: values.notes.trim() || undefined,
  };

  if (values.latitude.trim()) {
    payload.latitude = Number(values.latitude);
  }

  if (values.longitude.trim()) {
    payload.longitude = Number(values.longitude);
  }

  return payload;
}

export function useCompanySiteForm(siteId?: number) {
  const isEdit = siteId != null && siteId > 0;
  const [values, setValues] = useState<CompanySiteFormValues>(emptyValues);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isEdit || !siteId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getCompanySiteDetail(siteId);
      setValues(mapSite(data as ApiRecord));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load site details.'));
    } finally {
      setLoading(false);
    }
  }, [isEdit, siteId]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateField = (field: keyof CompanySiteFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setError(null);
  };

  const submit = async () => {
    if (!values.siteName.trim()) {
      setError('Site name is required.');
      return false;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = buildPayload(values);

      if (isEdit && siteId) {
        await updateCompanySite(siteId, payload);
      } else {
        await createCompanySite(payload);
      }

      return true;
    } catch (err) {
      setError(getApiErrorMessage(err, isEdit ? 'Failed to update site.' : 'Failed to create site.'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    values,
    loading,
    saving,
    error,
    isEdit,
    reload: load,
    updateField,
    submit,
  };
}
