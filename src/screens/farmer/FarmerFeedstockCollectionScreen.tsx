import { useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
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

import { BiocharRecordInfoCard } from '../../components/farmer/biochar/BiocharRecordInfoCard';
import { FeedstockCollectionSuccessModal } from '../../components/farmer/biochar/FeedstockCollectionSuccessModal';
import { FarmerFormScreenHeader } from '../../components/farmer/FarmerFormScreenHeader';
import { BhuguardMaterialIcon } from '../../components/shared/BhuguardMaterialIcon';
import {
  FEEDSTOCK_QUANTITY_UNITS,
  FEEDSTOCK_TYPES,
  type FeedstockQuantityUnit,
  type FeedstockTypeValue,
} from '../../constants/feedstockTypes';
import { useAddFeedstockCollectionForm } from '../../hooks/useAddFeedstockCollectionForm';
import type { FarmerStackParamList } from '../../navigation/types';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmerFeedstockCollection'>;

function formatCoordinate(value: number | null, direction: 'N' | 'E'): string {
  if (value == null) {
    return '—';
  }

  return `${Math.abs(value).toFixed(4)}° ${direction}`;
}

export function FarmerFeedstockCollectionScreen({ navigation, route }: Props) {
  const { farmId } = route.params ?? {};
  const form = useAddFeedstockCollectionForm({ initialFarmId: farmId });
  const [farmPickerOpen, setFarmPickerOpen] = useState(false);
  const [unitPickerOpen, setUnitPickerOpen] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [submittedRecordCode, setSubmittedRecordCode] = useState('');

  const selectedUnitLabel =
    FEEDSTOCK_QUANTITY_UNITS.find((option) => option.value === form.quantityUnit)?.label ?? form.quantityUnit;

  const handleSubmit = async () => {
    const recordCode = await form.submit();

    if (recordCode) {
      setSubmittedRecordCode(recordCode);
      setSuccessVisible(true);
    }
  };

  const handleSaveDraft = async () => {
    const success = await form.saveDraft();

    if (success) {
      Alert.alert('Draft saved', 'You can continue this feedstock collection later.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  };

  const closeSuccess = () => {
    setSuccessVisible(false);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FarmerFormScreenHeader
        title="Feedstock Collection"
        onBack={() => navigation.goBack()}
        onNotificationsPress={() => navigation.navigate('FarmerNotifications')}
        onProfilePress={() => navigation.navigate('FarmerProfile')}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BiocharRecordInfoCard
          fullName={form.recordContext.fullName}
          farmerCode={form.recordContext.farmerCode}
          projectName={form.recordContext.projectName}
          farmName={form.selectedFarm?.name ?? form.recordContext.farmName}
        />

        <View style={styles.section}>
          <Text style={styles.fieldLabel}>
            Select Farm <Text style={styles.required}>*</Text>
          </Text>
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
        </View>

        <View style={styles.section}>
          <Text style={styles.fieldLabel}>
            Feedstock Type <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.chipWrap}>
            {FEEDSTOCK_TYPES.map((option) => {
              const selected = form.feedstockType === option.value;

              return (
                <Pressable
                  key={option.value}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => form.setFeedstockType(option.value as FeedstockTypeValue)}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
          {form.feedstockType === 'other' ? (
            <TextInput
              value={form.otherFeedstockLabel}
              onChangeText={form.setOtherFeedstockLabel}
              placeholder="Describe feedstock type"
              placeholderTextColor={dashboardTheme.outline}
              style={styles.input}
            />
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.fieldLabel}>
            Quantity <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.quantityRow}>
            <TextInput
              value={form.quantity}
              onChangeText={(text) => form.setQuantity(text.replace(/[^\d.]/g, ''))}
              placeholder="Enter quantity"
              placeholderTextColor={dashboardTheme.outline}
              keyboardType="decimal-pad"
              style={[styles.input, styles.quantityInput]}
            />
            <Pressable style={styles.unitTrigger} onPress={() => setUnitPickerOpen(true)}>
              <Text style={styles.unitText}>{selectedUnitLabel}</Text>
              <ChevronDownIcon />
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.fieldLabel}>
            Collection Date & Time <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.readonlyField}>
            <BhuguardMaterialIcon name="event_note" size={20} color={dashboardTheme.outline} />
            <Text style={styles.readonlyText}>{form.collectionDateLabel}</Text>
            <BhuguardMaterialIcon name="lock" size={16} color={dashboardTheme.outline} />
          </View>
        </View>

        <View style={[styles.panel, dashboardShadow]}>
          <View style={styles.panelHeader}>
            <Text style={styles.fieldLabel}>
              Location <Text style={styles.required}>*</Text>
            </Text>
            {form.gpsCaptured ? (
              <View style={styles.capturedBadge}>
                <BhuguardMaterialIcon name="verified" size={14} color={dashboardTheme.primaryContainer} filled />
                <Text style={styles.capturedBadgeText}>Captured</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.gpsCard}>
            <View style={styles.gpsIconWrap}>
              <BhuguardMaterialIcon name="share_location" size={22} color={dashboardTheme.primaryContainer} />
            </View>
            <View style={styles.gpsCopy}>
              <Text style={styles.gpsLine}>Lat: {formatCoordinate(form.latitude, 'N')}</Text>
              <Text style={styles.gpsLine}>Long: {formatCoordinate(form.longitude, 'E')}</Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.gpsButton, pressed && styles.pressed]}
            onPress={() => void form.captureGps()}
            disabled={form.gpsLoading}
          >
            <BhuguardMaterialIcon name="location_on" size={18} color={dashboardTheme.primaryContainer} />
            <Text style={styles.gpsButtonText}>
              {form.gpsLoading ? 'Updating GPS...' : 'Update GPS Location'}
            </Text>
          </Pressable>
        </View>

        <View style={[styles.panel, dashboardShadow]}>
          <View style={styles.panelHeader}>
            <Text style={styles.fieldLabel}>
              Photos <Text style={styles.required}>*</Text>
            </Text>
            <Text style={styles.hintText}>Min. 1 photo required</Text>
          </View>

          {form.evidence ? (
            <View style={styles.photoPreviewWrap}>
              <Image source={{ uri: form.evidence.uri }} style={styles.photoPreview} resizeMode="cover" />
              <Pressable style={styles.retakeButton} onPress={() => void form.retakeCameraPhoto()}>
                <Text style={styles.retakeButtonText}>Retake Photo</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.cameraButton, pressed && styles.pressed]}
              onPress={() => void form.pickCameraPhoto()}
              disabled={form.evidenceCapturing}
            >
              <BhuguardMaterialIcon name="photo_camera" size={40} color={dashboardTheme.primaryContainer} />
              <Text style={styles.cameraTitle}>
                {form.evidenceCapturing ? 'Opening camera...' : 'Take Live Photo'}
              </Text>
              <Text style={styles.cameraSubtitle}>Camera capture only for verification</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.fieldLabel}>Notes</Text>
          <TextInput
            value={form.notes}
            onChangeText={form.setNotes}
            placeholder="Add notes about feedstock collection (optional)"
            placeholderTextColor={dashboardTheme.outline}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={[styles.input, styles.notesInput]}
          />
        </View>

        {form.error ? <Text style={styles.error}>{form.error}</Text> : null}
        {form.evidenceError ? <Text style={styles.error}>{form.evidenceError}</Text> : null}

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.primaryButton, dashboardShadow, pressed && styles.pressed, form.submitting && styles.disabled]}
            onPress={() => void handleSubmit()}
            disabled={form.submitting}
          >
            <BhuguardMaterialIcon name="upload" size={20} color={dashboardTheme.onPrimary} />
            <Text style={styles.primaryButtonText}>
              {form.submitting ? 'Submitting...' : 'Submit Collection'}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed, form.savingDraft && styles.disabled]}
            onPress={() => void handleSaveDraft()}
            disabled={form.savingDraft}
          >
            <Text style={styles.secondaryButtonText}>
              {form.savingDraft ? 'Saving...' : 'Save as Draft'}
            </Text>
          </Pressable>
        </View>
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
          </View>
        </View>
      </Modal>

      <Modal visible={unitPickerOpen} animationType="slide" transparent onRequestClose={() => setUnitPickerOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Quantity Unit</Text>
            {FEEDSTOCK_QUANTITY_UNITS.map((option) => (
              <Pressable
                key={option.value}
                style={styles.option}
                onPress={() => {
                  form.setQuantityUnit(option.value as FeedstockQuantityUnit);
                  setUnitPickerOpen(false);
                }}
              >
                <Text style={styles.optionTitle}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      <FeedstockCollectionSuccessModal
        visible={successVisible}
        recordCode={submittedRecordCode}
        onDone={closeSuccess}
      />
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
  content: {
    padding: dashboardTheme.marginMobile,
    gap: 20,
    paddingBottom: 40,
  },
  section: { gap: 8 },
  fieldLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  required: { color: dashboardTheme.error },
  selectorTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: dashboardTheme.surfaceLowest,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  selectorCopy: { flex: 1, gap: 2 },
  selectorTitle: { fontSize: 16, fontWeight: '600', color: dashboardTheme.onSurface },
  selectorSubtitle: { fontSize: 12, color: dashboardTheme.onSurfaceVariant },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    backgroundColor: dashboardTheme.surfaceLowest,
  },
  chipSelected: {
    backgroundColor: dashboardTheme.surfaceLow,
    borderColor: dashboardTheme.primaryContainer,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: dashboardTheme.onSurfaceVariant,
  },
  chipTextSelected: {
    color: dashboardTheme.primaryContainer,
    fontWeight: '600',
  },
  quantityRow: { flexDirection: 'row', gap: 12 },
  input: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: dashboardTheme.onSurface,
  },
  quantityInput: { flex: 1 },
  unitTrigger: {
    width: '33%',
    minWidth: 110,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: dashboardTheme.surfaceLowest,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  unitText: { fontSize: 16, color: dashboardTheme.onSurface, fontWeight: '500' },
  readonlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: dashboardTheme.surfaceContainer,
    borderWidth: 1,
    borderColor: `${dashboardTheme.outlineVariant}80`,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  readonlyText: { flex: 1, fontSize: 16, color: dashboardTheme.onSurfaceVariant },
  panel: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${dashboardTheme.surfaceVariant}80`,
    padding: 16,
    gap: 14,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  capturedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: dashboardTheme.surfaceLow,
    borderWidth: 1,
    borderColor: dashboardTheme.secondaryContainer,
  },
  capturedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: dashboardTheme.primaryContainer,
  },
  gpsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: dashboardTheme.surfaceContainer,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: `${dashboardTheme.outlineVariant}4D`,
  },
  gpsIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${dashboardTheme.primaryContainer}1A`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsCopy: { flex: 1, gap: 2 },
  gpsLine: { fontSize: 16, color: dashboardTheme.onSurfaceVariant },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: dashboardTheme.surfaceLow,
    borderRadius: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: `${dashboardTheme.primaryContainer}33`,
  },
  gpsButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: dashboardTheme.primaryContainer,
  },
  hintText: { fontSize: 12, fontWeight: '600', color: dashboardTheme.outline },
  cameraButton: {
    borderWidth: 1,
    borderColor: `${dashboardTheme.primaryContainer}33`,
    borderRadius: 12,
    backgroundColor: `${dashboardTheme.primaryContainer}1A`,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  cameraTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: dashboardTheme.primaryContainer,
  },
  cameraSubtitle: {
    fontSize: 12,
    color: dashboardTheme.onSurfaceVariant,
    textAlign: 'center',
  },
  photoPreviewWrap: { gap: 10 },
  photoPreview: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: dashboardTheme.surfaceContainer,
  },
  retakeButton: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: dashboardTheme.surfaceLow,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
  },
  retakeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: dashboardTheme.primaryContainer,
  },
  notesInput: { minHeight: 96 },
  error: { color: dashboardTheme.error, fontSize: 14, lineHeight: 20 },
  actions: { gap: 12, marginTop: 8 },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: dashboardTheme.primaryContainer,
    borderRadius: 12,
    paddingVertical: 16,
  },
  primaryButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: dashboardTheme.onPrimary,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: `${dashboardTheme.primaryContainer}33`,
    borderRadius: 12,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: dashboardTheme.primaryContainer,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
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
});
