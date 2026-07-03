import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import {
  BiocharMixingBasicSection,
  BiocharMixingBatchSection,
  BiocharMixingEvidenceCard,
  BiocharMixingFarmerSection,
  BiocharMixingLocationSection,
  BiocharMixingNotesSection,
} from '../../components/biochar/BiocharMixingSections';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { AppButton } from '../../components/AppButton';
import { BIOCHAR_MIXING_EVIDENCE_SLOTS, type BiocharMixingEvidenceKey } from '../../constants/biocharMixing';
import { useBiocharMixingForm } from '../../hooks/useBiocharMixingForm';
import { colors } from '../../theme/colors';

type MixingRouteParams = {
  recordId?: number;
  farmerId?: number;
  farmId?: number;
  farmLabel?: string;
};

interface BiocharMixingScreenProps<T extends MixingRouteParams> {
  apiMode: 'farmer' | 'officer' | 'artisan';
  title?: string;
  stackName: string;
}

export function createBiocharMixingScreen<T extends MixingRouteParams>({
  apiMode,
  title = 'Biochar Mixing',
}: BiocharMixingScreenProps<T>) {
  return function BiocharMixingScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>();
    const route = useRoute<RouteProp<Record<string, T | undefined>, string>>();
    const params = route.params ?? ({} as T);

    const form = useBiocharMixingForm({
      apiMode,
      recordId: params.recordId,
      farmerId: params.farmerId,
      farmId: params.farmId,
    });

    const readOnly = !form.canEdit;

    if (form.loading) {
      return (
        <SafeAreaView style={styles.safe}>
          <LoadingState message="Loading Biochar Mixing form..." />
        </SafeAreaView>
      );
    }

    if (form.error && params.recordId) {
      return (
        <SafeAreaView style={styles.safe}>
          <ErrorState message={form.error} onRetry={form.reload} />
        </SafeAreaView>
      );
    }

    const openPreview = (uri: string) => {
      if (apiMode === 'officer') {
        navigation.navigate('OfficerFullscreenImage', { uri, title: 'Biochar Mixing Evidence' });
        return;
      }

      navigation.navigate('FullscreenImage', { uri, title: 'Biochar Mixing Evidence' });
    };

    const handleSaveDraft = async () => {
      const ok = await form.saveDraft();
      if (ok) {
        Alert.alert('Draft saved', 'Biochar Mixing saved as draft.');
      }
    };

    const handleSubmit = async () => {
      const code = await form.submit();
      if (code) {
        Alert.alert('Submitted', `Biochar Mixing ${code} submitted successfully.`, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    };

    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title={title} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <Text style={styles.heroTitle}>Biochar Mixing</Text>
            <Text style={styles.heroMeta}>
              {form.mixingRecordId ? `Record ${form.mixingRecordId}` : 'New record'} · {form.statusLabel}
            </Text>
          </View>

          <BiocharMixingBasicSection
            state={form.state}
            site={form.site}
            dateOfMixing={form.dateOfMixing}
            readOnly={readOnly}
            onStateChange={form.setState}
            onSiteChange={form.setSite}
            onDateChange={form.setDateOfMixing}
          />

          <BiocharMixingLocationSection
            latitude={form.latitude}
            longitude={form.longitude}
            altitude={form.altitude}
            accuracyM={form.accuracyM}
            capturing={form.capturingGps}
            readOnly={readOnly}
            onCaptureGps={() => void form.recaptureGps()}
          />

          <BiocharMixingFarmerSection
            farmerName={form.farmerName}
            phoneNumber={form.phoneNumber}
            acresOfCotton={form.acresOfCotton}
            readOnly={readOnly}
            onFarmerNameChange={form.setFarmerName}
            onPhoneChange={form.setPhoneNumber}
            onAcresChange={form.setAcresOfCotton}
          />

          <BiocharMixingBatchSection
            batchNumbers={form.batchNumbers}
            readOnly={readOnly}
            onBatchNumbersChange={form.setBatchNumbers}
          />

          <Text style={styles.sectionHeading}>Mixing Evidence</Text>
          {BIOCHAR_MIXING_EVIDENCE_SLOTS.map((slot) => (
            <BiocharMixingEvidenceCard
              key={slot.key}
              slot={slot}
              evidence={form.evidence[slot.key]}
              readOnly={readOnly}
              onAdd={() => void form.addEvidence(slot.key)}
              onRemove={() => form.removeEvidence(slot.key)}
              onPreview={openPreview}
            />
          ))}

          <BiocharMixingNotesSection notes={form.notes} readOnly={readOnly} onNotesChange={form.setNotes} />

          {!readOnly ? (
            <View style={styles.actions}>
              <AppButton label="Save Draft" variant="secondary" onPress={() => void handleSaveDraft()} loading={form.submitting} />
              <AppButton label="Submit" onPress={() => void handleSubmit()} loading={form.submitting} />
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  };
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D7E0D8',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  heroTitle: { color: colors.primaryDark, fontSize: 22, fontWeight: '800' },
  heroMeta: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  sectionHeading: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 4 },
  actions: { gap: 10, marginTop: 8 },
});
