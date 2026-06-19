import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { FarmAddressFields } from '../../components/farmer/farms/FarmAddressFields';
import { FarmAreaUnitPicker } from '../../components/farmer/farms/FarmAreaUnitPicker';
import { FarmFormField } from '../../components/farmer/farms/FarmFormField';
import { FarmSuccessModal } from '../../components/farmer/farms/FarmSuccessModal';
import { saveFarmerFarmMapping } from '../../api/farmerApi';
import { FarmerAddFarmHeader } from '../../components/farmer/farms/FarmerAddFarmHeader';
import { SubmitActivityCard } from '../../components/farmer/SubmitActivityCard';
import { LandBoundaryVerificationSection } from '../../components/shared/LandBoundaryVerificationSection';
import { BhuguardMaterialIcon } from '../../components/shared/BhuguardMaterialIcon';
import { useBoundaryCapture } from '../../context/BoundaryCaptureContext';
import { useAddFarmerFarmForm } from '../../hooks/useAddFarmerFarmForm';
import type { FarmerStackParamList } from '../../navigation/types';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import { buildBoundaryUploadPayload, type AreaUnit } from '../../utils/boundaryGeometry';
import { mapFarmAreaUnitToApi } from '../../constants/farmerFarmAreaUnits';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmerAddFarm'>;

