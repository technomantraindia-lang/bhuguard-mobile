import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import * as Location from 'expo-location';

import { getApiErrorMessage } from '../api/authApi';
import { getFarmerFarmDetail, updateFarmerFarm } from '../api/farmerApi';
import {
  DEFAULT_FARM_AREA_UNIT,
  mapFarmAreaUnitFromApi,
  mapFarmAreaUnitToApi,
  type FarmerFarmAreaUnit,
} from '../constants/farmerFarmAreaUnits';
import { pickString, type ApiRecord } from '../utils/apiHelpers';
import type { AddFarmFieldKey, AddFarmerFarmFormState, FarmAddressValue } from './useAddFarmerFarmForm';

function mapFarmToForm(farm: ApiRecord): AddFarmerFarmFormState {
  return {
    name: pickString(farm, 'farm_name', 'name') !== '-' ? pickString(farm, 'farm_name', 'name') : '',
    area: String(farm.land_area ?? farm.area ?? ''),
    areaUnit: mapFarmAreaUnitFromApi(String(farm.land_area_unit ?? farm.area_unit ?? DEFAULT_FARM_AREA_UNIT)),
    cropType: pickString(farm, 'crop_type') !== '-' ? pickString(farm, 'crop_type') : '',
    soilType: pickString(farm, 'soil_type') !== '-' ? pickString(farm, 'soil_type') : '',
    state: pickString(farm, 'state') !== '-' ? pickString(farm, 'state') : 'Gujarat',
    districtId: '',
    district: pickString(farm, 'district') !== '-' ? pickString(farm, 'district') : '',
    talukaId: '',
    taluka: pickString(farm, 'taluka') !== '-' ? pickString(farm, 'taluka') : '',
    villageId: '',
    village: pickString(farm, 'village') !== '-' ? pickString(farm, 'village') : '',
    villageManual: false,
    pincode: pickString(farm, 'pincode') !== '-' ? pickString(farm, 'pincode') : '',
    address: pickString(farm, 'address') !== '-' ? pickString(farm, 'address') : '',
    latitude: farm.latitude != null ? String(farm.latitude) : '',
    longitude: farm.longitude != null ? String(farm.longitude) : '',
    notes: pickString(farm, 'notes') !== '-' ? pickString(farm, 'notes') : '',
  };
}

function extractFieldErrors(error: unknown): Partial<Record<AddFarmFieldKey, string>> {
  if (!axios.isAxiosError(error) || !error.response?.data?.errors) {
    return {};
  }

  const backendErrors = error.response.data.errors as Record<string, string[]>;
  const mapped: Partial<Record<AddFarmFieldKey, string>> = {};
  const fieldMap: Record<string, AddFarmFieldKey> = {
    farm_name: 'name',
    name: 'name',
    land_area: 'area',
    area: 'area',
    crop_type: 'cropType',
    soil_type: 'soilType',
    village: 'village',
    taluka: 'taluka',
    district: 'district',
    state: 'state',
    pincode: 'pincode',
    notes: 'notes',
  };

  Object.entries(backendErrors).forEach(([key, messages]) => {
    const field = fieldMap[key];
    if (field && messages[0]) {
      mapped[field] = messages[0];
    }
  });

  return mapped;
}

export function useEditFarmerFarmForm(farmId: number) {
  const [form, setForm] = useState<AddFarmerFarmFormState | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<AddFarmFieldKey, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [capturingGps, setCapturingGps] = useState(false);

  const load = useCallback(async () => {
    if (!farmId) {
      setLoadError('Farm ID is missing.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const data = await getFarmerFarmDetail(farmId);
      const farm = (data.farm ?? data) as ApiRecord;
      setForm(mapFarmToForm(farm));
    } catch (err) {
      setLoadError(getApiErrorMessage(err, 'Farm not found.'));
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateField = useCallback(
    <K extends keyof AddFarmerFarmFormState>(key: K, value: AddFarmerFarmFormState[K]) => {
      setForm((current) => (current ? { ...current, [key]: value } : current));
      setSubmitError(null);
    },
    [],
  );

  const updateAddress = useCallback((patch: Partial<FarmAddressValue & { pincode?: string }>) => {
    setForm((current) => (current ? { ...current, ...patch } : current));
    setSubmitError(null);
  }, []);

  const addressValue: FarmAddressValue | null = form
    ? {
        state: form.state,
        districtId: form.districtId,
        district: form.district,
        talukaId: form.talukaId,
        taluka: form.taluka,
        villageId: form.villageId,
        village: form.village,
        villageManual: form.villageManual,
      }
    : null;

  const captureGps = useCallback(async () => {
    setCapturingGps(true);
    setSubmitError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setSubmitError('Location permission is required to capture GPS coordinates.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      updateField('latitude', position.coords.latitude.toFixed(6));
      updateField('longitude', position.coords.longitude.toFixed(6));
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, 'Failed to capture GPS location.'));
    } finally {
      setCapturingGps(false);
    }
  }, [updateField]);

  const submit = useCallback(async (): Promise<boolean> => {
    if (!form) {
      return false;
    }

    if (!form.name.trim()) {
      setFieldErrors({ name: 'Farm name is required.' });
      return false;
    }

    setSubmitting(true);
    setSubmitError(null);
    setFieldErrors({});

    try {
      const latitude = form.latitude.trim() ? Number(form.latitude) : undefined;
      const longitude = form.longitude.trim() ? Number(form.longitude) : undefined;

      await updateFarmerFarm(farmId, {
        name: form.name.trim(),
        ...(form.area.trim() ? { area: Number(form.area), area_unit: mapFarmAreaUnitToApi(form.areaUnit) } : {}),
        crop_type: form.cropType.trim() || undefined,
        soil_type: form.soilType.trim() || undefined,
        village: form.village.trim() || undefined,
        taluka: form.taluka.trim() || undefined,
        district: form.district.trim() || undefined,
        state: form.state.trim() || undefined,
        pincode: form.pincode.trim() || undefined,
        address: form.address.trim() || undefined,
        latitude,
        longitude,
        notes: form.notes.trim() || undefined,
      });

      return true;
    } catch (err) {
      const apiFieldErrors = extractFieldErrors(err);
      if (Object.keys(apiFieldErrors).length > 0) {
        setFieldErrors(apiFieldErrors);
      }
      setSubmitError(getApiErrorMessage(err, 'Failed to update farm.'));
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [farmId, form]);

  return {
    form,
    addressValue,
    fieldErrors,
    submitError,
    loadError,
    loading,
    submitting,
    capturingGps,
    updateField,
    updateAddress,
    captureGps,
    submit,
    reload: load,
  };
}
