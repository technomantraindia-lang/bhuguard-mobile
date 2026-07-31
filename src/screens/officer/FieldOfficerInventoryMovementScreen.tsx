import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import {
  AvailabilitySummarySection,
  LocationVerificationSection,
} from '../../components/officer/inventory/InventoryMovementSections';
import { OfficerInventoryMovementHeader } from '../../components/officer/inventory/OfficerInventoryMovementHeader';
import { LoadingState } from '../../components/LoadingState';
import { INVENTORY_UTILIZATION_OPTIONS } from '../../constants/inventoryUtilization';
import { useInventoryUtilizationForm } from '../../hooks/useInventoryUtilizationForm';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { officerTheme } from '../../theme/officerDashboardTheme';
import { pickString } from '../../utils/apiHelpers';
import { formatStatusLabel } from '../../utils/statusLabels';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList, 'FieldOfficerInventoryMovement'>;
type ScreenRoute = RouteProp<FieldOfficerStackParamList, 'FieldOfficerInventoryMovement'>;

export function FieldOfficerInventoryMovementScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();
  const form = useInventoryUtilizationForm({
    farmerId: route.params?.farmerId,
    farmId: route.params?.farmId,
  });

  const handleSubmit = async () => {
    const success = await form.submit();
    if (success) {
      Alert.alert('Utilization recorded', `Remaining balance: ${form.remainingKg} kg`);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <OfficerInventoryMovementHeader
        officerName="Field Officer"
        onBackPress={() => navigation.goBack()}
        onNotificationsPress={() => navigation.navigate('FieldOfficerNotifications')}
        onProfilePress={() => navigation.navigate('FieldOfficerProfile')}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Inventory Movement</Text>
        <Text style={styles.sectionHint}>Step 1: Enter a Farm ID to load eligible Biochar production batches.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Farm ID</Text>
          <TextInput
            style={styles.input}
            value={form.farmIdInput}
            onChangeText={form.setFarmIdInput}
            keyboardType="number-pad"
            placeholder="Enter Farm ID"
            placeholderTextColor={officerTheme.outline}
          />
          <Pressable style={styles.outlineButton} onPress={() => void form.searchByFarmId()} disabled={form.loading}>
            <Text style={styles.outlineButtonText}>{form.loading ? 'Loading…' : 'Load Batches'}</Text>
          </Pressable>
        </View>

        {form.loading ? <LoadingState message="Loading inventory batches..." /> : null}

        {!form.loading && form.activeFarmId && form.batches.length === 0 ? (
          <Text style={styles.empty}>No inventory batches found for this Farm ID.</Text>
        ) : null}

        {form.batches.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Step 2: Select a batch</Text>
            {form.batches.map((batch) => {
              const selected = batch.id === form.selectedBatchId;
              return (
                <Pressable
                  key={batch.id}
                  style={[styles.batchCard, selected && styles.batchCardActive]}
                  onPress={() => form.setSelectedBatchId(batch.id)}
                >
                  <Text style={styles.batchTitle}>{batch.batchCode !== '-' ? batch.batchCode : `Batch #${batch.id}`}</Text>
                  <Text style={styles.meta}>Production date: {batch.productionDateLabel}</Text>
                  <Text style={styles.meta}>Feedstock: {batch.feedstockType}</Text>
                  <Text style={styles.meta}>Produced: {batch.productionQty}</Text>
                  <Text style={styles.meta}>Available: {batch.inventory.availableKg} kg</Text>
                  <Text style={styles.meta}>Storage: {formatStatusLabel(batch.storageStatus)}</Text>
                  <Text style={styles.meta}>Inventory: {formatStatusLabel(batch.storageStatus)}</Text>
                </Pressable>
              );
            })}
          </>
        ) : null}

        {form.selectedBatch ? (
          <>
            <Text style={styles.sectionTitle}>Step 3: Batch inventory details</Text>
            <View style={styles.card}>
              <Text style={styles.value}>{form.selectedBatch.batchCode}</Text>
              <Text style={styles.meta}>Production date: {form.selectedBatch.productionDateLabel}</Text>
              <Text style={styles.meta}>Feedstock: {form.selectedBatch.feedstockType}</Text>
              <Text style={styles.meta}>Produced: {form.selectedBatch.productionQty}</Text>
              <Text style={styles.meta}>Available: {form.selectedBatch.inventory.availableKg} kg</Text>
              <Text style={styles.meta}>Reserved: {form.selectedBatch.inventory.reservedKg} kg</Text>
              <Text style={styles.meta}>Moved: {form.selectedBatch.inventory.movedKg} kg</Text>
              <Text style={styles.meta}>Remaining balance: {form.selectedBatch.inventory.balanceKg} kg</Text>
              <Text style={styles.meta}>Storage: {formatStatusLabel(form.selectedBatch.storageStatus)}</Text>
            </View>

            <AvailabilitySummarySection
              availableKg={form.availableKg}
              reservedKg={form.selectedBatch.inventory.reservedKg}
              movedKg={form.selectedBatch.inventory.movedKg}
              balanceKg={form.remainingKg}
            />

            <Text style={styles.sectionTitle}>Step 4: Inventory action</Text>
            <Text style={styles.sectionHint}>What was done with this Biochar?</Text>

            <View style={styles.chipRow}>
              {INVENTORY_UTILIZATION_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  style={[styles.chip, form.transactionType === option.value && styles.chipActive]}
                  onPress={() => form.setTransactionType(option.value)}
                >
                  <Text style={[styles.chipText, form.transactionType === option.value && styles.chipTextActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Quantity (kg)</Text>
              <TextInput style={styles.input} value={form.quantity} onChangeText={form.setQuantity} keyboardType="decimal-pad" />
              <Text style={styles.label}>Activity Date</Text>
              <TextInput style={styles.input} value={form.activityDate} onChangeText={form.setActivityDate} />
            </View>

            {form.transactionType === 'applied_to_farm' ? (
              <View style={styles.card}>
                <Text style={styles.label}>Farm</Text>
                <Text style={styles.value}>{form.destination?.farmCode ?? form.activeFarmId ?? '—'}</Text>
                <Text style={styles.label}>Crop</Text>
                <TextInput style={styles.input} value={form.cropName} onChangeText={form.setCropName} />
                <Text style={styles.label}>Area Applied</Text>
                <TextInput style={styles.input} value={form.areaApplied} onChangeText={form.setAreaApplied} keyboardType="decimal-pad" />
                <Pressable style={styles.outlineButton} onPress={() => void form.captureApplicationImage()}>
                  <Text style={styles.outlineButtonText}>Capture Application Image</Text>
                </Pressable>
              </View>
            ) : null}

            {form.transactionType === 'sold' ? (
              <View style={styles.card}>
                <Text style={styles.label}>Buyer Name</Text>
                <TextInput style={styles.input} value={form.buyerName} onChangeText={form.setBuyerName} />
                <Text style={styles.label}>Buyer Mobile Number</Text>
                <TextInput style={styles.input} value={form.buyerMobile} onChangeText={form.setBuyerMobile} keyboardType="phone-pad" />
                <Text style={styles.label}>Selling Price (optional)</Text>
                <TextInput style={styles.input} value={form.sellingPrice} onChangeText={form.setSellingPrice} keyboardType="decimal-pad" />
                <Text style={styles.label}>Invoice Number (optional)</Text>
                <TextInput style={styles.input} value={form.invoiceNumber} onChangeText={form.setInvoiceNumber} />
                <Pressable style={styles.outlineButton} onPress={() => void form.captureInvoiceImage()}>
                  <Text style={styles.outlineButtonText}>Capture Invoice Image</Text>
                </Pressable>
              </View>
            ) : null}

            {form.transactionType === 'kept_in_stock' ? (
              <View style={styles.card}>
                <Text style={styles.label}>Storage location</Text>
                <TextInput style={styles.input} value={form.storageLocation} onChangeText={form.setStorageLocation} />
              </View>
            ) : null}

            {form.transactionType === 'wasted' ? (
              <View style={styles.card}>
                <Text style={styles.label}>Waste Reason</Text>
                <TextInput style={styles.input} value={form.wasteReason} onChangeText={form.setWasteReason} />
                <Text style={styles.label}>Disposal Method</Text>
                <TextInput style={styles.input} value={form.disposalMethod} onChangeText={form.setDisposalMethod} />
                <Pressable style={styles.outlineButton} onPress={() => void form.captureWasteImage()}>
                  <Text style={styles.outlineButtonText}>Capture Waste Image</Text>
                </Pressable>
              </View>
            ) : null}

            <LocationVerificationSection
              latitude={form.latitude}
              longitude={form.longitude}
              accuracyM={form.accuracyM}
              gpsVerified={form.latitude != null && form.longitude != null}
              onCaptureGps={() => void form.captureGps()}
              onVerifyLocation={() => void form.captureGps()}
            />

            <View style={styles.card}>
              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput style={[styles.input, styles.notes]} value={form.notes} onChangeText={form.setNotes} multiline />
            </View>

            <Text style={styles.sectionTitle}>Previous movement history</Text>
            {form.movementHistory.length === 0 ? (
              <Text style={styles.empty}>No previous movements for these batches.</Text>
            ) : (
              form.movementHistory.slice(0, 10).map((item, index) => (
                <View key={`${pickString(item, 'id')}-${index}`} style={styles.historyCard}>
                  <Text style={styles.meta}>
                    {formatStatusLabel(pickString(item, 'movement_type_label', 'movement_type', 'transaction_type'))} ·{' '}
                    {pickString(item, 'quantity')} {pickString(item, 'quantity_unit') !== '-' ? pickString(item, 'quantity_unit') : 'kg'}
                  </Text>
                  <Text style={styles.meta}>
                    {pickString(item, 'batch_code') !== '-' ? pickString(item, 'batch_code') : `Batch ${pickString(item, 'batch_id')}`}
                    {' · '}
                    {pickString(item, 'activity_date', 'created_at')}
                  </Text>
                </View>
              ))
            )}

            {form.error ? <Text style={styles.error}>{form.error}</Text> : null}
            {form.quantityError ? <Text style={styles.error}>{form.quantityError}</Text> : null}

            <Pressable
              style={[styles.primaryAction, (form.submitting || Boolean(form.quantityError)) && styles.actionDisabled]}
              onPress={() => void handleSubmit()}
              disabled={form.submitting || Boolean(form.quantityError)}
            >
              <Text style={styles.primaryActionText}>{form.submitting ? 'Saving...' : 'Submit Utilization'}</Text>
            </Pressable>
          </>
        ) : null}

        {form.error && !form.activeFarmId ? <Text style={styles.error}>{form.error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: officerTheme.background },
  content: { padding: officerTheme.marginMobile, gap: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: officerTheme.onSurface },
  sectionHint: { fontSize: 14, color: officerTheme.onSurfaceVariant },
  empty: { color: officerTheme.onSurfaceVariant, fontSize: 14 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: officerTheme.surfaceLowest,
  },
  chipActive: { backgroundColor: officerTheme.primary, borderColor: officerTheme.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: officerTheme.onSurface },
  chipTextActive: { color: officerTheme.onPrimary },
  card: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 12,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
  },
  batchCard: {
    backgroundColor: officerTheme.surface,
    borderRadius: 12,
    padding: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
  },
  batchCardActive: { borderColor: officerTheme.primary, backgroundColor: '#F0FDF4' },
  batchTitle: { fontSize: 16, fontWeight: '700', color: officerTheme.onSurface },
  historyCard: {
    backgroundColor: officerTheme.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    gap: 2,
  },
  label: { fontSize: 12, fontWeight: '700', color: officerTheme.onSurfaceVariant, textTransform: 'uppercase' },
  value: { fontSize: 15, fontWeight: '700', color: officerTheme.onSurface },
  meta: { fontSize: 13, color: officerTheme.onSurfaceVariant },
  input: {
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: officerTheme.onSurface,
    backgroundColor: '#fff',
  },
  notes: { minHeight: 80, textAlignVertical: 'top' },
  outlineButton: {
    borderWidth: 1,
    borderColor: officerTheme.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  outlineButtonText: { color: officerTheme.primary, fontWeight: '700' },
  error: { color: officerTheme.error, fontSize: 13, textAlign: 'center' },
  primaryAction: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: officerTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: { color: officerTheme.onPrimary, fontSize: 15, fontWeight: '700' },
  actionDisabled: { opacity: 0.65 },
});
