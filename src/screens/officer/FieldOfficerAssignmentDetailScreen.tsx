import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  acceptVisit,
  getVisitAssignmentDetail,
  startVerification,
  startVisit,
} from '../../api/fieldOfficerApi';
import { getApiErrorMessage } from '../../api/authApi';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { StatusBadge } from '../../components/StatusBadge';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { pickNestedString, pickString } from '../../utils/apiHelpers';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'FieldOfficerAssignmentDetail'>;

export function FieldOfficerAssignmentDetailScreen({ route, navigation }: Props) {
  const { assignmentId } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<Record<string, unknown> | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getVisitAssignmentDetail(assignmentId);
      const root = data as Record<string, unknown>;
      const record = (root.assignment ?? root.data ?? root) as Record<string, unknown>;
      setAssignment(record);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load assignment.'));
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (action: () => Promise<unknown>) => {
    setActionLoading(true);
    setError(null);

    try {
      await action();
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Action failed.'));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (error && !assignment) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message={error} onRetry={load} />
      </SafeAreaView>
    );
  }

  if (!assignment) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState title="No assignment data" message="This assignment could not be loaded." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader title="Assignment Detail" subtitle={`ID ${assignmentId}`} />
        <AppCard title={pickString(assignment, 'assignment_code', 'id')}>
          <StatusBadge status={pickString(assignment, 'assignment_status')} />
          <Text style={styles.line}>Farmer: {pickNestedString(assignment, 'farmer.user.name')}</Text>
          <Text style={styles.line}>Farm: {pickNestedString(assignment, 'farm.farm_name')}</Text>
          <Text style={styles.line}>Service: {pickNestedString(assignment, 'service.name')}</Text>
          <Text style={styles.line}>Instructions: {pickString(assignment, 'instructions')}</Text>
        </AppCard>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AppButton label="Accept Visit" onPress={() => runAction(() => acceptVisit(assignmentId))} loading={actionLoading} variant="secondary" />
        <AppButton label="Start Visit" onPress={() => runAction(() => startVisit(assignmentId))} loading={actionLoading} variant="secondary" />
        <AppButton label="Start Verification" onPress={() => runAction(() => startVerification(assignmentId))} loading={actionLoading} />
        <AppButton
          label="Open Visit Flow"
          onPress={() => navigation.navigate('VisitCheckIn', { assignmentId })}
          variant="secondary"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20, gap: 12 },
  line: { fontSize: 14, color: colors.text, marginTop: 4 },
  error: { color: colors.error, fontSize: 13 },
});
