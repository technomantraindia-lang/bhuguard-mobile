import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppButton } from '../../components/AppButton';
import { ErrorState } from '../../components/ErrorState';
import { LiveEvidenceCaptureCard } from '../../components/evidence/LiveEvidenceCaptureCard';
import { LoadingState } from '../../components/LoadingState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useFarmerFarmActivityForm } from '../../hooks/useFarmerFarmActivityForm';
import type { FarmerStackParamList } from '../../navigation/types';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import { formatActivityDisplayDate } from '../../utils/activityDateHelpers';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmerFarmActivity'>;

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

export function FarmerFarmActivityScreen({ navigation, route }: Props) {
  const form = useFarmerFarmActivityForm({ farmId: route.params?.farmId, activityId: route.params?.activityId });
  const farm = form.selectedFarm;

  const handleSubmit = async () => {
    const ok = await form.submit();

    if (ok) {
      Alert.alert('Farm Activity submitted', 'Your farm update has been recorded successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  };

  const handleSaveDraft = async () => {
    const ok = await form.saveDraft();

    if (ok) {
      Alert.alert('Draft saved', 'You can continue this Farm Activity later.', [{ text: 'OK' }]);
    }
  };

  if (form.loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading Farm Activity form..." />
      </SafeAreaView>
    );
  }

  if (!farm) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message="No linked farm selected." onRetry={() => navigation.replace('FarmerFarmSelection')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Farm Activity" subtitle="Add Farm Activity" showBack onBackPress={() => navigation.goBack()} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={[styles.card, dashboardShadow]}>
            <Text style={styles.sectionTitle}>Selected Farm Summary</Text>
            <SummaryCard label="Farm ID" value={farm.farmCode !== '-' ? farm.farmCode : String(farm.farmId)} />
            <SummaryCard label="Farmer ID" value={farm.farmerCode !== '-' ? farm.farmerCode : String(farm.farmerId)} />
            <SummaryCard label="Farmer Name" value={farm.farmerName !== '-' ? farm.farmerName : '—'} />
            <SummaryCard label="Village" value={farm.village !== '-' ? farm.village : '—'} />
            <SummaryCard label="Taluka" value={farm.taluka !== '-' ? farm.taluka : '—'} />
            <SummaryCard label="District" value={farm.district !== '-' ? farm.district : '—'} />
            <SummaryCard label="State" value={farm.state !== '-' ? farm.state : '—'} />
          </View>

          <View style={[styles.card, dashboardShadow]}>
            <Text style={styles.sectionTitle}>Activity Date</Text>
            <TextInput
              value={form.activityDate}
              onChangeText={form.setActivityDate}
              placeholder="YYYY-MM-DD"
              style={styles.input}
            />
            <Text style={styles.helper}>Selected: {formatActivityDisplayDate(form.activityDate)}</Text>
          </View>

          <View style={[styles.card, dashboardShadow]}>
            <Text style={styles.sectionTitle}>GPS Location</Text>
            <AppButton label={form.capturingGps ? 'Capturing GPS...' : 'Capture GPS'} onPress={() => void form.captureGps()} disabled={form.capturingGps} />
            <SummaryCard label="Latitude" value={form.latitude != null ? String(form.latitude) : '—'} />
            <SummaryCard label="Longitude" value={form.longitude != null ? String(form.longitude) : '—'} />
            <SummaryCard label="GPS Accuracy" value={form.accuracy != null ? `${form.accuracy} m` : '—'} />
          </View>

          <View style={[styles.card, dashboardShadow]}>
            <Text style={styles.sectionTitle}>Farm Activity Photo</Text>
            <LiveEvidenceCaptureCard
              evidence={form.liveEvidence.evidence}
              capturing={form.liveEvidence.capturing}
              error={form.liveEvidence.error}
              onOpenCamera={() => void form.liveEvidence.captureEvidence()}
              onRetake={() => void form.liveEvidence.retakeEvidence()}
              onUpload={() => void form.liveEvidence.pickGalleryEvidence()}
              uploadLabel="Upload from Gallery"
              showUploadButton
              onOpenPreview={(uri) => navigation.navigate('FullscreenImage', { uri, title: 'Farm Activity Photo' })}
            />
          </View>

          <View style={[styles.card, dashboardShadow]}>
            <Text style={styles.sectionTitle}>Notes (optional)</Text>
            <TextInput
              value={form.notes}
              onChangeText={form.setNotes}
              placeholder="Add optional notes"
              multiline
              style={[styles.input, styles.notesInput]}
            />
          </View>

          {form.status === 'draft' && form.recordId ? (
            <View style={styles.draftBadge}>
              <Text style={styles.draftBadgeText}>Draft saved</Text>
            </View>
          ) : null}

          {form.error ? <Text style={styles.errorText}>{form.error}</Text> : null}

          <View style={styles.actions}>
            <AppButton label="Save Draft" variant="secondary" onPress={() => void handleSaveDraft()} loading={form.savingDraft} />
            <AppButton label="Submit Farm Activity" onPress={() => void handleSubmit()} loading={form.submitting} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dashboardTheme.background },
  flex: { flex: 1 },
  content: { padding: dashboardTheme.marginMobile, gap: 16, paddingBottom: 40 },
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 16,
    gap: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: dashboardTheme.onSurface },
  summaryRow: { gap: 2 },
  summaryLabel: { fontSize: 12, color: dashboardTheme.textMuted, fontWeight: '600' },
  summaryValue: { fontSize: 14, color: dashboardTheme.onSurface },
  input: {
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: dashboardTheme.onSurface,
    backgroundColor: dashboardTheme.surfaceLowest,
  },
  notesInput: { minHeight: 90, textAlignVertical: 'top' },
  helper: { fontSize: 12, color: dashboardTheme.textMuted },
  actions: { gap: 12 },
  errorText: { color: dashboardTheme.error, fontSize: 14 },
  draftBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  draftBadgeText: { color: '#CA8A04', fontWeight: '700', fontSize: 12 },
});
