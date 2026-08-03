import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { extractList, pickString, type ApiRecord } from '../../../utils/apiHelpers';
import { beginAddNewFarmWithMapping } from '../../../utils/beginAddNewFarmFlow';
import { formatFarmerDisplayId } from '../../../utils/displayIds';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList, 'OnboardedFarmerView'>;
type ScreenRoute = RouteProp<FieldOfficerStackParamList, 'OnboardedFarmerView'>;

function resolvePrimaryFarm(detail: ApiRecord | null): ApiRecord | null {
  const farms = extractList(detail ?? {}, ['farms']);
  if (farms.length === 0) {
    return null;
  }

  return farms[0] ?? null;
}

export function OnboardedFarmerViewScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();
  const { result, draft, updateDraft } = useOnboarding();
  const [loading, setLoading] = useState(false);
  const [addingFarm, setAddingFarm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<ApiRecord | null>(null);

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
      setDetail((data.farmer as ApiRecord) ?? null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load farmer details.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [resolvedFarmerId]);

  const primaryFarm = useMemo(() => resolvePrimaryFarm(detail), [detail]);

  const farmerName = String(detail?.name ?? result?.farmer_name ?? '-');
  const farmerCode = pickString(detail, 'farmer_code', 'farmerCode');
  const mobile = String(detail?.mobile ?? result?.mobile ?? '-');
  const photoUrl = pickString(detail, 'photo_url') !== '-' ? pickString(detail, 'photo_url') : result?.photo_url;
  const mappingStatus = pickString(primaryFarm, 'boundary_status') !== '-'
    ? pickString(primaryFarm, 'boundary_status')
    : pickString(detail, 'mapping_status');
  const mappingCompleted =
    mappingStatus === 'mapped'
    || Boolean(primaryFarm?.boundary_mapped)
    || Number(primaryFarm?.boundary_point_count ?? 0) >= 3;
  const mappingPending = !mappingCompleted;

  const declaredAreaLabel = useMemo(() => {
    if (!primaryFarm) {
      return '—';
    }
    const area = pickString(primaryFarm, 'land_area', 'area_acres');
    const unit = pickString(primaryFarm, 'land_area_unit');
    if (area === '-') {
      return '—';
    }
    return unit !== '-' ? `${area} ${unit}` : area;
  }, [primaryFarm]);

  const mappedAreaLabel = useMemo(() => {
    if (!primaryFarm) {
      return '—';
    }
    const acres = primaryFarm.area_acres ?? primaryFarm.mapped_area_acres;
    if (acres != null && acres !== '' && Number.isFinite(Number(acres))) {
      return `${Number(acres).toFixed(4)} acres`;
    }
    return mappingCompleted ? 'See map for calculated area' : 'Not mapped yet';
  }, [mappingCompleted, primaryFarm]);

  const boundaryPointCount = Number(primaryFarm?.boundary_point_count ?? 0);

  const farmerDisplayId = useMemo(
    () =>
      formatFarmerDisplayId({
        farmer_display_id: pickString(detail, 'farmer_display_id', 'farmerDisplayId') !== '-'
          ? pickString(detail, 'farmer_display_id', 'farmerDisplayId')
          : undefined,
        farmer_code: farmerCode !== '-' ? farmerCode : undefined,
      }),
    [detail, farmerCode],
  );

  const farmContext = useMemo(() => {
    const farmId = Number(primaryFarm?.id ?? 0) || undefined;
    return {
      farmerId: resolvedFarmerId,
      farmerCode: farmerCode !== '-' ? farmerCode : undefined,
      farmerName: farmerName !== '-' ? farmerName : undefined,
      farmId,
      farmCode: primaryFarm ? pickString(primaryFarm, 'farm_code', 'farmCode') : undefined,
      farmName: primaryFarm ? pickString(primaryFarm, 'farm_name', 'farmName') : undefined,
      village: String(detail?.village ?? primaryFarm?.village ?? result?.village ?? '') || undefined,
      taluka: String(detail?.taluka ?? primaryFarm?.taluka ?? result?.taluka ?? '') || undefined,
      district: String(detail?.district ?? primaryFarm?.district ?? result?.district ?? '') || undefined,
      state: String(detail?.state ?? primaryFarm?.state ?? '') || undefined,
    };
  }, [detail, farmerCode, farmerName, primaryFarm, resolvedFarmerId, result?.district, result?.taluka, result?.village]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader title="Farmer Detail" subtitle="Profile and farm actions" />
        {loading ? <LoadingState message="Loading farmer..." /> : null}
        {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
        {!loading && !error ? (
          <>
            <AppCard title={farmerName} subtitle={`Mobile: ${mobile || 'No mobile'}`}>
              <View style={styles.photoWrap}>
                <OnboardingReviewPhoto file={draft.farmer_photo} remotePhotoUrl={photoUrl} />
              </View>
              <Text style={styles.line}>Farmer ID: {farmerDisplayId}</Text>
              {farmContext.farmId ? (
                <>
                  <Text style={styles.line}>Farm: {farmContext.farmName && farmContext.farmName !== '-' ? farmContext.farmName : '—'}</Text>
                  <Text style={styles.line}>
                    Farm ID: {farmContext.farmCode && farmContext.farmCode !== '-' ? farmContext.farmCode : farmContext.farmId}
                  </Text>
                </>
              ) : null}
              <Text style={styles.line}>Village: {String(detail?.village ?? result?.village ?? '—')}</Text>
              <Text style={styles.line}>Taluka: {String(detail?.taluka ?? result?.taluka ?? '—')}</Text>
              <Text style={styles.line}>District: {String(detail?.district ?? result?.district ?? '—')}</Text>
              <Text style={styles.line}>
                Mapping Status: {mappingCompleted ? 'Completed' : mappingPending ? 'Mapping Pending' : 'Not mapped yet'}
              </Text>
              <Text style={styles.line}>Declared Area: {declaredAreaLabel}</Text>
              <Text style={styles.line}>Mapped Area: {mappedAreaLabel}</Text>
              <Text style={styles.line}>
                Boundary Points: {boundaryPointCount > 0 ? String(boundaryPointCount) : mappingCompleted ? '—' : 'None'}
              </Text>
            </AppCard>

            <View style={styles.actions}>
              {farmContext.farmId && mappingCompleted ? (
                <AppButton
                  label="View Saved Mapping"
                  onPress={() =>
                    navigation.navigate('FarmBoundaryView', {
                      farmerId: farmContext.farmerId,
                      farmId: farmContext.farmId!,
                      farmerName: farmContext.farmerName || 'Farmer',
                      farmerCode: farmContext.farmerCode,
                      farmName: farmContext.farmName !== '-' ? farmContext.farmName : undefined,
                      farmCode: farmContext.farmCode !== '-' ? farmContext.farmCode : undefined,
                      village: farmContext.village,
                      declaredArea: primaryFarm ? String(primaryFarm.land_area ?? '') : undefined,
                      declaredAreaUnit: primaryFarm?.land_area_unit as 'acre' | 'hectare' | 'bigha' | undefined,
                    })
                  }
                />
              ) : null}
              <AppButton label="Biochar Awareness" onPress={() => navigation.navigate('BiocharAwareness', { farmerId: resolvedFarmerId })} />
              <AppButton
                label="Farm Activity"
                onPress={() =>
                  navigation.navigate('FieldOfficerFarmActivityStart', {
                    farmerId: resolvedFarmerId || farmContext.farmerId,
                    farmId: farmContext.farmId,
                    farmCode: farmContext.farmCode !== '-' ? farmContext.farmCode : undefined,
                    farmerCode: farmContext.farmerCode,
                    farmerName: farmContext.farmerName,
                  })
                }
              />
              <AppButton
                label="Biochar Mixing"
                variant="secondary"
                onPress={() =>
                  navigation.navigate('FieldOfficerBiocharMixing', {
                    farmerId: farmContext.farmerId,
                    farmId: farmContext.farmId,
                    farmCode: farmContext.farmCode !== '-' ? farmContext.farmCode : undefined,
                    farmLabel: farmContext.farmName !== '-' ? farmContext.farmName : undefined,
                    farmerCode: farmContext.farmerCode,
                    farmerName: farmContext.farmerName,
                    village: farmContext.village,
                    taluka: farmContext.taluka,
                    district: farmContext.district,
                    state: farmContext.state,
                  })
                }
              />
              <AppButton
                label="Biochar Application"
                onPress={() => navigation.navigate('FieldOfficerBiocharApplication', farmContext)}
              />
              {draft.farmer_id && resolvedFarmerId && draft.farmer_id === resolvedFarmerId ? (
                <AppButton
                  label="Edit Farmer Profile"
                  variant="secondary"
                  onPress={() => navigation.navigate('FarmerBasicDetails')}
                />
              ) : null}
              <AppButton
                label="Add New Farm with Mapping"
                variant="secondary"
                disabled={addingFarm || !resolvedFarmerId}
                onPress={() => {
                  void (async () => {
                    if (!resolvedFarmerId || addingFarm) {
                      return;
                    }
                    setAddingFarm(true);
                    try {
                      const farms = extractList(detail ?? {}, ['farms']);
                      await beginAddNewFarmWithMapping({
                        draft,
                        updateDraft,
                        navigation,
                        farmerId: resolvedFarmerId,
                        farmerName,
                        farmCountHint: farms.length,
                      });
                    } catch (err) {
                      Alert.alert(
                        'Unable to add farm',
                        getApiErrorMessage(err, 'Could not start Add New Farm. Please try again.'),
                      );
                    } finally {
                      setAddingFarm(false);
                    }
                  })();
                }}
              />
              {farmContext.farmId && mappingPending ? (
                <AppButton
                  label="Complete Farm Mapping"
                  variant="secondary"
                  onPress={() =>
                    navigation.navigate('OnboardingBoundaryStart', {
                      farmerId: farmContext.farmerId,
                      farmId: farmContext.farmId,
                      farmerName: farmContext.farmerName,
                      farmerCode: farmContext.farmerCode,
                      farmName: farmContext.farmName !== '-' ? farmContext.farmName : undefined,
                      farmCode: farmContext.farmCode !== '-' ? farmContext.farmCode : undefined,
                      village: farmContext.village,
                      landArea: primaryFarm ? String(primaryFarm.land_area ?? '') : undefined,
                      landAreaUnit: primaryFarm?.land_area_unit as 'acre' | 'hectare' | 'bigha' | undefined,
                    })
                  }
                />
              ) : null}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: 16, gap: 16, paddingBottom: 40 },
  photoWrap: { marginBottom: 8 },
  line: { color: colors.textMuted, marginTop: 4, fontSize: 14 },
  actions: { gap: 10 },
});
