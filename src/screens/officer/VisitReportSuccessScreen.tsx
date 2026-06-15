import { SafeAreaView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { ScreenHeader } from '../../components/ScreenHeader';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'VisitReportSuccess'>;

export function VisitReportSuccessScreen({ route, navigation }: Props) {
  const { assignmentId } = route.params;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Visit Submitted" subtitle={`Assignment #${assignmentId}`} />
      <AppCard
        title="Success"
        subtitle="Verification report was submitted successfully and is now available for review."
      />
      <AppButton
        label="Back to Assignments"
        onPress={() =>
          navigation.reset({
            index: 0,
            routes: [{ name: 'FieldOfficerAssignments' }],
          })
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, padding: 20, gap: 12 },
});
