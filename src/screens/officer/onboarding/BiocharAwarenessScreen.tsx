import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import * as Location from 'expo-location';

import { getApiErrorMessage } from '../../../api/authApi';
import { recordFarmerBiocharExplanation } from '../../../api/fieldOfficerApi';
import { AppButton } from '../../../components/AppButton';
import { ScreenHeader } from '../../../components/ScreenHeader';
import type { FieldOfficerStackParamList } from '../../../navigation/types';
import { colors } from '../../../theme/colors';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList, 'BiocharAwareness'>;
type ScreenRoute = RouteProp<FieldOfficerStackParamList, 'BiocharAwareness'>;

const AWARENESS_POINTS = [
  'What is Biochar?',
  'Why Biochar is useful for soil?',
  'How Biochar improves soil quality?',
  'How Biochar activity should be updated?',
  'Why live image evidence is required?',
  'When next Biochar update will be due?',
];

export function BiocharAwarenessScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();
  const farmerId = route.params.farmerId;
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    if (!confirmed) {
      Alert.alert('Confirmation required', 'Please confirm that you explained Biochar to the farmer.');
      return;
    }

    setSubmitting(true);

    try {
      let gps: Record<string, number> = {};
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.granted) {
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        gps = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          gps_accuracy: position.coords.accuracy ?? 0,
        };
      }

      await recordFarmerBiocharExplanation(farmerId, {
        is_explained: true,
        ...gps,
        accuracy: gps.gps_accuracy,
      });

      Alert.alert('Saved', 'Biochar awareness recorded for this farmer.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Unable to save', getApiErrorMessage(error, 'Failed to record Biochar awareness.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader title="Biochar Awareness for Farmer" subtitle="Explain the process before onboarding activity" />

        {AWARENESS_POINTS.map((point, index) => (
          <View key={point} style={styles.pointCard}>
            <Text style={styles.pointIndex}>{index + 1}</Text>
            <Text style={styles.pointText}>{point}</Text>
          </View>
        ))}

        <Pressable style={styles.checkboxRow} onPress={() => setConfirmed((value) => !value)}>
          <View style={[styles.checkbox, confirmed && styles.checkboxChecked]} />
          <Text style={styles.checkboxLabel}>I have explained the Biochar process to the farmer.</Text>
        </Pressable>

        <AppButton label={submitting ? 'Saving...' : 'Save Awareness Record'} onPress={() => void handleSave()} disabled={submitting} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20, gap: 12 },
  pointCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
  },
  pointIndex: { fontWeight: '700', color: colors.primary, width: 20 },
  pointText: { flex: 1, fontSize: 14, color: colors.text },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  checkboxChecked: { backgroundColor: colors.primary },
  checkboxLabel: { flex: 1, fontSize: 14, color: colors.text },
});
