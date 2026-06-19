import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import {
  AvailabilitySummarySection,
  BatchInformationSection,
  EvidenceUploadSection,
  LocationVerificationSection,
  MovementDetailsSection,
  MovementRecordCard,
  OfficerRemarksSection,
  QuantityTimingSection,
  ReceiverConfirmationSection,
  RecordStatusSection,
  StorageInformationSection,
  TransportationSection,
} from '../../components/officer/inventory/InventoryMovementSections';
import { OfficerInventoryMovementHeader } from '../../components/officer/inventory/OfficerInventoryMovementHeader';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { INVENTORY_MOVEMENT_TYPE_OPTIONS } from '../../constants/inventoryMovement';
import { useInventoryMovementForm } from '../../hooks/useInventoryMovementForm';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { officerTheme } from '../../theme/officerDashboardTheme';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList, 'FieldOfficerInventoryMovement'>;
type ScreenRoute = RouteProp<FieldOfficerStackParamList, 'FieldOfficerInventoryMovement'>;

export function FieldOfficerInventoryMovementScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();
  const form = useInventoryMovementForm({ farmerId: route.params?.farmerId });

  if (form.loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading inventory movement form..." />
      </SafeAreaView>
    );
  }

  if (form.error && form.batches.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message={form.error} onRetry={form.reload} />
      </SafeAreaView>
    );
  }

  const cycleBatch = () => {
    if (form.batches.length === 0) {
      return;
    }

    const currentIndex = form.batches.findIndex((batch) => batch.id === form.selectedBatchId);
    const next = form.batches[(currentIndex + 1) % form.batches.length];
    form.setSelectedBatchId(next.id);
  };

  const cycleStorage = () => {
    if (form.storageLocations.length === 0) {
      return;
    }

    const currentIndex = form.storageLocations.findIndex((location) => location.key === form.selectedStorageKey);
    const next = form.storageLocations[(currentIndex + 1) % form.storageLocations.length];
    form.setSelectedStorageKey(next.key);
  };

  const cycleMovementType = () => {
    const currentIndex = INVENTORY_MOVEMENT_TYPE_OPTIONS.findIndex((option) => option.value === form.movementType);
    const next = INVENTORY_MOVEMENT_TYPE_OPTIONS[(currentIndex + 1) % INVENTORY_MOVEMENT_TYPE_OPTIONS.length];
    form.setMovementType(next.value);
  };

  const cycleDestination = () => {
    if (form.destinations.length === 0) {
      return;
    }

    form.setSelectedDestinationIndex((form.selectedDestinationIndex + 1) % form.destinations.length);
  };

  const cycleTransportMethod = () => {
    if (form.transportMethods.length === 0) {
      return;
    }

    const currentIndex = form.transportMethods.findIndex((method) => method.value === form.transportMethod);
    const next = form.transportMethods[(currentIndex + 1) % form.transportMethods.length];
    form.setTransportMethod(next.value);
  };

  const cycleUnit = () => {
    form.setQuantityUnit((current) => (current === 'kg' ? 'tons' : 'kg'));
  };

  const handleSaveDraft = async () => {
    const ok = await form.saveDraft();
    if (ok) {
      Alert.alert('Draft saved', 'Inventory movement draft saved successfully.');
      await form.reload();
    }
  };

  const handleSubmit = async () => {
    const movementCode = await form.submit();
    if (movementCode) {
      Alert.alert('Movement submitted', `Inventory movement ${movementCode} was submitted successfully.`, [
        {
          text: 'Done',
          onPress: () => navigation.navigate('FieldOfficerTabs', { screen: 'Visits' }),
        },
      ]);
    }
  };

  const inventory = form.selectedBatch?.inventory;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <OfficerInventoryMovementHeader
        officerName={form.officerName}
        onBackPress={() => navigation.navigate('FieldOfficerTabs', { screen: 'Visits' })}
        onNotificationsPress={() => navigation.navigate('FieldOfficerNotifications')}
        onProfilePress={() => navigation.navigate('FieldOfficerProfile')}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MovementRecordCard
          movementCode={form.movementCode}
          statusLabel={form.statusLabel}
          officerName={form.officerName}
        />

        <BatchInformationSection
          batches={form.batches}
          selectedBatch={form.selectedBatch}
          onCycleBatch={cycleBatch}
        />

        <StorageInformationSection storage={form.selectedStorage} onCycleStorage={cycleStorage} />

        {inventory ? (
          <AvailabilitySummarySection
            availableKg={inventory.availableKg}
            reservedKg={inventory.reservedKg}
            movedKg={inventory.movedKg}
            balanceKg={form.remainingKg}
          />
        ) : null}

        <MovementDetailsSection
          movementType={form.movementType}
          destination={form.destination}
          onCycleMovementType={cycleMovementType}
          onCycleDestination={cycleDestination}
        />

        <QuantityTimingSection
          movementDate={form.movementDate}
          quantityMoved={form.quantityMoved}
          quantityUnit={form.quantityUnit}
          availableKg={form.availableKg}
          remainingKg={form.remainingKg}
          quantityError={form.quantityError}
          onChangeDate={form.setMovementDate}
          onChangeQuantity={form.setQuantityMoved}
          onCycleUnit={cycleUnit}
        />

        <TransportationSection
          transportMethod={form.transportMethod}
          vehicleNumber={form.vehicleNumber}
          driverName={form.driverName}
          transportMethods={form.transportMethods}
          onCycleMethod={cycleTransportMethod}
          onChangeVehicle={form.setVehicleNumber}
          onChangeDriver={form.setDriverName}
        />

        <LocationVerificationSection
          latitude={form.latitude}
          longitude={form.longitude}
          accuracyM={form.accuracyM}
          gpsVerified={form.gpsVerified}
          onCaptureGps={() => void form.captureGps()}
          onVerifyLocation={() => void form.captureGps()}
        />

        <EvidenceUploadSection
          evidence={form.evidence}
          onCapture={(key) => void form.captureEvidence(key)}
        />

        <ReceiverConfirmationSection
          farmerName={form.destination?.farmerName ?? 'Farmer'}
          receiverName={form.receiverName}
          receiverMobile={form.receiverMobile}
          receiverConfirmed={form.receiverConfirmed}
          quantityMoved={form.quantityMoved}
          onChangeReceiverName={form.setReceiverName}
          onChangeReceiverMobile={form.setReceiverMobile}
          onToggleConfirmed={() => form.setReceiverConfirmed((current) => !current)}
        />

        <OfficerRemarksSection value={form.officerRemarks} onChange={form.setOfficerRemarks} />

        <RecordStatusSection status={form.recordStatus} onChange={form.setRecordStatus} />

        {form.error ? <Text style={styles.error}>{form.error}</Text> : null}

        <View style={styles.actions}>
          <Pressable
            style={[styles.secondaryAction, form.submitting && styles.actionDisabled]}
            onPress={() => void handleSaveDraft()}
            disabled={form.submitting}
          >
            <Text style={styles.secondaryActionText}>Save Draft</Text>
          </Pressable>
          <Pressable
            style={[styles.primaryAction, form.submitting && styles.actionDisabled]}
            onPress={() => void handleSubmit()}
            disabled={form.submitting}
          >
            <Text style={styles.primaryActionText}>{form.submitting ? 'Saving...' : 'Submit Movement'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: officerTheme.background },
  content: { padding: officerTheme.marginMobile, gap: 16, paddingBottom: 40 },
  error: { color: officerTheme.error, fontSize: 13, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  primaryAction: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: officerTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: { color: officerTheme.onPrimary, fontSize: 15, fontWeight: '700' },
  secondaryAction: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: officerTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: officerTheme.surfaceLowest,
  },
  secondaryActionText: { color: officerTheme.primary, fontSize: 15, fontWeight: '700' },
  actionDisabled: { opacity: 0.65 },
});
