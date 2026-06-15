import { useState } from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';

import { checkInVisit } from '../../api/fieldOfficerApi';
import { getApiErrorMessage } from '../../api/authApi';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { ScreenHeader } from '../../components/ScreenHeader';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'VisitCheckIn'>;

export function VisitCheckInScreen({ route, navigation }: Props) {
  const { assignmentId } = route.params;
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
      <AppCard
        title="GPS check-in"
        subtitle="Capture your live location at the farm before starting verification."
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <AppButton label="Check In with GPS" onPress={handleCheckIn} loading={loading} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, padding: 20, gap: 12 },
  error: { color: colors.error, fontSize: 13 },
});