export function FarmerAddFarmScreen({ navigation }: Props) {
  const boundary = useBoundaryCapture();
  const {
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
  } = useAddFarmerFarmForm();
  const [successVisible, setSuccessVisible] = useState(false);
  const mapped = boundary.points.length >= 3;
  const mappingStatus = mapped ? 'mapped' : boundary.points.length > 0 ? 'draft' : 'not_mapped';

  const startPrefarmMapping = () => {
    if (!form.area.trim()) {
      return;
    }

    boundary.setSession({
      sessionMode: 'prefarm',
      farmId: null,
      farmName: form.name.trim() || 'New Farm',
      farmCode: 'Draft',
      declaredArea: form.area,
      declaredUnit: mapFarmAreaUnitToApi(form.areaUnit) as AreaUnit,
      unit: mapFarmAreaUnitToApi(form.areaUnit) as AreaUnit,
    });

    navigation.navigate('FarmBoundaryStart', { farmId: 0 });
  };

  const handleSubmit = async () => {
    const result = await submit();

    if (typeof result === 'number') {
      try {
        if (boundary.points.length >= 3) {
          const payload = {
            ...buildBoundaryUploadPayload(result, boundary.unit, boundary.points, boundary.gpsAccuracyLabel),
            declared_area: form.area,
            declared_unit: form.areaUnit,
            mapping_status: 'mapped',
            verification_status: 'pending_review',
          };
          await saveFarmerFarmMapping(result, payload);
        }
      } catch {
        // Farm created; mapping can be retried from farm detail.
      }

      setSuccessVisible(true);
    }
  };

  const handleSuccessClose = () => {
    setSuccessVisible(false);
    navigation.navigate('FarmerTabs', { screen: 'Farms' });
  };

  const handleCaptureBoundaryAfterSave = async () => {
    const result = await submit();

    if (typeof result === 'number') {
      navigation.navigate('CameraBoundaryStart', { farmId: result });
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FarmerAddFarmHeader onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SubmitActivityCard title="Farm Details">
          <FarmFormField
            label="Farm / Plot Name"
            value={form.name}
            onChangeText={(value) => updateField('name', value)}
            placeholder="Green Valley Farm"
            error={fieldErrors.name}
          />
          <FarmFormField
            label="Area"
            value={form.area}
            onChangeText={(value) => updateField('area', value)}
            placeholder="5.2"
            keyboardType="decimal-pad"
            error={fieldErrors.area}
          />
          <FarmAreaUnitPicker
            value={form.areaUnit}
            onChange={(value) => updateField('areaUnit', value)}
            error={fieldErrors.areaUnit}
          />
          <FarmFormField
            label="Crop Type"
            value={form.cropType}
            onChangeText={(value) => updateField('cropType', value)}
            placeholder="Wheat"
            error={fieldErrors.cropType}
          />
          <FarmFormField
            label="Soil Type"
            value={form.soilType}
            onChangeText={(value) => updateField('soilType', value)}
            placeholder="Black Soil"
            error={fieldErrors.soilType}
          />
        </SubmitActivityCard>

        <SubmitActivityCard title="Location">
          <FarmAddressFields
            value={addressValue}
            pincode={form.pincode}
            errors={{
              district: fieldErrors.district,
              taluka: fieldErrors.taluka,
              village: fieldErrors.village,
              state: fieldErrors.state,
              pincode: fieldErrors.pincode,
            }}
            onChange={updateAddress}
          />

          <FarmFormField
            label="Full Address"
            value={form.address}
            onChangeText={(value) => updateField('address', value)}
            placeholder="Full farm address"
            multiline
            error={fieldErrors.address}
          />
        </SubmitActivityCard>

        <LandBoundaryVerificationSection
          declaredArea={form.area}
          declaredUnit={form.areaUnit}
          village={form.village}
          taluka={form.taluka}
          district={form.district}
          state={form.state}
          mappingStatus={mappingStatus}
          mappedAreaLabel={mapped ? boundary.areaLabel : undefined}
          onStartMapping={startPrefarmMapping}
        />

        <SubmitActivityCard title="GPS Location">
          <FarmFormField
            label="Latitude"
            value={form.latitude}
            onChangeText={(value) => updateField('latitude', value)}
            placeholder="23.0225"
            keyboardType="decimal-pad"
            error={fieldErrors.latitude}
          />
          <FarmFormField
            label="Longitude"
            value={form.longitude}
            onChangeText={(value) => updateField('longitude', value)}
            placeholder="72.5714"
            keyboardType="decimal-pad"
            error={fieldErrors.longitude}
          />

          <Pressable
            style={({ pressed }) => [styles.gpsButton, dashboardShadow, pressed && styles.pressed]}
            onPress={() => void captureGps()}
            disabled={capturingGps}
          >
            <BhuguardMaterialIcon name="share_location" size={20} color={dashboardTheme.primaryContainer} />
            <Text style={styles.gpsButtonText}>{capturingGps ? 'Capturing GPS…' : 'Capture GPS Location'}</Text>
          </Pressable>
        </SubmitActivityCard>

        <SubmitActivityCard title="Additional Notes">
          <FarmFormField
            label="Notes / Description"
            value={form.notes}
            onChangeText={(value) => updateField('notes', value)}
            placeholder="Optional notes about this farm"
            multiline
            error={fieldErrors.notes}
          />
        </SubmitActivityCard>

        {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            dashboardShadow,
            (submitting || pressed) && styles.pressed,
            submitting && styles.submitButtonDisabled,
          ]}
          onPress={() => void handleSubmit()}
          disabled={submitting || !mapped}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Saving Farm…' : mapped ? 'Add Farm' : 'Map land boundary first'}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.cameraButton, dashboardShadow, (submitting || pressed) && styles.pressed]}
          onPress={() => void handleCaptureBoundaryAfterSave()}
          disabled={submitting}
        >
          <BhuguardMaterialIcon name="photo_camera" size={20} color={dashboardTheme.primaryContainer} />
          <Text style={styles.cameraButtonText}>Capture Boundary with Camera</Text>
        </Pressable>
      </ScrollView>

      <FarmSuccessModal
        visible={successVisible}
        message="Farm added successfully. You can now capture the farm boundary with camera."
        onClose={handleSuccessClose}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: dashboardTheme.background,
  },
  content: {
    paddingHorizontal: dashboardTheme.marginMobile,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: dashboardTheme.surfaceLow,
    borderRadius: 10,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: dashboardTheme.primaryContainer,
  },
  gpsButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: dashboardTheme.primaryContainer,
  },
  submitError: {
    fontSize: 14,
    lineHeight: 20,
    color: dashboardTheme.error,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: dashboardTheme.primaryContainer,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.75,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: dashboardTheme.onPrimary,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 12,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: dashboardTheme.primaryContainer,
  },
  cameraButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: dashboardTheme.primaryContainer,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});
