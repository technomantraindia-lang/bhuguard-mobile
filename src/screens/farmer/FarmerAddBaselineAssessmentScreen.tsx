import { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';

import { FarmerAddFarmHeader } from '../../components/farmer/farms/FarmerAddFarmHeader';
import { FarmFormField } from '../../components/farmer/farms/FarmFormField';
import { SubmitActivityCard } from '../../components/farmer/SubmitActivityCard';
import { BhuguardMaterialIcon } from '../../components/shared/BhuguardMaterialIcon';
import { BASELINE_YIELD_UNITS } from '../../constants/baselineAssessmentUnits';
import { useAddBaselineAssessmentForm } from '../../hooks/useAddBaselineAssessmentForm';
import type { FarmerStackParamList } from '../../navigation/types';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import { formatActivityDisplayDate } from '../../utils/activityDateHelpers';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmerAddBaselineAssessment'>;

export function FarmerAddBaselineAssessmentScreen({ navigation, route }: Props) {
  const { farmId } = route.params ?? {};
  const form = useAddBaselineAssessmentForm({ initialFarmId: farmId });
  const [farmPickerOpen, setFarmPickerOpen] = useState(false);
  const [unitPickerOpen, setUnitPickerOpen] = useState(false);

  const selectedUnitLabel =
    BASELINE_YIELD_UNITS.find((option) => option.value === form.yieldUnit)?.label ?? form.yieldUnit;

  const handleSubmit = async () => {
    const success = await form.submit();

    if (success) {
      Alert.alert('Baseline saved', 'Before-project baseline assessment submitted successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FarmerAddFarmHeader
        title="Baseline Assessment"
        subtitle="Before project soil and farm inputs"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SubmitActivityCard title="Regenerative Agriculture">
          <Text style={styles.phaseLabel}>Before Project</Text>
          <Text style={styles.phaseCopy}>
            Record your farm condition before joining the carbon project. This baseline is used for weekly
            MRV comparison.
          </Text>
        </SubmitActivityCard>

        <SubmitActivityCard>
          <Text style={styles.fieldLabel}>Select Farm</Text>
          <Pressable
            style={styles.selectorTrigger}
            onPress={() => setFarmPickerOpen(true)}
            disabled={form.farmsLoading}
          >
            <View style={styles.selectorCopy}>
              <Text style={styles.selectorTitle}>
                {form.selectedFarm?.name ?? (form.farmsLoading ? 'Loading farms...' : 'Choose a farm')}
              </Text>
              <Text style={styles.selectorSubtitle}>
                {form.selectedFarm?.subtitle ?? 'Land registered with GPS mapping'}
              </Text>
            </View>
            <ChevronDownIcon />
          </Pressable>
        </SubmitActivityCard>

        <SubmitActivityCard title="Soil & Yield (Before Project)">
          <FarmFormField
            label="Soil Organic Carbon (%)"
            value={form.soilOrganicCarbon}
            onChangeText={form.setSoilOrganicCarbon}
            placeholder="e.g. 1.25"
            keyboardType="decimal-pad"
          />
          <FarmFormField
            label="Soil pH"
            value={form.soilPh}
            onChangeText={form.setSoilPh}
            placeholder="e.g. 6.8"
            keyboardType="decimal-pad"
          />
          <FarmFormField
            label="Yield"
            value={form.yieldValue}
            onChangeText={form.setYieldValue}
            placeholder="e.g. 3.5"
            keyboardType="decimal-pad"
          />
          <Text style={styles.fieldLabel}>Yield Unit</Text>
          <Pressable style={styles.selectorTrigger} onPress={() => setUnitPickerOpen(true)}>
            <Text style={styles.selectorTitle}>{selectedUnitLabel}</Text>
            <ChevronDownIcon />
          </Pressable>
        </SubmitActivityCard>

        <SubmitActivityCard title="Farm Inputs (Before Project)">
          <FarmFormField
            label="Fertilizer Use"
            value={form.fertilizerUse}
            onChangeText={form.setFertilizerUse}
            placeholder="e.g. Urea 50 kg, DAP 25 kg"
            multiline
          />
          <FarmFormField
            label="Water Use"
            value={form.waterUse}
            onChangeText={form.setWaterUse}
            placeholder="e.g. Drip irrigation 2 hours daily"
            multiline
          />
          <FarmFormField
            label="Assessment Date"
            value={formatActivityDisplayDate(form.assessmentDate)}
            editable={false}
          />
        </SubmitActivityCard>

        {form.error ? <Text style={styles.error}>{form.error}</Text> : null}

        <Pressable
          style={({ pressed }) => [styles.submitButton, dashboardShadow, pressed && styles.pressed, form.submitting && styles.disabled]}
          onPress={() => void handleSubmit()}
          disabled={form.submitting}
        >
          <Text style={styles.submitButtonText}>{form.submitting ? 'Submitting...' : 'Submit Baseline'}</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={farmPickerOpen} animationType="slide" transparent onRequestClose={() => setFarmPickerOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Select Farm</Text>
            <FlatList
              data={form.farms}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    form.setSelectedFarmId(item.id);
                    setFarmPickerOpen(false);
                  }}
                >
                  <Text style={styles.optionTitle}>{item.name}</Text>
                  <Text style={styles.optionSubtitle}>{item.subtitle}</Text>
                </Pressable>
              )}
            />
            <Pressable style={styles.closeBtn} onPress={() => setFarmPickerOpen(false)}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={unitPickerOpen} animationType="slide" transparent onRequestClose={() => setUnitPickerOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Yield Unit</Text>
            {BASELINE_YIELD_UNITS.map((option) => (
              <Pressable
                key={option.value}
                style={styles.option}
                onPress={() => {
                  form.setYieldUnit(option.value);
                  setUnitPickerOpen(false);
                }}
              >
                <Text style={styles.optionTitle}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ChevronDownIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={dashboardTheme.outline} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dashboardTheme.background },
  content: { padding: dashboardTheme.marginMobile, gap: 14, paddingBottom: 40 },
  phaseLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: dashboardTheme.primaryContainer,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  phaseCopy: {
    fontSize: 13,
    lineHeight: 18,
    color: dashboardTheme.onSurfaceVariant,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: dashboardTheme.onSurfaceVariant,
    marginBottom: 8,
  },
  selectorTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: dashboardTheme.background,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  selectorCopy: { flex: 1, gap: 2 },
  selectorTitle: { fontSize: 16, fontWeight: '600', color: dashboardTheme.onSurface },
  selectorSubtitle: { fontSize: 12, color: dashboardTheme.onSurfaceVariant },
  error: { color: dashboardTheme.error, fontSize: 14 },
  submitButton: {
    backgroundColor: dashboardTheme.primaryContainer,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonText: { color: dashboardTheme.onPrimary, fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.92 },
  disabled: { opacity: 0.7 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
    padding: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: dashboardTheme.onSurface },
  option: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: dashboardTheme.outlineVariant,
  },
  optionTitle: { fontSize: 16, color: dashboardTheme.onSurface },
  optionSubtitle: { fontSize: 12, color: dashboardTheme.onSurfaceVariant, marginTop: 2 },
  closeBtn: { marginTop: 12, alignItems: 'center', padding: 12 },
  closeText: { color: dashboardTheme.primaryContainer, fontWeight: '700' },
});
