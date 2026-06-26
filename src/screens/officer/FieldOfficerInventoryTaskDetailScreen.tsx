import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../../api/authApi';
import {
  saveInventoryFarmDeliveryVerification,
  saveInventoryMovementVerification,
  saveInventoryStockVerification,
  saveInventoryStorageVerification,
  submitInventoryVerificationReport,
} from '../../api/fieldOfficerApi';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { DetailRow } from '../../components/DetailRow';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useInventoryVerificationTask } from '../../hooks/useInventoryVerificationTask';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import type { ApiRecord } from '../../utils/apiHelpers';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'FieldOfficerInventoryTaskDetail'>;

export function FieldOfficerInventoryTaskDetailScreen({ route, navigation }: Props) {
  const { taskId } = route.params;
  const { task, loading, error, reload, submitting, setSubmitting } =
    useInventoryVerificationTask(taskId);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const runStep = async (label: string, runner: () => Promise<unknown>) => {
    setSubmitting(true);
    setActionMessage(null);

    try {
      await runner();
      setActionMessage(`${label} saved.`);
      await reload();
    } catch (caught) {
      Alert.alert(label, getApiErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  };

  const submitReport = async () => {
    setSubmitting(true);

    try {
      await submitInventoryVerificationReport(taskId, {
        remarks: 'Submitted from mobile inventory verification.',
      });
      Alert.alert('Report submitted', 'Inventory verification report sent.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (caught) {
      Alert.alert('Submit failed', getApiErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading inventory task…" />;
  }

  if (error || !task) {
    return <ErrorState message={error ?? 'Task not found.'} onRetry={() => void reload()} />;
  }

  const payload: ApiRecord = { verification_result: 'verified', remarks: 'Verified on mobile.' };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader title={task.itemName} subtitle={task.taskCode} />

        <AppCard title="Task overview">
          <DetailRow label="Status" value={task.verificationStatusLabel} />
          <DetailRow label="Type" value={task.movementTypeLabel} />
          <DetailRow label="Farmer" value={task.farmerName} />
          <DetailRow label="Farm" value={task.farmName} />
        </AppCard>

        {actionMessage ? <Text style={styles.success}>{actionMessage}</Text> : null}

        <AppButton
          label="Save stock verification"
          onPress={() =>
            void runStep('Stock verification', () => saveInventoryStockVerification(taskId, payload))
          }
          disabled={submitting}
        />
        <AppButton
          label="Save storage verification"
          onPress={() =>
            void runStep('Storage verification', () =>
              saveInventoryStorageVerification(taskId, payload),
            )
          }
          disabled={submitting}
        />
        <AppButton
          label="Save farm delivery verification"
          onPress={() =>
            void runStep('Farm delivery verification', () =>
              saveInventoryFarmDeliveryVerification(taskId, payload),
            )
          }
          disabled={submitting}
        />
        <AppButton
          label="Save movement verification"
          onPress={() =>
            void runStep('Movement verification', () =>
              saveInventoryMovementVerification(taskId, payload),
            )
          }
          disabled={submitting}
        />
        <AppButton
          label="Submit inventory report"
          onPress={() => void submitReport()}
          disabled={submitting}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.screen, gap: spacing.md, paddingBottom: spacing.xxxl },
  success: { color: colors.primary, fontWeight: '600' },
});
