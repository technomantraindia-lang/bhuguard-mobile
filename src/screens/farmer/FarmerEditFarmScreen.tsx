import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { FarmAddressFields } from '../../components/farmer/farms/FarmAddressFields';
import { FarmAreaUnitPicker } from '../../components/farmer/farms/FarmAreaUnitPicker';
import { FarmFormField } from '../../components/farmer/farms/FarmFormField';
import { FarmerAddFarmHeader } from '../../components/farmer/farms/FarmerAddFarmHeader';
import { SubmitActivityCard } from '../../components/farmer/SubmitActivityCard';
import { BhuguardMaterialIcon } from '../../components/shared/BhuguardMaterialIcon';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { useEditFarmerFarmForm } from '../../hooks/useEditFarmerFarmForm';
import type { FarmerStackParamList } from '../../navigation/types';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmerEditFarm'>;

export function FarmerEditFarmScreen({ navigation, route }: Props) {
  const { farmId } = route.params;
  const {
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
    reload,
  } = useEditFarmerFarmForm(farmId);

  if (!farmId) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message="Farm ID is missing." onRetry={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading farm…" />
      </SafeAreaView>
    );
  }

  if (loadError || !form || !addressValue) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message={loadError ?? 'Farm not found.'} onRetry={() => void reload()} />
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    const saved = await submit();

    if (saved) {
      Alert.alert('Farm updated', 'Your farm details were saved.', [
        { text: 'OK', onPress: () => navigation.navigate('FarmerFarmDetail', { farmId }) },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FarmerAddFarmHeader title="Edit Farm" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FarmFormField
          label="Farm Name"
          value={form.name}
          onChangeText={(value) => updateField('name', value)}
          error={fieldErrors.name}
        />

        <View style={styles.row}>
          <View style={styles.flex}>
            <FarmFormField
              label="Area"
              value={form.area}
              onChangeText={(value) => updateField('area', value)}
              keyboardType="decimal-pad"
              error={fieldErrors.area}
            />
          </View>
          <FarmAreaUnitPicker value={form.areaUnit} onChange={(unit) => updateField('areaUnit', unit)} />
        </View>

        <FarmFormField
          label="Crop type"
          value={form.cropType}
          onChangeText={(value) => updateField('cropType', value)}
        />
        <FarmFormField
          label="Soil type"
          value={form.soilType}
          onChangeText={(value) => updateField('soilType', value)}
        />

        <FarmAddressFields value={addressValue} pincode={form.pincode} onChange={updateAddress} />

        <FarmFormField
          label="Latitude"
          value={form.latitude}
          onChangeText={(value) => updateField('latitude', value)}
          keyboardType="decimal-pad"
        />
        <FarmFormField
          label="Longitude"
          value={form.longitude}
          onChangeText={(value) => updateField('longitude', value)}
          keyboardType="decimal-pad"
        />

        <SubmitActivityCard title="GPS location">
          <Pressable
            style={({ pressed }) => [styles.gpsButton, pressed && styles.pressed]}
            onPress={() => void captureGps()}
            disabled={capturingGps}
          >
            <BhuguardMaterialIcon name="location_on" size={20} color={dashboardTheme.primaryContainer} />
            <Text style={styles.gpsButtonText}>{capturingGps ? 'Capturing…' : 'Capture GPS'}</Text>
          </Pressable>
        </SubmitActivityCard>

        <FarmFormField
          label="Notes"
          value={form.notes}
          onChangeText={(value) => updateField('notes', value)}
          multiline
        />

        {submitError ? <Text style={styles.error}>{submitError}</Text> : null}

        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            dashboardShadow,
            (submitting || pressed) && styles.pressed,
          ]}
          onPress={() => void handleSave()}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>{submitting ? 'Saving…' : 'Save Farm'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dashboardTheme.background },
  content: { padding: dashboardTheme.marginMobile, gap: 14, paddingBottom: 32 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-end' },
  flex: { flex: 1 },
  error: { color: dashboardTheme.error, fontSize: 14 },
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
  submitButton: {
    backgroundColor: dashboardTheme.primaryContainer,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: dashboardTheme.onPrimary,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
});
