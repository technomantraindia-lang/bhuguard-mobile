import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';

import { checkInVisit, startVerification } from '../../api/fieldOfficerApi';
import { getApiErrorMessage } from '../../api/authApi';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { VisitVerificationProgressStepper } from '../../components/officer/VisitVerificationProgressStepper';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useVisitVerificationProgress } from '../../hooks/useVisitVerificationProgress';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'VisitCheckIn'>;

export function VisitCheckInScreen({ route, navigation }: Props) {
  const { assignmentId } = route.params;
  const { progress, reload } = useVisitVerificationProgress(assignmentId, 'check_in');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setError('Location permission is required for GPS check-in.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({});
      await checkInVisit(assignmentId, {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      await startVerification(assignmentId);
      await reload();
      navigation.navigate('VerificationChecklist', { assignmentId });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Check-in failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Visit Check-In" subtitle={`Assignment #${assignmentId}`} />
      <ScrollView contentContainerStyle={styles.container}>
        <VisitVerificationProgressStepper
          currentStep={progress.currentStep}
          completedSteps={progress.completedSteps}
        />
        <AppCard
          title="GPS check-in"
          subtitle="Capture your live location at the farm before starting verification."
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AppButton label="Check In with GPS" onPress={handleCheckIn} loading={loading} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20, gap: 12 },
  error: { color: colors.error, fontSize: 13 },
});
