import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { LiveEvidenceCaptureCard } from '../../components/evidence/LiveEvidenceCaptureCard';
import { FarmFormField } from '../../components/farmer/farms/FarmFormField';
import { FarmerAddFarmHeader } from '../../components/farmer/farms/FarmerAddFarmHeader';
import { BhuguardMaterialIcon } from '../../components/shared/BhuguardMaterialIcon';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { useCreateWeeklyUpdateForm } from '../../hooks/useCreateWeeklyUpdateForm';
import type { FarmerStackParamList } from '../../navigation/types';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmerCreateWeeklyUpdate'>;

function OptionPicker({
  label,
  options,
  selectedId,
  onSelect,
}: {
  label: string;
  options: Array<{ id: number; label: string }>;
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.optionWrap}>
        {options.length === 0 ? (
          <Text style={styles.optionEmpty}>No options available</Text>
        ) : (
          options.map((option) => {
            const active = selectedId === option.id;

            return (
              <Pressable
                key={option.id}
                style={[styles.optionChip, active && styles.optionChipActive]}
                onPress={() => onSelect(option.id)}
              >
                <Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>{option.label}</Text>
              </Pressable>
            );
          })
        )}
      </View>
    </View>
  );
}

export function FarmerCreateWeeklyUpdateScreen({ navigation, route }: Props) {
  const initialFarmId = route.params?.farmId;
  const {
    form,
    farmOptions,
    serviceOptions,
    loadingOptions,
    optionsError,
    submitting,
    submitError,
    updateField,
    submit,
    reloadOptions,
    activityEvidence,
    activityEvidenceCapturing,
    activityEvidenceError,
    captureActivityPhoto,
    retakeActivityPhoto,
  } = useCreateWeeklyUpdateForm(initialFarmId);

  const handleSubmit = async () => {
    const result = await submit();

    if (result) {
      Alert.alert('Weekly update submitted', 'Your update and live activity photo were saved successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  };

  if (loadingOptions) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading farms and services…" />
      </SafeAreaView>
    );
  }

  if (optionsError) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message={optionsError} onRetry={() => void reloadOptions()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FarmerAddFarmHeader title="Create Weekly Update" subtitle="Submit your weekly farm progress" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <OptionPicker
          label="Farm *"
          options={farmOptions}
          selectedId={form.farmId}
          onSelect={(id) => updateField('farmId', id)}
        />
        <OptionPicker
          label="Service *"
          options={serviceOptions}
          selectedId={form.serviceId}
          onSelect={(id) => updateField('serviceId', id)}
        />

        <FarmFormField
          label="Update date *"
          value={form.updateDate}
          onChangeText={(value) => updateField('updateDate', value)}
          placeholder="YYYY-MM-DD"
        />
        <FarmFormField
          label="Week number"
          value={form.weekNumber}
          onChangeText={(value) => updateField('weekNumber', value)}
          keyboardType="number-pad"
        />
        <FarmFormField
          label="Crop / stage"
          value={form.cropOrStage}
          onChangeText={(value) => updateField('cropOrStage', value)}
        />
        <FarmFormField
          label="What activity did you do this week? *"
          value={form.activityDone}
          onChangeText={(value) => updateField('activityDone', value)}
          multiline
          placeholder="Example: Applied compost, irrigated wheat field..."
        />

        <View style={[styles.photoCard, dashboardShadow]}>
          <Text style={styles.photoCardTitle}>Live activity photo *</Text>
          <Text style={styles.photoCardHint}>
            Take a real-time camera photo at the farm. GPS location and date/time are stamped on the image.
          </Text>

          <LiveEvidenceCaptureCard
            evidence={activityEvidence}
            capturing={activityEvidenceCapturing}
            error={activityEvidenceError}
            onOpenCamera={() => void captureActivityPhoto()}
            onRetake={() => void retakeActivityPhoto()}
          />

          <View style={styles.infoBanner}>
            <BhuguardMaterialIcon name="science" size={16} color={dashboardTheme.primary} />
            <Text style={styles.infoBannerText}>
              Live location and timestamp are embedded on the photo before upload.
            </Text>
          </View>
        </View>

        <FarmFormField
          label="Inputs used"
          value={form.inputsUsed}
          onChangeText={(value) => updateField('inputsUsed', value)}
        />
        <FarmFormField
          label="Input quantity"
          value={form.inputQuantity}
          onChangeText={(value) => updateField('inputQuantity', value)}
          keyboardType="decimal-pad"
        />
        <FarmFormField label="Input unit" value={form.inputUnit} onChangeText={(value) => updateField('inputUnit', value)} />
        <FarmFormField label="Remarks" value={form.remarks} onChangeText={(value) => updateField('remarks', value)} multiline />

        {submitError ? <Text style={styles.error}>{submitError}</Text> : null}

        <Pressable
          style={({ pressed }) => [styles.submitButton, dashboardShadow, pressed && styles.pressed]}
          onPress={() => void handleSubmit()}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>{submitting ? 'Submitting…' : 'Submit Update'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dashboardTheme.background },
  content: { padding: dashboardTheme.marginMobile, gap: 14, paddingBottom: 32 },
  fieldBlock: { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: dashboardTheme.onSurface },
  optionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionEmpty: { fontSize: 14, color: dashboardTheme.onSurfaceVariant },
  optionChip: {
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: dashboardTheme.surfaceLowest,
  },
  optionChipActive: {
    backgroundColor: dashboardTheme.primaryContainer,
    borderColor: dashboardTheme.primaryContainer,
  },
  optionChipText: { fontSize: 13, color: dashboardTheme.onSurface },
  optionChipTextActive: { color: dashboardTheme.onPrimary, fontWeight: '600' },
  photoCard: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${dashboardTheme.outlineVariant}55`,
    padding: 14,
    gap: 12,
  },
  photoCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: dashboardTheme.onSurface,
  },
  photoCardHint: {
    fontSize: 13,
    lineHeight: 18,
    color: dashboardTheme.onSurfaceVariant,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: `${dashboardTheme.primaryContainer}18`,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: dashboardTheme.onSurfaceVariant,
    fontWeight: '500',
  },
  error: { color: dashboardTheme.error, fontSize: 14 },
  submitButton: {
    backgroundColor: dashboardTheme.primaryContainer,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: { fontSize: 16, fontWeight: '700', color: dashboardTheme.onPrimary },
  pressed: { opacity: 0.92 },
});
