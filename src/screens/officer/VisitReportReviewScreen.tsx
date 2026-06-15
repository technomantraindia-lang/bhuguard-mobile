import { useState } from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../../api/authApi';
import { submitVisitReport } from '../../api/fieldOfficerApi';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { ScreenHeader } from '../../components/ScreenHeader';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'VisitReportReview'>;

export function VisitReportReviewScreen({ route, navigation }: Props) {
  const { assignmentId } = route.params;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);

    try {
      await submitVisitReport(assignmentId, {
        officer_recommendation: 'approved',
        officer_remarks: 'Visit report submitted via mobile flow.',
      });
      navigation.replace('VisitReportSuccess', { assignmentId });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Visit report submission failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Review & Submit" subtitle={`Assignment #${assignmentId}`} />
      <AppCard
        title="Submission summary"
        subtitle="Checklist and evidence are ready. Submit to complete this verification visit."
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <AppButton label="Submit Visit Report" onPress={submit} loading={loading} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, padding: 20, gap: 12 },
  error: { color: colors.error, fontSize: 13 },
});
