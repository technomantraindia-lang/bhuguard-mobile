import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getApiErrorMessage } from '../api/authApi';
import {
  createOfficerInventoryMovement,
  getBiocharInventoryOptions,
  getFieldOfficerProfile,
} from '../api/fieldOfficerApi';
import type {
  InventoryEvidenceKey,
  InventoryMovementStatus,
  InventoryMovementType,
} from '../constants/inventoryMovement';
import { buildFormDataFilePart } from '../utils/liveEvidenceCapture';
import { extractList, pickString, type ApiRecord } from '../utils/apiHelpers';
import {
  calculateDistanceInMeters,
  DEFAULT_ALLOWED_RADIUS_METERS,
  MAX_ALLOWED_ACCURACY_METERS,
} from '../utils/locationUtils';
import { captureHighAccuracyGps } from '../utils/officerGpsCapture';
import { buildReceiverSignatureFormPart } from '../utils/uploadChecklistSignature';
import {
  mapBatchInventoryOption,
  mapDestinationOptions,
  mapStorageLocation,
  type BatchInventoryOption,
  type DestinationFarmOption,
  type StorageLocationOption,
} from '../utils/inventoryMovementHelpers';

export interface InventoryEvidenceAsset {
  uri: string;
  name: string;
  type: string;
}

interface UseInventoryMovementFormOptions {
  farmerId?: number;
}

