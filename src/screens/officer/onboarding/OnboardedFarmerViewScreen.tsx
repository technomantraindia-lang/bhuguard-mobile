import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { getFieldOfficerFarmerDetail } from '../../../api/fieldOfficerApi';
import { getApiErrorMessage } from '../../../api/authApi';
import { AppCard } from '../../../components/AppCard';
import { AppButton } from '../../../components/AppButton';
import { ErrorState } from '../../../components/ErrorState';
import { LoadingState } from '../../../components/LoadingState';
import { OnboardingReviewPhoto } from '../../../components/onboarding/OnboardingReviewPhoto';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { useOnboarding } from '../../../context/OnboardingContext';
import type { FieldOfficerStackParamList } from '../../../navigation/types';
import { colors } from '../../../theme/colors';
import { pickString, type ApiRecord } from '../../../utils/apiHelpers';
import { formatFarmerCode } from '../../../utils/onboardingNotes';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList, 'OnboardedFarmerView'>;
type ScreenRoute = RouteProp<FieldOfficerStackParamList, 'OnboardedFarmerView'>;

export function OnboardedFarmerViewScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();
  const { result, draft } = useOnboarding();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);

  const routeFarmerId = route.params?.farmerId;
  const resolvedFarmerId = Number(routeFarmerId ?? result?.farmer_id ?? 0);

  const load = async () => {
    if (!resolvedFarmerId) {
      setError('Farmer not found.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getFieldOfficerFarmerDetail(resolvedFarmerId);
      setDetail((data.farmer as Record<string, unknown>) ?? null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load farmer details.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [resolvedFarmerId]);

  const farmerName = String(detail?.name ?? result?.farmer_name ?? '-');
  const mobile = String(detail?.mobile ?? result?.mobile ?? '-');
  const photoUrl = pickString(detail, 'photo_url') !== '-' ? pickString(detail, 'photo_url') : result?.photo_url;
  const biocharStatus = pickString(detail, 'biochar_status', 'biochar_cycle_status');
  const nextDue = pickString(detail, 'biochar_next_due_date', 'next_biochar_due_date');
  const lastUpdate = pickString(detail, 'biochar_last_update_date', 'last_biochar_update_date');
  const isOverdue = detail?.biochar_is_overdue === true || biocharStatus === 'overdue';
  const mappingPending = detail?.farm_mapping_pending === true;

  const startBiocharActivity = () => {
    navigation.navigate('FieldOfficerBiocharProduction', {
      farmerId: resolvedFarmerId,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader title="Farmer Detail" subtitle="Profile, farms, and Biochar activity" />
        {loading ? <LoadingState message="Loading farmer..." /> : null}
        {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
        {!loading && !error ? (
          <>
            <AppCard title={farmerName} subtitle={`Mobile: ${mobile || 'No mobile'}`}>
              <View style={styles.photoWrap}>
                <OnboardingReviewPhoto file={draft.farmer_photo} remotePhotoUrl={photoUrl} />
              </View>
              <Text style={styles.line}>Farmer code: {resolvedFarmerId ? formatFarmerCode(resolvedFarmerId) : '-'}</Text>
              <Text style={styles.line}>Village: {String(detail?.village ?? result?.village ?? '-')}</Text>
              <Text style={styles.line}>Taluka: {String(detail?.taluka ?? result?.taluka ?? '-')}</Text>
              <Text style={styles.line}>District: {String(detail?.district ?? result?.district ?? '-')}</Text>
              <Text style={[styles.line, isOverdue && styles.overdue]}>
                Biochar status: {biocharStatus !== '-' ? biocharStatus : '—'}
              </Text>
              {lastUpdate !== '-' ? <Text style={styles.line}>Last Biochar update: {lastUpdate}</Text> : null}
              {nextDue !== '-' ? <Text style={styles.line}>Next due: {nextDue}</Text> : null}
              {mappingPending ? (
                <Text style={styles.warning}>Farm mapping is pending. Please complete mapping when possible.</Text>
              ) : null}
            </AppCard>

            <View style={styles.actions}>
              <AppButton label="Biochar Activity Awareness" onPress={() => navigation.navigate('BiocharAwareness', { farmerId: resolvedFarmerId })} />
              <AppButton label="Start Biochar Activity" onPress={startBiocharActivity} />
              <AppButton
                label="Add Biochar Mixing"
                variant="secondary"
                onPress={() => navigation.navigate('FieldOfficerBiocharMixing', { farmerId: resolvedFarmerId })}
              />
              <AppButton
                label="Biochar History"
                variant="secondary"
                onPress={() => navigation.navigate('FieldOfficerBiocharProductionList')}
              />
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20, gap: 16 },
  photoWrap: { alignItems: 'center', marginBottom: 8 },
  line: { fontSize: 14, color: colors.text, marginTop: 4 },
  overdue: { color: '#B91C1C', fontWeight: '700' },
  warning: { marginTop: 8, fontSize: 13, color: '#B45309' },
  actions: { gap: 10 },
});
