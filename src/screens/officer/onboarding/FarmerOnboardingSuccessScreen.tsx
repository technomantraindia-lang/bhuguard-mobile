import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '../../../components/AppButton';
import { AppCard } from '../../../components/AppCard';
import { OnboardingReviewPhoto } from '../../../components/onboarding/OnboardingReviewPhoto';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { StatusBadge } from '../../../components/StatusBadge';
import { useOnboarding } from '../../../context/OnboardingContext';
import { resetToOnboardingHome } from '../../../navigation/continueFarmerOnboarding';
import type { FieldOfficerStackParamList } from '../../../navigation/types';
import { colors } from '../../../theme/colors';
import { beginAddNewFarmWithMapping } from '../../../utils/beginAddNewFarmFlow';
import { getApiErrorMessage } from '../../../api/authApi';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList>;

function formatDate(iso?: string): string {
  if (!iso) {
    return new Date().toLocaleString();
  }

  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function FarmerOnboardingSuccessScreen() {
  const navigation = useNavigation<Nav>();
  const { result, draft, updateDraft, resetDraft } = useOnboarding();

  const farmerName = result?.farmer_name ?? 'Farmer';
  const mobile = result?.mobile ?? '-';
  const farmerCode = draft.farmer_display_id || draft.farmer_code || '—';
  const createdAt = formatDate(result?.onboarded_at);
  const routeNames = (navigation.getState()?.routeNames ?? []) as string[];
  const isArtisanStack = routeNames.includes('ArtisanDashboard');

  const goDashboard = () => {
    resetDraft();
    resetToOnboardingHome(navigation);
  };

  const onboardAnother = () => {
    resetDraft();
    navigation.navigate('FarmerBasicDetails');
  };

  const viewFarmer = () => {
    navigation.navigate('OnboardedFarmerView');
  };

  const addNewFarm = () => {
    void (async () => {
      try {
        await beginAddNewFarmWithMapping({
          draft,
          updateDraft,
          navigation,
          farmerId: result?.farmer_id ?? draft.farmer_id,
          farmerName,
          farmCountHint: draft.farm_id ? 1 : 0,
        });
      } catch (err) {
        Alert.alert(
          'Unable to add farm',
          getApiErrorMessage(err, 'Could not start Add New Farm. Please try again.'),
        );
      }
    })();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader title="Farmer onboarded" subtitle="Registration completed successfully" showBack={false} />
        <View style={styles.successBanner}>
          <StatusBadge label="Success" tone="success" />
          <Text style={styles.successTitle}>Farmer onboarded successfully</Text>
          <Text style={styles.successText}>The farmer account is now active in Bhuguard.</Text>
        </View>
        <AppCard title={farmerName} subtitle={`Mobile: ${mobile}`}>
          <View style={styles.photoWrap}>
            <OnboardingReviewPhoto
              file={draft.farmer_photo}
              remotePhotoUrl={result?.photo_url}
              label="Profile photo"
            />
          </View>
          <Text style={styles.line}>Farmer ID: {farmerCode}</Text>
          {draft.farm_name ? <Text style={styles.line}>Farm: {draft.farm_name}</Text> : null}
          <Text style={styles.line}>Created: {createdAt}</Text>
          {result?.village ? <Text style={styles.line}>Village: {result.village}</Text> : null}
          {result?.district ? <Text style={styles.line}>District: {result.district}</Text> : null}
          {result?.land_survey_number ? (
            <Text style={styles.line}>
              Survey: {result.land_survey_number} · {result.land_area} {result.land_area_unit}
            </Text>
          ) : null}
        </AppCard>
        <AppButton label="View farmer" onPress={viewFarmer} />
        <AppButton
          label="Edit Farmer Profile"
          variant="secondary"
          onPress={() => navigation.navigate('FarmerBasicDetails')}
        />
        <AppButton
          label="Add New Farm with Mapping"
          variant="secondary"
          onPress={addNewFarm}
        />
        <AppButton label="Onboard another farmer" onPress={onboardAnother} variant="secondary" />
        <AppButton
          label={isArtisanStack ? 'Back to Artisan Pro dashboard' : 'Back to field officer dashboard'}
          onPress={goDashboard}
          variant="secondary"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20, gap: 16, paddingBottom: 32 },
  successBanner: {
    backgroundColor: colors.ecoLight,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.eco,
  },
  successTitle: { fontSize: 18, fontWeight: '700', color: colors.eco },
  successText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  photoWrap: { alignItems: 'center', marginBottom: 4 },
  line: { fontSize: 14, color: colors.text, marginTop: 4 },
});
