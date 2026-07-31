import { Alert, SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { ErrorState } from '../../components/ErrorState';
import { OfficerVerificationEvidenceUpload } from '../../components/officer/evidence/OfficerVerificationEvidenceUpload';
import { VisitVerificationProgressStepper } from '../../components/officer/VisitVerificationProgressStepper';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useVisitVerificationProgress } from '../../hooks/useVisitVerificationProgress';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'VisitEvidenceUpload'>;

export function VisitEvidenceUploadScreen({ route, navigation }: Props) {
  const { assignmentId } = route.params;
  const { progress, reload: reloadProgress } = useVisitVerificationProgress(assignmentId, 'evidence');

  if (!assignmentId) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message="Visit ID is missing. Please reopen this visit and try again." />
      </SafeAreaView>
    );
  }

  const handleSubmitVerification = () => {
    Alert.alert('Verification ready', 'All required evidence photos are uploaded.', [
      {
        text: 'Continue to Review',
        onPress: () => navigation.navigate('VisitReportReview', { assignmentId }),
      },
      { text: 'Stay', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Farm Verification" subtitle={`Assignment #${assignmentId}`} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <VisitVerificationProgressStepper
          currentStep={progress.currentStep}
          completedSteps={progress.completedSteps}
        />

        <AppCard
          title="Evidence Upload"
          subtitle="Before Photo, During Photo, and After Photo are required."
        />

        <OfficerVerificationEvidenceUpload
          assignmentId={assignmentId}
          onProgressChange={() => void reloadProgress()}
          onSubmitVerification={handleSubmitVerification}
        />

        <AppButton
          label="Continue to Review"
          onPress={() => navigation.navigate('VisitReportReview', { assignmentId })}
          variant="secondary"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  container: { padding: 20, gap: 12 },
});
