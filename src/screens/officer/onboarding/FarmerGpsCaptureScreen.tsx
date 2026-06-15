import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';

import { AppButton } from '../../../components/AppButton';
import { AppCard } from '../../../components/AppCard';
import { StatusBadge } from '../../../components/StatusBadge';
import { useOnboarding } from '../../../context/OnboardingContext';
import type { FieldOfficerStackParamList } from '../../../navigation/types';
import { colors } from '../../../theme/colors';
import { validateGps } from '../../../utils/onboardingValidation';
import { OnboardingFormScreen } from './OnboardingFormScreen';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList>;

function formatTimestamp(iso: string): string {
  if (!iso) {
    return '-';
  }

  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function FarmerGpsCaptureScreen() {
  const navigation = useNavigation<Nav>();
  const { draft, updateDraft } = useOnboarding();
  const [error, setError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  const hasGps = Boolean(draft.gps_latitude.trim() && draft.gps_longitude.trim());

  const captureLocation = async () => {
    setCapturing(true);
    setError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        setError('Location permission denied. Enable location access in device settings and try again.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      updateDraft({
        gps_latitude: String(position.coords.latitude),
        gps_longitude: String(position.coords.longitude),
        gps_accuracy: position.coords.accuracy ? String(position.coords.accuracy) : '',
        gps_captured_at: new Date().toISOString(),
      });
    } catch {
      setError('Failed to capture GPS. Move to an open area and try again.');
    } finally {
      setCapturing(false);
    }
  };

  const next = () => {
    const validationError = validateGps(draft);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    navigation.navigate('FarmerProofUpload');
  };

  return (
    <OnboardingFormScreen
      stepCurrent={4}
      title="GPS Mapping"
      subtitle="Capture the farm boundary location for DMRV mapping."
      onNext={next}
      nextDisabled={!hasGps}
    >
      <AppCard title="Farm GPS coordinates" subtitle="Capture the field officer's current location at the farm boundary.">
        <View style={styles.badgeRow}>
          <StatusBadge label={hasGps ? 'Captured' : 'Pending'} tone={hasGps ? 'success' : 'warning'} />
        </View>
        <Text style={styles.line}>Latitude: {draft.gps_latitude || '-'}</Text>
        <Text style={styles.line}>Longitude: {draft.gps_longitude || '-'}</Text>
        <Text style={styles.line}>Accuracy: {draft.gps_accuracy ? `${draft.gps_accuracy} m` : '-'}</Text>
        <Text style={styles.line}>Captured at: {formatTimestamp(draft.gps_captured_at)}</Text>
      </AppCard>
      <AppButton
        label={hasGps ? 'Capture again' : 'Capture current location'}
        onPress={captureLocation}
        loading={capturing}
        variant={hasGps ? 'secondary' : 'primary'}
      />
      {!hasGps ? (
        <Text style={styles.hint}>Continue is enabled after GPS is captured successfully.</Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </OnboardingFormScreen>
  );
}

const styles = StyleSheet.create({
  badgeRow: { marginBottom: 4 },
  line: { fontSize: 14, color: colors.text, marginTop: 4 },
  hint: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  error: { color: colors.error, fontSize: 14 },
});
