import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../../api/authApi';
import { createFieldOfficerVisit } from '../../api/fieldOfficerApi';
import { ScreenHeader } from '../../components/ScreenHeader';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { officerTheme } from '../../theme/officerDashboardTheme';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'FieldOfficerCreateVisit'>;

export function FieldOfficerCreateVisitScreen({ route, navigation }: Props) {
  const { farmerId } = route.params;
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    setSubmitting(true);

    try {
      const result = await createFieldOfficerVisit({ farmer_id: farmerId });
      const assignmentId = Number((result.visit as { assignment_id?: number })?.assignment_id ?? result.assignment_id);

      Alert.alert('Visit created', 'You can now proceed with GPS check-in and Biochar verification.', [
        {
          text: 'Open Visit',
          onPress: () => navigation.replace('FieldOfficerAssignmentDetail', { assignmentId }),
        },
      ]);
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err, 'Failed to create visit.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Add Visit" showBrandLogo={false} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.copy}>
          Create a self-service Biochar field visit for this farmer. No admin assignment is required.
        </Text>
        <Pressable style={styles.button} onPress={() => void handleCreate()} disabled={submitting}>
          <Text style={styles.buttonText}>{submitting ? 'Creating...' : 'Create Visit'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: officerTheme.background },
  content: { padding: officerTheme.marginMobile, gap: 16 },
  copy: { fontSize: 15, lineHeight: 22, color: officerTheme.onSurfaceVariant },
  button: {
    backgroundColor: officerTheme.primaryContainer,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: { color: officerTheme.onPrimary, fontWeight: '700', fontSize: 16 },
});
