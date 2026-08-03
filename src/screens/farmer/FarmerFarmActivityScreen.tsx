import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ErrorState } from '../../components/ErrorState';
import { LiveEvidenceCaptureCard } from '../../components/evidence/LiveEvidenceCaptureCard';
import { LoadingState } from '../../components/LoadingState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useFarmerFarmActivityForm } from '../../hooks/useFarmerFarmActivityForm';
import { useTranslation } from '../../i18n/I18nContext';
import type { FarmerStackParamList } from '../../navigation/types';
import { farmerTheme } from '../../theme/farmerTheme';
import { formatFarmerDisplayId } from '../../utils/displayIds';
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

/**
 * Phase 12.4 — Farmer Farm Activity is view-only.
 * Field Officers complete visits; farmers review status/history only.
 */
export function FarmerFarmActivityScreen({ navigation, route }: Props) {
  const { t, language } = useTranslation();
  const form = useFarmerFarmActivityForm({ farmId: route.params?.farmId, activityId: route.params?.activityId });
  const farm = form.selectedFarm;

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

  const farmerIdLabel = formatFarmerDisplayId({
    farmer_display_id: (farm as { farmerDisplayId?: string }).farmerDisplayId,
    farmer_code: farm.farmerCode,
  });

  const dueLabel =
    form.status === 'submitted'
      ? 'Submitted'
      : form.status === 'draft'
        ? 'Pending Field Officer visit'
        : form.status || '—';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title={t('farmer.activity.title')}
        subtitle="View only — Field Officer completes Farm Activity visits"
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, farmerTheme.cardShadow]}>
          <Text style={styles.sectionTitle}>{t('farmer.activity.farmSummary')}</Text>
          <SummaryCard
            label={t('farmer.activity.farmId')}
            value={farm.farmCode !== '-' ? farm.farmCode : String(farm.farmId)}
          />
          <SummaryCard label="Farm Name" value={farm.farmName !== '-' ? farm.farmName : '—'} />
          <SummaryCard label={t('farmer.activity.farmerId')} value={farmerIdLabel} />
          <SummaryCard label={t('farmer.activity.farmerName')} value={farm.farmerName !== '-' ? farm.farmerName : '—'} />
          <SummaryCard label={t('farmer.activity.village')} value={farm.village !== '-' ? farm.village : '—'} />
          <SummaryCard label={t('farmer.activity.taluka')} value={farm.taluka !== '-' ? farm.taluka : '—'} />
          <SummaryCard label={t('farmer.activity.district')} value={farm.district !== '-' ? farm.district : '—'} />
          <SummaryCard label={t('farmer.activity.state')} value={farm.state !== '-' ? farm.state : '—'} />
        </View>

        <View style={[styles.card, farmerTheme.cardShadow]}>
          <Text style={styles.sectionTitle}>Activity</Text>
          <SummaryCard label="Activity title" value="Farm Activity" />
          <SummaryCard label={t('farmer.activity.activityDate')} value={formatLocalizedDate(form.activityDate, language)} />
          <SummaryCard label="Status" value={dueLabel} />
        </View>

        <View style={[styles.card, farmerTheme.cardShadow]}>
          <Text style={styles.sectionTitle}>{t('farmer.activity.gps')}</Text>
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
            pendingEvidence={form.liveEvidence.pendingEvidence}
            capturing={form.liveEvidence.capturing}
            error={form.liveEvidence.error}
            readOnly
            onOpenCamera={() => undefined}
            onRetake={() => undefined}
            onConfirmPending={() => undefined}
            onRejectPending={() => undefined}
            showUploadButton={false}
            onOpenPreview={(uri) =>
              navigation.navigate('FullscreenImage', { uri, title: t('farmer.activity.photo') })
            }
          />
        </View>

        <View style={[styles.card, farmerTheme.cardShadow]}>
          <Text style={styles.sectionTitle}>{t('farmer.activity.notes')}</Text>
          <Text style={styles.readOnlyValue}>{form.notes.trim() || '—'}</Text>
        </View>

        <Text style={styles.helper}>
          Regenerative Agriculture and Agroforestry are Upcoming and do not open active workflows.
          Biochar activities are available from Biochar screens.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: farmerTheme.cream },
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
  readOnlyValue: { fontSize: 15, fontWeight: '600', color: farmerTheme.headingGreen },
  helper: { fontSize: 12, color: farmerTheme.secondaryText, lineHeight: 18 },
});
