import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getApiErrorMessage } from '../api/authApi';
import { createOfficerInventoryUtilization, getBiocharInventoryOptions, getFieldOfficerProfile } from '../api/fieldOfficerApi';
import type { InventoryUtilizationType } from '../constants/inventoryUtilization';
import { buildFormDataFilePart, liveEvidenceCameraOptions } from '../utils/liveEvidenceCapture';
import { extractList, pickString, type ApiRecord } from '../utils/apiHelpers';
import { captureHighAccuracyGps } from '../utils/officerGpsCapture';
import { mapBatchInventoryOption, mapDestinationOptions, type BatchInventoryOption, type DestinationFarmOption } from '../utils/inventoryMovementHelpers';

export function useInventoryUtilizationForm({
  farmerId,
  farmId: initialFarmId,
}: {
  farmerId?: number;
  farmId?: number;
} = {}) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [farmIdInput, setFarmIdInput] = useState(initialFarmId ? String(initialFarmId) : '');
  const [activeFarmId, setActiveFarmId] = useState<number | null>(initialFarmId ?? null);
  const [batches, setBatches] = useState<BatchInventoryOption[]>([]);
  const [destinations, setDestinations] = useState<DestinationFarmOption[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [selectedDestinationIndex, setSelectedDestinationIndex] = useState(0);
  const [transactionType, setTransactionType] = useState<InventoryUtilizationType>('applied_to_farm');
  const [activityDate, setActivityDate] = useState(new Date().toISOString().slice(0, 10));
  const [quantity, setQuantity] = useState('');
  const [storageLocation, setStorageLocation] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerMobile, setBuyerMobile] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [wasteReason, setWasteReason] = useState('');
  const [disposalMethod, setDisposalMethod] = useState('');
  const [cropName, setCropName] = useState('');
  const [areaApplied, setAreaApplied] = useState('');
  const [areaUnit, setAreaUnit] = useState('acre');
  const [notes, setNotes] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracyM, setAccuracyM] = useState<number | null>(null);
  const [applicationImageUri, setApplicationImageUri] = useState<string | null>(null);
  const [wasteImageUri, setWasteImageUri] = useState<string | null>(null);
  const [invoiceImageUri, setInvoiceImageUri] = useState<string | null>(null);
  const [submittedBalance, setSubmittedBalance] = useState<number | null>(null);
  const [movementHistory, setMovementHistory] = useState<ApiRecord[]>([]);

  const selectedBatch = useMemo(
    () => batches.find((batch) => batch.id === selectedBatchId) ?? null,
    [batches, selectedBatchId],
  );
  const destination = destinations[selectedDestinationIndex] ?? null;
  const availableKg = submittedBalance ?? selectedBatch?.inventory.availableKg ?? 0;
  const quantityValue = Number(quantity) || 0;
  const deductsStock = transactionType === 'applied_to_farm' || transactionType === 'sold' || transactionType === 'wasted';
  const remainingKg = deductsStock ? Math.max(0, availableKg - quantityValue) : availableKg;
  const quantityError =
    deductsStock && quantityValue > availableKg
      ? `Quantity cannot exceed available stock (${availableKg} kg).`
      : quantityValue <= 0
        ? 'Quantity must be greater than zero.'
        : null;

  const loadBatchesForFarm = useCallback(async (farmId: number) => {
    setLoading(true);
    setError(null);
    setSubmittedBalance(null);
    try {
      await getFieldOfficerProfile();
      const options = (await getBiocharInventoryOptions({
        farm_id: farmId,
        farmer_id: farmerId,
      })) as ApiRecord;
      const mappedBatches = extractList(options, ['batches']).map(mapBatchInventoryOption);
      setBatches(mappedBatches);
      setSelectedBatchId(mappedBatches[0]?.id ?? null);
      setMovementHistory(
        extractList(options, ['batches']).flatMap((batch) => {
          const history = Array.isArray(batch.inventory_movements)
            ? (batch.inventory_movements as ApiRecord[])
            : Array.isArray(batch.movements)
              ? (batch.movements as ApiRecord[])
              : [];
          return history.map((item) => ({
            ...item,
            batch_id: batch.id,
            batch_code: pickString(batch, 'batch_code'),
          }));
        }),
      );
      const mappedDestinations = mapDestinationOptions(extractList(options, ['farmers']));
      setDestinations(mappedDestinations);
      if (farmerId) {
        const index = mappedDestinations.findIndex((item) => item.farmerId === farmerId || item.farmId === farmId);
        if (index >= 0) {
          setSelectedDestinationIndex(index);
        }
      } else {
        const index = mappedDestinations.findIndex((item) => item.farmId === farmId);
        if (index >= 0) {
          setSelectedDestinationIndex(index);
        }
      }
      setActiveFarmId(farmId);
    } catch (err) {
      setBatches([]);
      setSelectedBatchId(null);
      setError(getApiErrorMessage(err, 'Failed to load inventory batches for this Farm ID.'));
    } finally {
      setLoading(false);
    }
  }, [farmerId]);

  useEffect(() => {
    if (initialFarmId) {
      void loadBatchesForFarm(initialFarmId);
    }
  }, [initialFarmId, loadBatchesForFarm]);

  const searchByFarmId = async () => {
    const farmId = Number(farmIdInput);
    if (!Number.isFinite(farmId) || farmId <= 0) {
      setError('Enter a valid Farm ID.');
      return;
    }
    await loadBatchesForFarm(farmId);
  };

  const captureGps = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      setError('Location permission is required.');
      return;
    }
    const position = await captureHighAccuracyGps({ timeoutMs: 20000 });
    setLatitude(position.latitude);
    setLongitude(position.longitude);
    setAccuracyM(position.accuracyM);
  };

  const captureImage = async (setter: (uri: string) => void) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Camera permission is required.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync(
      liveEvidenceCameraOptions({
        quality: 0.85,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      }),
    );
    if (!result.canceled && result.assets[0]) {
      setter(result.assets[0].uri);
    }
  };

  const buildPayload = (): FormData => {
    if (!selectedBatch) {
      throw new Error('Select a batch.');
    }
    const formData = new FormData();
    formData.append('batch_id', String(selectedBatch.id));
    formData.append('transaction_type', transactionType);
    formData.append('quantity', String(quantityValue));
    formData.append('quantity_unit', 'kg');
    formData.append('activity_date', activityDate);
    formData.append('idempotency_key', `${selectedBatch.id}-${transactionType}-${quantityValue}-${activityDate}`);
    if (destination?.farmId) {
      formData.append('farm_id', String(destination.farmId));
    } else if (activeFarmId) {
      formData.append('farm_id', String(activeFarmId));
    }
    if (storageLocation.trim()) {
      formData.append('storage_location', storageLocation.trim());
    }
    if (buyerName.trim()) {
      formData.append('buyer_name', buyerName.trim());
    }
    if (buyerMobile.trim()) {
      formData.append('buyer_mobile', buyerMobile.trim());
    }
    if (sellingPrice.trim()) {
      formData.append('selling_price', sellingPrice.trim());
    }
    if (invoiceNumber.trim()) {
      formData.append('invoice_number', invoiceNumber.trim());
    }
    if (wasteReason.trim()) {
      formData.append('waste_reason', wasteReason.trim());
    }
    if (disposalMethod.trim()) {
      formData.append('disposal_method', disposalMethod.trim());
    }
    if (cropName.trim()) {
      formData.append('crop_name', cropName.trim());
    }
    if (areaApplied.trim()) {
      formData.append('area_applied', areaApplied.trim());
      formData.append('area_unit', areaUnit);
    }
    if (notes.trim()) {
      formData.append('notes', notes.trim());
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
    if (applicationImageUri) {
      formData.append('application_image', buildFormDataFilePart(applicationImageUri, 'application.jpg', 'image/jpeg') as unknown as Blob);
    }
    if (wasteImageUri) {
      formData.append('waste_image', buildFormDataFilePart(wasteImageUri, 'waste.jpg', 'image/jpeg') as unknown as Blob);
    }
    if (invoiceImageUri) {
      formData.append('invoice_image', buildFormDataFilePart(invoiceImageUri, 'invoice.jpg', 'image/jpeg') as unknown as Blob);
    }
    return formData;
  };

  const submit = async (): Promise<boolean> => {
    if (submitting) {
      return false;
    }
    if (quantityError) {
      setError(quantityError);
      return false;
    }
    if (transactionType === 'applied_to_farm' && !applicationImageUri) {
      setError('Application image is required.');
      return false;
    }
    if (transactionType === 'wasted' && !wasteImageUri) {
      setError('Waste image is required.');
      return false;
    }
    if (transactionType === 'sold' && (!buyerName.trim() || !/^[6-9][0-9]{9}$/.test(buyerMobile.trim()))) {
      setError('Buyer name and valid mobile number are required.');
      return false;
    }
    if (transactionType === 'kept_in_stock' && !storageLocation.trim()) {
      setError('Storage location is required.');
      return false;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await createOfficerInventoryUtilization(buildPayload());
      const movement = (response.movement ?? response) as ApiRecord;
      const inventory = (movement.inventory ?? movement.batch) as ApiRecord;
      const nextBalance = Number(inventory.available_kg ?? inventory.availableKg ?? remainingKg);
      setSubmittedBalance(Number.isFinite(nextBalance) ? nextBalance : remainingKg);
      setMovementHistory((current) => [movement, ...current]);
      if (activeFarmId) {
        await loadBatchesForFarm(activeFarmId);
      }
      return true;
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to record utilization.'));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    loading,
    submitting,
    error,
    farmIdInput,
    setFarmIdInput,
    activeFarmId,
    searchByFarmId,
    batches,
    destinations,
    selectedBatchId,
    setSelectedBatchId,
    selectedDestinationIndex,
    setSelectedDestinationIndex,
    transactionType,
    setTransactionType,
    activityDate,
    setActivityDate,
    quantity,
    setQuantity,
    storageLocation,
    setStorageLocation,
    buyerName,
    setBuyerName,
    buyerMobile,
    setBuyerMobile,
    sellingPrice,
    setSellingPrice,
    invoiceNumber,
    setInvoiceNumber,
    wasteReason,
    setWasteReason,
    disposalMethod,
    setDisposalMethod,
    cropName,
    setCropName,
    areaApplied,
    setAreaApplied,
    areaUnit,
    setAreaUnit,
    notes,
    setNotes,
    latitude,
    longitude,
    accuracyM,
    applicationImageUri,
    wasteImageUri,
    invoiceImageUri,
    selectedBatch,
    destination,
    availableKg,
    remainingKg,
    quantityError,
    movementHistory,
    reload: activeFarmId ? () => loadBatchesForFarm(activeFarmId) : async () => undefined,
    captureGps,
    captureApplicationImage: () => captureImage(setApplicationImageUri),
    captureWasteImage: () => captureImage(setWasteImageUri),
    captureInvoiceImage: () => captureImage(setInvoiceImageUri),
    submit,
  };
}
