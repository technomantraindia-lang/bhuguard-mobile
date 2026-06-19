import { useCallback, useState } from 'react';
import axios from 'axios';
import * as Location from 'expo-location';

import { getApiErrorMessage } from '../api/authApi';
import { createFarmerFarm } from '../api/farmerApi';
import {
  DEFAULT_FARM_AREA_UNIT,
  mapFarmAreaUnitToApi,
  type FarmerFarmAreaUnit,
} from '../constants/farmerFarmAreaUnits';
import { pickString, type ApiRecord } from '../utils/apiHelpers';

export type AddFarmFieldKey =
  | 'name'
  | 'area'
  | 'areaUnit'
  | 'cropType'
  | 'soilType'
  | 'village'
  | 'taluka'
  | 'district'
  | 'state'
  | 'pincode'
  | 'address'
  | 'latitude'
  | 'longitude'
  | 'notes';

export interface FarmAddressValue {
  state: string;
  districtId: string;
  district: string;
  talukaId: string;
  taluka: string;
  villageId: string;
  village: string;
  villageManual: boolean;
}

export interface AddFarmerFarmFormState {
  name: string;
  area: string;
  areaUnit: FarmerFarmAreaUnit;
  cropType: string;
  soilType: string;
  state: string;
  districtId: string;
  district: string;
  talukaId: string;
  taluka: string;
  villageId: string;
  village: string;
  villageManual: boolean;
  pincode: string;
  address: string;
  latitude: string;
  longitude: string;
  notes: string;
}

const INITIAL_FORM: AddFarmerFarmFormState = {
  name: '',
  area: '',
  areaUnit: DEFAULT_FARM_AREA_UNIT,
  cropType: '',
  soilType: '',
  state: 'Gujarat',
  districtId: '',
  district: '',
  talukaId: '',
  taluka: '',
  villageId: '',
  village: '',
  villageManual: false,
  pincode: '',
  address: '',
  latitude: '',
  longitude: '',
  notes: '',
};

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
    land_area_unit: 'areaUnit',
    area_unit: 'areaUnit',
    crop_type: 'cropType',
    soil_type: 'soilType',
    village: 'village',
    taluka: 'taluka',
    district: 'district',
    state: 'state',
    pincode: 'pincode',
    address: 'address',
    latitude: 'latitude',
    longitude: 'longitude',
    gps_latitude: 'latitude',
    gps_longitude: 'longitude',
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

function validateForm(form: AddFarmerFarmFormState): Partial<Record<AddFarmFieldKey, string>> {
  const errors: Partial<Record<AddFarmFieldKey, string>> = {};

  if (!form.name.trim()) {
    errors.name = 'Farm or plot name is required.';
  }

  const areaValue = Number(form.area);

  if (!form.area.trim() || !Number.isFinite(areaValue) || areaValue <= 0) {
    errors.area = 'Enter a valid farm area greater than 0.';
  }

  if (!form.district.trim()) {
    errors.district = 'Please select a district.';
  }

  if (!form.taluka.trim()) {
    errors.taluka = 'Please select a taluka.';
  }

  if (form.taluka.trim() && !/^\d{6}$/.test(form.pincode.trim())) {
    errors.pincode = 'Pincode is filled automatically when you select taluka.';
  }

  if (!form.village.trim()) {
    errors.village = 'Please select or type your village name.';
  }

  if (!form.state.trim()) {
    errors.state = 'State is required.';
  }

  if (form.latitude.trim()) {
    const latitude = Number(form.latitude);

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      errors.latitude = 'Enter a valid latitude.';
    }
  }

  if (form.longitude.trim()) {
    const longitude = Number(form.longitude);

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      errors.longitude = 'Enter a valid longitude.';
    }
  }

  return errors;
}

export function useAddFarmerFarmForm() {
  const [form, setForm] = useState<AddFarmerFarmFormState>(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<AddFarmFieldKey, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [capturingGps, setCapturingGps] = useState(false);

  const clearFieldError = useCallback((key: AddFarmFieldKey) => {
    setFieldErrors((current) => {
      if (!(key in current)) {
        return current;
      }

      const next = { ...current };
      delete next[key];

      return next;
    });
  }, []);

  const updateField = useCallback(<K extends keyof AddFarmerFarmFormState>(key: K, value: AddFarmerFarmFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    clearFieldError(key as AddFarmFieldKey);
    setSubmitError(null);
  }, [clearFieldError]);

  const updateAddress = useCallback((patch: Partial<FarmAddressValue & { pincode?: string }>) => {
    setForm((current) => ({ ...current, ...patch }));
    (['state', 'district', 'taluka', 'village', 'pincode'] as AddFarmFieldKey[]).forEach((key) => {
      if (key in patch) {
        clearFieldError(key);
      }
    });
    setSubmitError(null);
  }, [clearFieldError]);

  const addressValue: FarmAddressValue = {
    state: form.state,
    districtId: form.districtId,
    district: form.district,
    talukaId: form.talukaId,
    taluka: form.taluka,
    villageId: form.villageId,
    village: form.village,
    villageManual: form.villageManual,
  };

  const captureGps = useCallback(async () => {
    setCapturingGps(true);
    setSubmitError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        setSubmitError('Location permission is required to capture GPS coordinates.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      updateField('latitude', position.coords.latitude.toFixed(6));
      updateField('longitude', position.coords.longitude.toFixed(6));
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, 'Failed to capture GPS location.'));
    } finally {
      setCapturingGps(false);
    }
  }, [updateField]);

  const submit = useCallback(async (): Promise<number | false> => {
    const validationErrors = validateForm(form);
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return false;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const latitude = form.latitude.trim() ? Number(form.latitude) : undefined;
      const longitude = form.longitude.trim() ? Number(form.longitude) : undefined;

      const result = (await createFarmerFarm({
        name: form.name.trim(),
        area: Number(form.area),
        area_unit: mapFarmAreaUnitToApi(form.areaUnit),
        crop_type: form.cropType.trim() || undefined,
        soil_type: form.soilType.trim() || undefined,
        village: form.village.trim(),
        taluka: form.taluka.trim(),
        district: form.district.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        address: form.address.trim() || undefined,
        latitude,
        longitude,
        notes: form.notes.trim() || undefined,
      })) as ApiRecord;

      const farm = (result.farm ?? result) as ApiRecord;
      const farmId = Number(farm.id);

      return Number.isFinite(farmId) ? farmId : false;
    } catch (err) {
      const apiFieldErrors = extractFieldErrors(err);

      if (Object.keys(apiFieldErrors).length > 0) {
        setFieldErrors((current) => ({ ...current, ...apiFieldErrors }));
      }

      setSubmitError(getApiErrorMessage(err, 'Failed to add farm. Please try again.'));
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [form]);

  return {
    form,
    addressValue,
    fieldErrors,
    submitError,
    submitting,
    capturingGps,
    updateField,
    updateAddress,
    captureGps,
    submit,
  };
}
