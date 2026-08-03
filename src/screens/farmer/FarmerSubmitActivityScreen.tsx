import { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';

import { FarmerSubmitActivityHeader } from '../../components/farmer/FarmerSubmitActivityHeader';
import { FarmerActivityTypePicker } from '../../components/farmer/activities/FarmerActivityTypePicker';
import { BiocharDmrvEngineCard } from '../../components/farmer/activities/BiocharDmrvEngineCard';
import { SubmitActivityCard } from '../../components/farmer/SubmitActivityCard';
import { LiveEvidenceCaptureCard } from '../../components/evidence/LiveEvidenceCaptureCard';
import { BhuguardMaterialIcon } from '../../components/shared/BhuguardMaterialIcon';
import { FARMER_ACTIVITY_UNITS } from '../../constants/farmerActivityUnits';
import { useSubmitActivityForm } from '../../hooks/useSubmitActivityForm';
import type { FarmerStackParamList } from '../../navigation/types';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import { formatActivityDisplayDate, isValidIsoDate, todayIsoDate } from '../../utils/activityDateHelpers';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmerSubmitActivity'>;

export function FarmerSubmitActivityScreen({ navigation, route }: Props) {
  const { farmId } = route.params ?? {};
  const form = useSubmitActivityForm({ initialFarmId: farmId });
  const [farmPickerOpen, setFarmPickerOpen] = useState(false);
  const [unitPickerOpen, setUnitPickerOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [dateInput, setDateInput] = useState(form.activityDate);

  const selectedUnitLabel =
    FARMER_ACTIVITY_UNITS.find((option) => option.value === form.unit)?.label ?? 'Kg';

  const handleSubmit = async () => {
    const success = await form.submitActivity();

    if (success) {
      Alert.alert('Activity submitted', 'Your farm activity has been logged successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  };

  const handleSaveDraft = async () => {
    const success = await form.saveDraft();

    if (success) {
      Alert.alert('Draft saved', 'You can continue this activity later.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  };

  const applyDate = () => {
    if (!isValidIsoDate(dateInput)) {
      form.setError('Enter a valid date in YYYY-MM-DD format.');
      return;
    }

    form.setActivityDate(dateInput);
    form.setError(null);
    setDatePickerOpen(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FarmerSubmitActivityHeader
        onBack={() => navigation.goBack()}
        onNotificationsPress={() => navigation.navigate('FarmerNotifications')}
        onProfilePress={() => navigation.navigate('FarmerProfile')}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
                {form.selectedFarm?.subtitle ?? 'Select where this activity happened'}
              </Text>
            </View>
            <ChevronDownIcon />
          </Pressable>
        </SubmitActivityCard>

        <SubmitActivityCard title="What activity did you do?">
          <FarmerActivityTypePicker value={form.activityType} onChange={form.setActivityType} />
          {form.activityType === 'biochar_application' ? (
            <BiocharDmrvEngineCard value={form.biocharDmrv} onChange={(patch) => form.setBiocharDmrv({ ...form.biocharDmrv, ...patch })} />
          ) : null}
          <View style={styles.timestampNote}>
            <BhuguardMaterialIcon name="schedule" size={16} color={dashboardTheme.onSurfaceVariant} />
            <Text style={styles.timestampNoteText}>
              Activity date is saved with your submission time stamp.
            </Text>
          </View>
        </SubmitActivityCard>

        <SubmitActivityCard>
          <Text style={styles.fieldLabel}>Activity Date</Text>
          <Pressable style={styles.dateField} onPress={() => {
            setDateInput(form.activityDate);
            setDatePickerOpen(true);
          }}>
            <BhuguardMaterialIcon name="event_note" size={20} color={dashboardTheme.outline} />
            <Text style={styles.dateText}>{formatActivityDisplayDate(form.activityDate)}</Text>
          </Pressable>
        </SubmitActivityCard>

        <SubmitActivityCard>
          <Text style={styles.fieldLabel}>Write short details about the work done</Text>
          <TextInput
            value={form.description}
            onChangeText={form.setDescription}
            placeholder="Example: Applied compost in wheat field..."
            placeholderTextColor={dashboardTheme.outline}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={styles.textArea}
          />
        </SubmitActivityCard>

        <SubmitActivityCard>
          <View style={styles.splitRow}>
            <View style={styles.splitItem}>
              <Text style={styles.fieldLabel}>Quantity</Text>
              <TextInput
                value={form.quantity}
                onChangeText={form.setQuantity}
                placeholder="0"
                placeholderTextColor={dashboardTheme.outline}
                keyboardType="decimal-pad"
                style={styles.input}
              />
            </View>

            <View style={styles.splitItem}>
              <Text style={styles.fieldLabel}>Unit</Text>
              <Pressable style={styles.selectorTriggerCompact} onPress={() => setUnitPickerOpen(true)}>
                <Text style={styles.unitText}>{selectedUnitLabel}</Text>
                <ChevronDownIcon />
              </Pressable>
            </View>
          </View>
        </SubmitActivityCard>

        <SubmitActivityCard>
          <LiveEvidenceCaptureCard
            evidence={form.evidence}
            pendingEvidence={form.pendingEvidence}
            capturing={form.evidenceCapturing}
            error={form.evidenceError}
            onOpenCamera={() => void form.pickCameraEvidence()}
            onRetake={() => void form.retakeCameraEvidence()}
            onConfirmPending={() => form.confirmPendingEvidence()}
            onRejectPending={() => form.rejectPendingEvidence()}
          />

          <View style={styles.infoBanner}>
            <BhuguardMaterialIcon name="science" size={16} color={dashboardTheme.primary} />
            <Text style={styles.infoBannerText}>GPS and timestamp are captured with each live photo</Text>
          </View>
        </SubmitActivityCard>

        <SubmitActivityCard>
          <View style={styles.locationHeader}>
            <Text style={styles.cardTitle}>Farm Location</Text>
            {form.gpsCaptured ? (
              <View style={styles.capturedBadge}>
                <BhuguardMaterialIcon name="verified" size={14} color={dashboardTheme.primaryContainer} filled />
                <Text style={styles.capturedBadgeText}>Captured</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.locationCard}>
            <View style={styles.locationLeft}>
              <View style={styles.locationIconWrap}>
                <BhuguardMaterialIcon name="location_on" size={22} color={dashboardTheme.primary} />
              </View>
              <View>
                <Text style={styles.coordsLabel}>Coordinates</Text>
                <Text style={styles.coordsValue}>
                  {form.gpsCaptured
                    ? `Lat: ${form.latitude?.toFixed(4)} • Long: ${form.longitude?.toFixed(4)}`
                    : form.gpsLoading
                      ? 'Capturing GPS...'
                      : 'GPS not captured yet'}
                </Text>
              </View>
            </View>

            <Pressable onPress={form.captureGps} disabled={form.gpsLoading}>
              <Text style={styles.captureAgain}>Capture Again</Text>
            </Pressable>
          </View>
        </SubmitActivityCard>

        {form.error ? <Text style={styles.error}>{form.error}</Text> : null}

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            onPress={handleSubmit}
            disabled={form.submitting}
          >
            <Text style={styles.primaryButtonText}>{form.submitting ? 'Submitting...' : 'Submit Activity'}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            onPress={handleSaveDraft}
            disabled={form.savingDraft}
          >
            <Text style={styles.secondaryButtonText}>{form.savingDraft ? 'Saving...' : 'Save as Draft'}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <FarmPickerModal
        visible={farmPickerOpen}
        farms={form.farms}
        selectedFarmId={form.selectedFarmId}
        onClose={() => setFarmPickerOpen(false)}
        onSelect={(id) => {
          form.setSelectedFarmId(id);
          setFarmPickerOpen(false);
        }}
      />

      <UnitPickerModal
        visible={unitPickerOpen}
        selectedUnit={form.unit}
        onClose={() => setUnitPickerOpen(false)}
        onSelect={(value) => {
          form.setUnit(value);
          setUnitPickerOpen(false);
        }}
      />

      <Modal visible={datePickerOpen} transparent animationType="slide" onRequestClose={() => setDatePickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Activity Date</Text>
            <Text style={styles.fieldLabel}>Date (YYYY-MM-DD)</Text>
            <TextInput
              value={dateInput}
              onChangeText={setDateInput}
              placeholder={todayIsoDate()}
              placeholderTextColor={dashboardTheme.outline}
              style={styles.input}
            />

            <View style={styles.quickDates}>
              <Pressable
                style={styles.quickDateButton}
                onPress={() => setDateInput(todayIsoDate())}
              >
                <Text style={styles.quickDateText}>Today</Text>
              </Pressable>
              <Pressable
                style={styles.quickDateButton}
                onPress={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  setDateInput(yesterday.toISOString().slice(0, 10));
                }}
              >
                <Text style={styles.quickDateText}>Yesterday</Text>
              </Pressable>
            </View>

            <Pressable style={styles.primaryButton} onPress={applyDate}>
              <Text style={styles.primaryButtonText}>Apply Date</Text>
            </Pressable>
            <Pressable style={styles.modalClose} onPress={() => setDatePickerOpen(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </Pressable>
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

function FarmPickerModal({
  visible,
  farms,
  selectedFarmId,
  onClose,
  onSelect,
}: {
  visible: boolean;
  farms: { id: number; name: string; subtitle: string }[];
  selectedFarmId: number | null;
  onClose: () => void;
  onSelect: (id: number) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Select Farm</Text>
          <FlatList
            data={farms}
            keyExtractor={(item) => String(item.id)}
            ListEmptyComponent={<Text style={styles.emptyText}>No farms available</Text>}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.farmOption, selectedFarmId === item.id && styles.farmOptionSelected]}
                onPress={() => onSelect(item.id)}
              >
                <Text style={styles.farmOptionTitle}>{item.name}</Text>
                <Text style={styles.farmOptionSubtitle}>{item.subtitle}</Text>
              </Pressable>
            )}
          />
          <Pressable style={styles.modalClose} onPress={onClose}>
            <Text style={styles.modalCloseText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function UnitPickerModal({
  visible,
  selectedUnit,
  onClose,
  onSelect,
}: {
  visible: boolean;
  selectedUnit: string;
  onClose: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Select Unit</Text>
          {FARMER_ACTIVITY_UNITS.map((option) => (
            <Pressable
              key={option.value}
              style={[styles.unitOption, selectedUnit === option.value && styles.farmOptionSelected]}
              onPress={() => onSelect(option.value)}
            >
              <Text style={styles.farmOptionTitle}>{option.label}</Text>
            </Pressable>
          ))}
          <Pressable style={styles.modalClose} onPress={onClose}>
            <Text style={styles.modalCloseText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: dashboardTheme.background,
  },
  content: {
    padding: dashboardTheme.marginMobile,
    gap: 16,
    paddingBottom: 120,
  },
  fieldLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: dashboardTheme.onSurfaceVariant,
    marginBottom: 4,
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
    gap: 12,
  },
  selectorTriggerCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: dashboardTheme.background,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
  },
  selectorCopy: {
    flex: 1,
    gap: 2,
  },
  selectorTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  selectorSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: dashboardTheme.onSurfaceVariant,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timestampNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: dashboardTheme.outlineVariant,
  },
  timestampNoteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: dashboardTheme.onSurfaceVariant,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    backgroundColor: dashboardTheme.surface,
  },
  chipSelected: {
    borderColor: dashboardTheme.primary,
    backgroundColor: dashboardTheme.surfaceLow,
  },
  chipText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: dashboardTheme.onSurfaceVariant,
  },
  chipTextSelected: {
    color: dashboardTheme.primary,
    fontWeight: '600',
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: dashboardTheme.background,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 8,
    padding: 12,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: dashboardTheme.onSurface,
  },
  textArea: {
    minHeight: 96,
    backgroundColor: dashboardTheme.background,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    lineHeight: 24,
    color: dashboardTheme.onSurface,
  },
  splitRow: {
    flexDirection: 'row',
    gap: 12,
  },
  splitItem: {
    flex: 1,
  },
  input: {
    backgroundColor: dashboardTheme.background,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: dashboardTheme.onSurface,
  },
  unitText: {
    fontSize: 16,
    color: dashboardTheme.onSurface,
  },
  cardTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  cardHint: {
    fontSize: 14,
    lineHeight: 20,
    color: dashboardTheme.onSurfaceVariant,
    marginTop: -4,
  },
  evidenceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  evidenceButton: {
    flex: 1,
    minHeight: 96,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: dashboardTheme.surface,
  },
  evidenceButtonText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: dashboardTheme.onSurfaceVariant,
  },
  evidencePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: dashboardTheme.surfaceContainerLow,
    borderRadius: 8,
    padding: 8,
  },
  evidenceImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  documentPreview: {
    width: 56,
    height: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: dashboardTheme.surfaceLow,
  },
  evidenceMeta: {
    flex: 1,
    gap: 4,
  },
  evidenceName: {
    fontSize: 14,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  removeEvidence: {
    fontSize: 13,
    fontWeight: '600',
    color: dashboardTheme.error,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: dashboardTheme.surfaceContainer,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: dashboardTheme.onSurfaceVariant,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  capturedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: dashboardTheme.surfaceLow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  capturedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: dashboardTheme.primaryContainer,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: dashboardTheme.background,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 8,
    padding: 12,
  },
  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  locationIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: dashboardTheme.surfaceContainer,
  },
  coordsLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: dashboardTheme.onSurfaceVariant,
  },
  coordsValue: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  captureAgain: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: dashboardTheme.primaryContainer,
  },
  error: {
    fontSize: 13,
    color: dashboardTheme.error,
    textAlign: 'center',
  },
  actions: {
    gap: 12,
    paddingTop: 8,
  },
  primaryButton: {
    backgroundColor: dashboardTheme.primaryContainer,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: dashboardTheme.onPrimary,
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: dashboardTheme.primaryContainer,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: dashboardTheme.primaryContainer,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '75%',
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: dashboardTheme.onSurface,
  },
  modalClose: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: '700',
    color: dashboardTheme.primaryContainer,
  },
  farmOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: dashboardTheme.outlineVariant,
    gap: 2,
  },
  farmOptionSelected: {
    backgroundColor: dashboardTheme.surfaceLow,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  farmOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  farmOptionSubtitle: {
    fontSize: 12,
    color: dashboardTheme.onSurfaceVariant,
  },
  unitOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: dashboardTheme.outlineVariant,
  },
  emptyText: {
    textAlign: 'center',
    color: dashboardTheme.textMuted,
    paddingVertical: 24,
  },
  quickDates: {
    flexDirection: 'row',
    gap: 8,
  },
  quickDateButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: dashboardTheme.surfaceContainerLow,
  },
  quickDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: dashboardTheme.primary,
  },
});
