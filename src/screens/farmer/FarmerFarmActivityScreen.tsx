import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppButton } from '../../components/AppButton';
import { ErrorState } from '../../components/ErrorState';
import { LiveEvidenceCaptureCard } from '../../components/evidence/LiveEvidenceCaptureCard';
import { LoadingState } from '../../components/LoadingState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useFarmerFarmActivityForm } from '../../hooks/useFarmerFarmActivityForm';
import { useTranslation } from '../../i18n/I18nContext';
import type { FarmerStackParamList } from '../../navigation/types';
import { farmerTheme } from '../../theme/farmerTheme';
import { formatLocalizedDate } from '../../utils/localizedDate';

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
  const { t, language } = useTranslation();
  const form = useFarmerFarmActivityForm({ farmId: route.params?.farmId, activityId: route.params?.activityId });
  const farm = form.selectedFarm;
  const isSubmittedReadOnly = form.status === 'submitted';

  const handleSubmit = async () => {
    if (isSubmittedReadOnly) {
      return;
    }

    const ok = await form.submit();

    if (ok) {
      Alert.alert(t('farmer.activity.submittedTitle'), t('farmer.activity.submittedMessage'), [
        { text: t('common.close'), onPress: () => navigation.goBack() },
      ]);
    }
  };

  if (form.loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message={t('farmer.activity.loading')} />
      </SafeAreaView>
    );
  }

  if (!farm) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState
          message={t('farmer.activity.noFarm')}
          onRetry={() => navigation.replace('FarmerFarmSelection')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title={t('farmer.activity.title')}
        subtitle={isSubmittedReadOnly ? 'Submitted — view only' : t('farmer.activity.subtitle')}
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={[styles.card, farmerTheme.cardShadow]}>
            <Text style={styles.sectionTitle}>{t('farmer.activity.farmSummary')}</Text>
            <SummaryCard label={t('farmer.activity.farmId')} value={farm.farmCode !== '-' ? farm.farmCode : String(farm.farmId)} />
            <SummaryCard label={t('farmer.activity.farmerId')} value={farm.farmerCode !== '-' ? farm.farmerCode : String(farm.farmerId)} />
            <SummaryCard label={t('farmer.activity.farmerName')} value={farm.farmerName !== '-' ? farm.farmerName : '—'} />
            <SummaryCard label={t('farmer.activity.village')} value={farm.village !== '-' ? farm.village : '—'} />
            <SummaryCard label={t('farmer.activity.taluka')} value={farm.taluka !== '-' ? farm.taluka : '—'} />
            <SummaryCard label={t('farmer.activity.district')} value={farm.district !== '-' ? farm.district : '—'} />
            <SummaryCard label={t('farmer.activity.state')} value={farm.state !== '-' ? farm.state : '—'} />
          </View>

          <View style={[styles.card, farmerTheme.cardShadow]}>
            <Text style={styles.sectionTitle}>{t('farmer.activity.activityDate')}</Text>
            <View style={styles.readOnlyField}>
              <Text style={styles.readOnlyValue}>{formatLocalizedDate(form.activityDate, language)}</Text>
            </View>
            <Text style={styles.helper}>{t('farmer.activity.activityDateHelper')}</Text>
          </View>

          <View style={[styles.card, farmerTheme.cardShadow]}>
            <Text style={styles.sectionTitle}>{t('farmer.activity.gps')}</Text>
            {!isSubmittedReadOnly ? (
              <AppButton
                label={form.capturingGps ? t('farmer.activity.capturingGps') : t('farmer.activity.captureGps')}
                onPress={() => void form.captureGps()}
                disabled={form.capturingGps}
              />
            ) : null}
            <SummaryCard label={t('farmer.activity.latitude')} value={form.latitude != null ? String(form.latitude) : '—'} />
            <SummaryCard label={t('farmer.activity.longitude')} value={form.longitude != null ? String(form.longitude) : '—'} />
            <SummaryCard
              label={t('farmer.activity.gpsAccuracy')}
              value={form.accuracy != null ? `${form.accuracy} m` : '—'}
            />
          </View>

          <View style={[styles.card, farmerTheme.cardShadow]}>
            <Text style={styles.sectionTitle}>{t('farmer.activity.photo')}</Text>
            <LiveEvidenceCaptureCard
              evidence={form.liveEvidence.evidence}
              capturing={form.liveEvidence.capturing}
              error={form.liveEvidence.error}
              readOnly={isSubmittedReadOnly}
              onOpenCamera={() => void form.liveEvidence.captureEvidence()}
              onRetake={() => void form.liveEvidence.retakeEvidence()}
              onUpload={() => void form.liveEvidence.pickGalleryEvidence()}
              uploadLabel={t('farmer.activity.uploadGallery')}
              showUploadButton={!isSubmittedReadOnly}
              onOpenPreview={(uri) =>
                navigation.navigate('FullscreenImage', { uri, title: t('farmer.activity.photo') })
              }
            />
          </View>

          <View style={[styles.card, farmerTheme.cardShadow]}>
            <Text style={styles.sectionTitle}>{t('farmer.activity.notes')}</Text>
            {isSubmittedReadOnly ? (
              <Text style={styles.readOnlyValue}>{form.notes.trim() || '—'}</Text>
            ) : (
              <TextInput
                value={form.notes}
                onChangeText={form.setNotes}
                placeholder={t('farmer.activity.notesPlaceholder')}
                multiline
                style={[styles.input, styles.notesInput]}
              />
            )}
          </View>

          {form.error ? <Text style={styles.errorText}>{form.error}</Text> : null}

          {!isSubmittedReadOnly ? (
            <View style={styles.actions}>
              <AppButton
                label={t('farmer.activity.submit')}
                onPress={() => void handleSubmit()}
                loading={form.submitting}
              />
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: farmerTheme.cream },
  flex: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  card: {
    backgroundColor: farmerTheme.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: farmerTheme.softBorder,
    padding: 16,
    gap: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: farmerTheme.headingGreen },
  summaryRow: { gap: 2 },
  summaryLabel: { fontSize: 12, color: farmerTheme.secondaryText, fontWeight: '600' },
  summaryValue: { fontSize: 14, color: farmerTheme.deepText },
  readOnlyField: {
    borderWidth: 1,
    borderColor: farmerTheme.softBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: farmerTheme.lightGreenSurface,
  },
  readOnlyValue: { fontSize: 15, fontWeight: '600', color: farmerTheme.headingGreen },
  input: {
    borderWidth: 1,
    borderColor: farmerTheme.softBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: farmerTheme.deepText,
    backgroundColor: farmerTheme.white,
  },
  notesInput: { minHeight: 90, textAlignVertical: 'top' },
  helper: { fontSize: 12, color: farmerTheme.secondaryText },
  actions: { gap: 12 },
  errorText: { color: farmerTheme.error, fontSize: 14 },
});
