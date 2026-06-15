import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { getFieldOfficerFarmerDetail } from '../../../api/fieldOfficerApi';
import { getApiErrorMessage } from '../../../api/authApi';
import { AppCard } from '../../../components/AppCard';
import { ErrorState } from '../../../components/ErrorState';
import { LoadingState } from '../../../components/LoadingState';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { useOnboarding } from '../../../context/OnboardingContext';
import { colors } from '../../../theme/colors';
import { formatFarmerCode } from '../../../utils/onboardingNotes';

export function OnboardedFarmerViewScreen() {
  const navigation = useNavigation();
  const { result } = useOnboarding();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!result?.farmer_id) {
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getFieldOfficerFarmerDetail(result.farmer_id);
        setDetail((data.farmer as Record<string, unknown>) ?? null);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load farmer details.'));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [result?.farmer_id]);

  const farmerName = String(detail?.name ?? result?.farmer_name ?? '-');
  const mobile = String(detail?.mobile ?? result?.mobile ?? '-');
  const farmerId = Number(detail?.farmer_id ?? result?.farmer_id ?? 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader title="Farmer profile" subtitle="Onboarded farmer details" />
        {loading ? <LoadingState message="Loading farmer..." /> : null}
        {error ? <ErrorState message={error} onRetry={() => navigation.goBack()} /> : null}
        {!loading && !error ? (
          <AppCard title={farmerName} subtitle={`Mobile: ${mobile}`}>
            <Text style={styles.line}>Farmer code: {farmerId ? formatFarmerCode(farmerId) : '-'}</Text>
            <Text style={styles.line}>Village: {String(detail?.village ?? result?.village ?? '-')}</Text>
            <Text style={styles.line}>Taluka: {String(detail?.taluka ?? result?.taluka ?? '-')}</Text>
            <Text style={styles.line}>District: {String(detail?.district ?? result?.district ?? '-')}</Text>
            <Text style={styles.line}>State: {String(detail?.state ?? result?.state ?? '-')}</Text>
            <Text style={styles.line}>Status: {String(detail?.onboarding_status ?? 'onboarded')}</Text>
            <Text style={styles.line}>Farms: {String(detail?.farm_count ?? '1')}</Text>
            <Text style={styles.line}>Created: {String(detail?.created_at ?? result?.onboarded_at ?? '-')}</Text>
          </AppCard>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20, gap: 16 },
  line: { fontSize: 14, color: colors.text, marginTop: 4 },
});
