import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { FarmAddressFields } from '../../components/farmer/farms/FarmAddressFields';
import { FarmAreaUnitPicker } from '../../components/farmer/farms/FarmAreaUnitPicker';
import { FarmFormField } from '../../components/farmer/farms/FarmFormField';
import { FarmSuccessModal } from '../../components/farmer/farms/FarmSuccessModal';
import { FarmerAddFarmHeader } from '../../components/farmer/farms/FarmerAddFarmHeader';
import { SubmitActivityCard } from '../../components/farmer/SubmitActivityCard';
import { BhuguardMaterialIcon } from '../../components/shared/BhuguardMaterialIcon';
import { useAddFarmerFarmForm } from '../../hooks/useAddFarmerFarmForm';
import type { FarmerStackParamList } from '../../navigation/types';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmerAddFarm'>;

export function FarmerAddFarmScreen({ navigation }: Props) {
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

  const handleSubmit = async () => {
    const ok = await submit();

    if (ok) {
      setSuccessVisible(true);
    }
  };

  const handleSuccessClose = () => {
    setSuccessVisible(false);
    navigation.navigate('FarmerTabs', { screen: 'Farms' });
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
            errors={{
              district: fieldErrors.district,
              taluka: fieldErrors.taluka,
              village: fieldErrors.village,
              state: fieldErrors.state,
            }}
            onChange={updateAddress}
          />

          <FarmFormField
            label="Pincode"
            value={form.pincode}
            onChangeText={(value) => updateField('pincode', value)}
            placeholder="382110"
            keyboardType="number-pad"
            error={fieldErrors.pincode}
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
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>{submitting ? 'Saving Farm…' : 'Add Farm'}</Text>
        </Pressable>
      </ScrollView>

      <FarmSuccessModal visible={successVisible} onClose={handleSuccessClose} />
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
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});