export function useInventoryMovementForm({ farmerId }: UseInventoryMovementFormOptions = {}) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [officerName, setOfficerName] = useState('Field Officer');
  const [movementCode, setMovementCode] = useState('INV-2026-00045');

  const [batches, setBatches] = useState<BatchInventoryOption[]>([]);
  const [storageLocations, setStorageLocations] = useState<StorageLocationOption[]>([]);
  const [destinations, setDestinations] = useState<DestinationFarmOption[]>([]);
  const [transportMethods, setTransportMethods] = useState<Array<{ value: string; label: string }>>([]);

  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [selectedStorageKey, setSelectedStorageKey] = useState<string>('central_warehouse');
  const [movementType, setMovementType] = useState<InventoryMovementType>('storage_to_farm');
  const [selectedDestinationIndex, setSelectedDestinationIndex] = useState(0);
  const [movementDate, setMovementDate] = useState(new Date().toISOString().slice(0, 10));
  const [quantityMoved, setQuantityMoved] = useState('150');
  const [quantityUnit, setQuantityUnit] = useState('kg');
  const [transportMethod, setTransportMethod] = useState('tractor');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracyM, setAccuracyM] = useState<number | null>(null);
  const [gpsVerified, setGpsVerified] = useState(false);
  const [receiverName, setReceiverName] = useState('');
  const [receiverMobile, setReceiverMobile] = useState('');
  const [receiverConfirmed, setReceiverConfirmed] = useState(false);
  const [receiverSignature, setReceiverSignature] = useState<InventoryEvidenceAsset | null>(null);
  const [officerRemarks, setOfficerRemarks] = useState('');
  const [recordStatus, setRecordStatus] = useState<InventoryMovementStatus>('draft');
  const [evidence, setEvidence] = useState<Partial<Record<InventoryEvidenceKey, InventoryEvidenceAsset>>>({});

  const selectedBatch = useMemo(
    () => batches.find((batch) => batch.id === selectedBatchId) ?? batches[0] ?? null,
    [batches, selectedBatchId],
  );

  const selectedStorage = useMemo(
    () => storageLocations.find((location) => location.key === selectedStorageKey) ?? storageLocations[0] ?? null,
    [selectedStorageKey, storageLocations],
  );

  const destination = destinations[selectedDestinationIndex] ?? null;

  const quantityValue = Number(quantityMoved) || 0;
  const availableKg = selectedBatch?.inventory.availableKg ?? 0;
  const remainingKg = Math.max(0, availableKg - quantityValue);
  const quantityError =
    quantityValue > availableKg ? `Quantity cannot exceed available stock (${availableKg} Kg).` : null;

  const statusLabel = recordStatus === 'draft' ? 'Draft' : 'Submitted';

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [profileData, optionsData] = await Promise.all([
        getFieldOfficerProfile(),
        getBiocharInventoryOptions(),
      ]);

      const user = (profileData.user ?? profileData) as ApiRecord;
      const name = pickString(user, 'name');
      if (name !== '-') {
        setOfficerName(name);
      }

      const options = optionsData as ApiRecord;
      const nextCode = pickString(options, 'movement_code', 'movementCode');
      if (nextCode !== '-') {
        setMovementCode(nextCode);
      }

      const mappedBatches = extractList(options, ['batches']).map(mapBatchInventoryOption);
      setBatches(mappedBatches);
      if (mappedBatches[0]) {
        setSelectedBatchId(mappedBatches[0].id);
      }

      const mappedLocations = extractList(options, ['storage_locations']).map(mapStorageLocation);
      setStorageLocations(mappedLocations);
      if (mappedLocations[0]) {
        setSelectedStorageKey(mappedLocations[0].key);
      }

      const mappedDestinations = mapDestinationOptions(extractList(options, ['farmers']));
      setDestinations(mappedDestinations);

      if (farmerId) {
        const index = mappedDestinations.findIndex((item) => item.farmerId === farmerId);
        if (index >= 0) {
          setSelectedDestinationIndex(index);
        }
      }

      const methods = extractList(options, ['transport_methods']).map((method) => ({
        value: pickString(method, 'value'),
        label: pickString(method, 'label'),
      }));
      setTransportMethods(methods.filter((method) => method.value !== '-'));
      if (methods[0]?.value && methods[0].value !== '-') {
        setTransportMethod(methods[0].value);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load inventory movement form.'));
    } finally {
      setLoading(false);
    }
  }, [farmerId]);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  const captureGps = async () => {
    setError(null);
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      setError('Location permission is required for GPS verification.');
      return;
    }

    try {
      const position = await captureHighAccuracyGps();
      setLatitude(position.latitude);
      setLongitude(position.longitude);
      setAccuracyM(position.accuracyM);
      setGpsVerified(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to capture GPS location.'));
    }
  };

  const verifyLocation = () => {
    if (latitude == null || longitude == null) {
      setError('Capture GPS before verifying location.');
      setGpsVerified(false);
      return false;
    }

    if (accuracyM != null && accuracyM > MAX_ALLOWED_ACCURACY_METERS) {
      setError('GPS accuracy is low. Move to an open area and capture again.');
      setGpsVerified(false);
      return false;
    }

    const destinationLat = destination?.latitude;
    const destinationLng = destination?.longitude;

    if (destinationLat != null && destinationLng != null) {
      const distanceM = calculateDistanceInMeters(latitude, longitude, destinationLat, destinationLng);

      if (distanceM != null && distanceM > DEFAULT_ALLOWED_RADIUS_METERS) {
        setError(
          `You are ${Math.round(distanceM)}m from the destination farm. Move within ${DEFAULT_ALLOWED_RADIUS_METERS}m to verify.`,
        );
        setGpsVerified(false);
        return false;
      }
    }

    setError(null);
    setGpsVerified(true);
    return true;
  };

  const setReceiverSignatureFromUri = (uri: string) => {
    setReceiverSignature({
      uri,
      name: 'receiver-signature.png',
      type: 'image/png',
    });
  };

  const clearReceiverSignature = () => {
    setReceiverSignature(null);
  };

  const captureEvidence = async (key: InventoryEvidenceKey) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Camera permission is required to capture evidence.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      allowsEditing: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const asset = result.assets[0];
    setEvidence((current) => ({
      ...current,
      [key]: {
        uri: asset.uri,
        name: asset.fileName ?? `${key}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      },
    }));
  };

  const buildPayload = (status: InventoryMovementStatus): FormData => {
    if (!selectedBatch) {
      throw new Error('Select a batch before saving.');
    }

    const formData = new FormData();
    formData.append('batch_id', String(selectedBatch.id));
    formData.append('movement_type', movementType);
    formData.append('status', status);
    formData.append('storage_location', selectedStorage?.label ?? 'Central Warehouse');
    formData.append('storage_status', selectedBatch.storageStatus);
    formData.append('quantity', String(quantityValue));
    formData.append('quantity_unit', quantityUnit);
    formData.append('movement_date', movementDate);
    formData.append('from_location', selectedStorage?.label ?? 'Central Warehouse');
    formData.append('to_location', destination?.farmName ?? '');
    formData.append('transport_method', transportMethod);
    if (vehicleNumber.trim()) {
      formData.append('vehicle_number', vehicleNumber.trim());
    }
    if (driverName.trim()) {
      formData.append('driver_name', driverName.trim());
    }
    if (destination?.farmId) {
      formData.append('farm_id', String(destination.farmId));
    }
    if (destination?.plotId) {
      formData.append('plot_id', String(destination.plotId));
    }
    if (destination?.farmerName) {
      formData.append('receiver_farmer_name', destination.farmerName);
    }
    if (receiverName.trim()) {
      formData.append('receiver_name', receiverName.trim());
    }
    if (receiverMobile.trim()) {
      formData.append('receiver_mobile', receiverMobile.trim());
    }
    formData.append('receiver_quantity_confirmed', receiverConfirmed ? '1' : '0');
    if (officerRemarks.trim()) {
      formData.append('officer_remarks', officerRemarks.trim());
    }
    if (latitude != null) {
      formData.append('gps_latitude', String(latitude));
    }
    if (longitude != null) {
      formData.append('gps_longitude', String(longitude));
    }
    if (accuracyM != null) {
      formData.append('gps_accuracy', String(accuracyM));
    }

    if (receiverSignature) {
      formData.append(
        'receiver_signature',
        buildReceiverSignatureFormPart(receiverSignature.uri),
      );
    }

    const evidenceFieldMap: Record<InventoryEvidenceKey, string> = {
      stock_loading: 'stock_loading_photo',
      transport_vehicle: 'transport_vehicle_photo',
      delivery_location: 'delivery_location_photo',
      stock_receipt: 'stock_receipt_photo',
    };

    for (const [key, field] of Object.entries(evidenceFieldMap) as Array<[InventoryEvidenceKey, string]>) {
      const asset = evidence[key];
      if (asset) {
        formData.append(field, buildFormDataFilePart(asset.uri, asset.name, asset.type) as unknown as Blob);
      }
    }

    return formData;
  };

  const saveDraft = async (): Promise<boolean> => {
    setSubmitting(true);
    setError(null);

    try {
      setRecordStatus('draft');
      await createOfficerInventoryMovement(buildPayload('draft'));
      return true;
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to save inventory movement draft.'));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const submit = async (): Promise<string | null> => {
    if (quantityError) {
      setError(quantityError);
      return null;
    }

    if (!receiverConfirmed) {
      setError('Receiver must confirm the quantity before submitting.');
      return null;
    }

    if (!gpsVerified) {
      setError('GPS location must be captured and verified before submitting.');
      return null;
    }

    if (!receiverSignature) {
      setError('Receiver signature is required before submitting.');
      return null;
    }

    setSubmitting(true);
    setError(null);

    try {
      setRecordStatus('submitted');
      const response = await createOfficerInventoryMovement(buildPayload('submitted'));
      const movement = (response.movement ?? response) as ApiRecord;
      return pickString(movement, 'movement_code', 'movementCode');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to submit inventory movement.'));
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    loading,
    submitting,
    error,
    officerName,
    movementCode,
    statusLabel,
    batches,
    storageLocations,
    destinations,
    transportMethods,
    selectedBatchId,
    setSelectedBatchId,
    selectedStorageKey,
    setSelectedStorageKey,
    movementType,
    setMovementType,
    selectedDestinationIndex,
    setSelectedDestinationIndex,
    movementDate,
    setMovementDate,
    quantityMoved,
    setQuantityMoved,
    quantityUnit,
    setQuantityUnit,
    transportMethod,
    setTransportMethod,
    vehicleNumber,
    setVehicleNumber,
    driverName,
    setDriverName,
    latitude,
    longitude,
    accuracyM,
    gpsVerified,
    receiverName,
    setReceiverName,
    receiverMobile,
    setReceiverMobile,
    receiverConfirmed,
    setReceiverConfirmed,
    officerRemarks,
    setOfficerRemarks,
    recordStatus,
    setRecordStatus,
    evidence,
    selectedBatch,
    selectedStorage,
    destination,
    availableKg,
    remainingKg,
    quantityError,
    reload: loadInitialData,
    captureGps,
    verifyLocation,
    captureEvidence,
    receiverSignature,
    setReceiverSignatureFromUri,
    clearReceiverSignature,
    saveDraft,
    submit,
  };
}
