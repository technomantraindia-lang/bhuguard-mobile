import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { FieldOfficerStackParamList } from '../../navigation/types';
import { officerTheme } from '../../theme/officerDashboardTheme';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'OfficerGpsValidation'>;

export function OfficerGpsValidationScreen({ route, navigation }: Props) {
  const { latitude, longitude, accuracyM, distanceKm, verificationId } = route.params;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Back</Text>
        </Pressable>
        <Text style={styles.title}>GPS Validation</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.row}>Latitude: {latitude.toFixed(4)}</Text>
        <Text style={styles.row}>Longitude: {longitude.toFixed(4)}</Text>
        <Text style={styles.row}>Accuracy: {accuracyM != null ? `${accuracyM} m` : '—'}</Text>
        <Text style={styles.row}>Distance from farm: {distanceKm != null ? `${distanceKm} km` : '—'}</Text>
        <Pressable
          style={styles.button}
          onPress={() => {
            navigation.navigate({
              name: 'FieldOfficerFeedstockVerification',
              params: { verificationId, gpsVerified: true },
              merge: true,
            });
          }}
        >
          <Text style={styles.buttonText}>Confirm GPS Valid</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: officerTheme.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: officerTheme.surfaceLowest,
    borderBottomWidth: 1,
    borderBottomColor: officerTheme.outlineVariant,
  },
  back: { color: officerTheme.primaryContainer, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '700', color: officerTheme.onSurface },
  content: { padding: 16, gap: 12 },
  row: { fontSize: 15, fontWeight: '600', color: officerTheme.onSurface },
  button: {
    marginTop: 12,
    backgroundColor: officerTheme.primaryContainer,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: { color: officerTheme.onPrimary, fontWeight: '700' },
});
