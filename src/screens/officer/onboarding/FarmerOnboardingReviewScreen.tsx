import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { createFarmerOnboarding, updateFieldOfficerFarmMapping } from '../../../api/fieldOfficerApi';
import { getApiErrorMessage } from '../../../api/authApi';
import { AppCard } from '../../../components/AppCard';
import { OnboardingReviewPhoto } from '../../../components/onboarding/OnboardingReviewPhoto';
import { ONBOARDING_NEXT_LABELS } from '../../../constants/onboardingSteps';
import { useOnboarding, type OnboardingResult } from '../../../context/OnboardingContext';
import type { FieldOfficerStackParamList } from '../../../navigation/types';
import { colors } from '../../../theme/colors';
import { boundaryPointsToLatLng, type AreaUnit } from '../../../utils/boundaryGeometry';
import { draftAlreadyHasFarmerFarm } from '../../../utils/ensureOnboardingFarmerFarm';
import { isValidEntityId, toPositiveEntityId } from '../../../utils/entityId';
import {
  compareDeclaredAndMapped,
  declaredAreaInAcres,
} from '../../../utils/landMappingHelpers';
import { calculateTurfBoundaryMetrics, polygonCentroid } from '../../../utils/manualBoundaryGeometry';
import { validateSubmit } from '../../../utils/onboardingValidation';
import { OnboardingFormScreen } from './OnboardingFormScreen';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList>;

type EditScreen =
  | 'FarmerBasicDetails'
  | 'FarmerConsent'
  | 'FarmerLandDetails'
  | 'FarmerGpsCapture'
  | 'FarmerProofUpload'
  | 'OnboardingBoundaryStart';

const OPTION_LABELS: Record<string, string> = {
  owned: 'Owned',
  leased: 'Leased',
  shared: 'Shared',
  government: 'Government',
  community: 'Community',
  other: 'Other',
  black_soil: 'Black Soil',
  red_soil: 'Red Soil',
  sandy_soil: 'Sandy Soil',
  clay_soil: 'Clay Soil',
  loamy_soil: 'Loamy Soil',
  alluvial_soil: 'Alluvial Soil',
  laterite_soil: 'Laterite Soil',
  mountain_soil: 'Mountain Soil',
  mixed_soil: 'Mixed Soil',
  rainfed: 'Rainfed',
  drip_irrigation: 'Drip Irrigation',
  sprinkler: 'Sprinkler',
  canal_irrigation: 'Canal Irrigation',
  borewell: 'Borewell',
  open_well: 'Open Well',
  river: 'River',
  tank: 'Tank',
  flood_irrigation: 'Flood Irrigation',
  lift_irrigation: 'Lift Irrigation',
};

function reviewMappingStatusLabel(status: string, hasBoundary: boolean): string {
  if (hasBoundary && (status === 'mapped' || status === 'pending_review')) {
    return 'Completed';
  }
  if (status === 'pending') {
    return 'Pending';
  }
  if (status === 'draft') {
    return 'Draft';
  }
  return 'Not Available';
}

export function FarmerOnboardingReviewScreen() {
  const navigation = useNavigation<Nav>();
  const { draft, toFormData, setResult, updateDraft } = useOnboarding();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const mappingCompleted =
    draft.boundary_points.length >= 3
    && (draft.boundary_mapping_status === 'mapped' || draft.boundary_mapping_status === 'pending_review');

  const landMappingSummary = useMemo(() => {
    const declaredValue = Number(String(draft.land_area).replace(/,/g, '').trim());
    const declaredUnit = (draft.land_area_unit as AreaUnit) || 'acre';
    const latLngPoints = boundaryPointsToLatLng(draft.boundary_points);
    const metrics =
      latLngPoints.length >= 3
        ? calculateTurfBoundaryMetrics(latLngPoints)
        : null;
    const declaredAcres =
      Number.isFinite(declaredValue) && declaredValue > 0
        ? declaredAreaInAcres(declaredValue, declaredUnit)
        : null;
    const comparison =
      metrics && declaredAcres != null && Number.isFinite(declaredValue)
        ? compareDeclaredAndMapped(declaredValue, declaredUnit, metrics)
        : null;
    const center =
      polygonCentroid(latLngPoints)
      ?? (latLngPoints[0] ?? null);

    return {
      declaredLabel:
        declaredAcres != null
          ? `${declaredAcres.toFixed(4)} acres`
          : draft.land_area.trim()
            ? `${draft.land_area} ${draft.land_area_unit || ''}`.trim()
            : '—',
      declaredOriginal:
        draft.land_area.trim() && declaredUnit !== 'acre'
          ? `${draft.land_area} ${declaredUnit}`
          : null,
      mappedLabel: metrics ? `${metrics.areaAcre.toFixed(4)} acres` : 'Not mapped yet',
      differenceLabel:
        comparison != null
          ? `${comparison.differenceAcre.toFixed(4)} acres (${comparison.differencePercent.toFixed(1)}%)`
          : null,
      statusLabel: reviewMappingStatusLabel(draft.boundary_mapping_status, draft.boundary_points.length >= 3),
      pointCount: draft.boundary_points.length,
      center,
      metrics,
    };
  }, [draft.boundary_mapping_status, draft.boundary_points, draft.land_area, draft.land_area_unit]);

  const openSavedMapping = () => {
    const farmerId = toPositiveEntityId(draft.farmer_id);
    const farmId = toPositiveEntityId(draft.farm_id);

    if (!isValidEntityId(farmerId) || !isValidEntityId(farmId)) {
      setError('Farmer and farm must be created before viewing saved mapping.');
      navigation.navigate('OnboardingBoundaryStart');
      return;
    }

    navigation.navigate('FarmBoundaryMap', {
      farmerId: farmerId!,
      farmId: farmId!,
      farmerName: draft.farmer_name || 'Farmer',
      farmerCode: draft.farmer_code || undefined,
      farmName: draft.farm_name || undefined,
      farmCode: draft.farm_code || undefined,
      village: draft.village_name || undefined,
      mappingStatus: mappingCompleted ? 'completed' : 'pending',
      declaredArea: draft.land_area || undefined,
      declaredAreaUnit: (draft.land_area_unit as 'acre' | 'hectare' | 'bigha') || undefined,
      returnScreen: 'OnboardingBoundaryStart',
    });
  };

  const submit = async () => {
    const validationError = validateSubmit(draft);

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let farmerId = toPositiveEntityId(draft.farmer_id);
      let farmId = toPositiveEntityId(draft.farm_id);
      let farmerName = draft.farmer_name;
      let mobile = draft.mobile;
      let village = draft.village_name;
      let taluka = draft.taluka_name;
      let district = draft.district_name;
      let state = draft.state;
      let photoUrl: string | undefined;
      let onboardedAt: string | undefined;
      let landSurvey = draft.land_survey_number;
      let landArea: string | number = draft.land_area;
      let landAreaUnit = draft.land_area_unit;

      if (draftAlreadyHasFarmerFarm(draft) && farmerId != null && farmId != null) {
        // Farmer/farm already created during mapping gate. Mapping-only refresh here;
        // whole onboarding is not re-marked complete by the mapping API.
        if (mappingCompleted) {
          const center =
            landMappingSummary.center
            ?? {
              latitude: Number(draft.gps_latitude),
              longitude: Number(draft.gps_longitude),
            };
          await updateFieldOfficerFarmMapping(farmerId, farmId, {
            farm_id: farmId,
            declared_area: draft.land_area,
            declared_unit: draft.land_area_unit,
            unit: draft.boundary_unit,
            capture_method: draft.boundary_capture_method,
            mapping_status: 'mapped',
            verification_status: draft.boundary_verification_status || 'pending_review',
            boundary_points: draft.boundary_points,
            center_latitude: Number.isFinite(center.latitude) ? center.latitude : draft.boundary_points[0]?.latitude,
            center_longitude: Number.isFinite(center.longitude) ? center.longitude : draft.boundary_points[0]?.longitude,
            gps_accuracy_average: draft.gps_accuracy ? Number(draft.gps_accuracy) : undefined,
          });
        }
      } else {
        const farmer = await createFarmerOnboarding(toFormData());
        farmerId = toPositiveEntityId(farmer.farmer_id);
        farmId = toPositiveEntityId(farmer.farm_id);
        farmerName = String(farmer.farmer_name ?? draft.farmer_name);
        mobile = String(farmer.mobile ?? draft.mobile);
        village = farmer.village ? String(farmer.village) : draft.village_name;
        taluka = farmer.taluka ? String(farmer.taluka) : draft.taluka_name;
        district = farmer.district ? String(farmer.district) : draft.district_name;
        state = farmer.state ? String(farmer.state) : draft.state;
        onboardedAt = farmer.onboarded_at ? String(farmer.onboarded_at) : undefined;
        photoUrl = farmer.photo_url ? String(farmer.photo_url) : undefined;
        landSurvey = farmer.land_survey_number ? String(farmer.land_survey_number) : draft.land_survey_number;
        landArea = farmer.land_area != null ? String(farmer.land_area) : draft.land_area;
        landAreaUnit = farmer.land_area_unit ? String(farmer.land_area_unit) : draft.land_area_unit;

        if (!isValidEntityId(farmerId)) {
          throw new Error('Onboarding succeeded but farmer ID was missing.');
        }

        updateDraft({
          farmer_id: farmerId,
          farm_id: farmId,
          farmer_code: farmer.farmer_code ? String(farmer.farmer_code) : '',
          farm_code: farmer.farm_code ? String(farmer.farm_code) : '',
        });
      }

      const result: OnboardingResult = {
        farmer_id: farmerId!,
        farmer_name: farmerName,
        mobile,
        village,
        taluka,
        district,
        state,
        onboarded_at: onboardedAt,
        photo_url: photoUrl,
        farm_id: farmId ?? undefined,
        land_survey_number: landSurvey,
        land_area: landArea,
        land_area_unit: landAreaUnit,
      };
      setResult(result);
      navigation.navigate('FarmerOnboardingSuccess');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Onboarding failed. Check required fields and try again.'));
    } finally {
      setLoading(false);
    }
  };

  const edit = (screen: EditScreen) => {
    navigation.navigate(screen);
  };

  return (
    <OnboardingFormScreen
      stepCurrent={6}
      title="Final Review & Submit"
      subtitle="Confirm all farmer details before submitting the registration."
      onNext={submit}
      nextLabel={ONBOARDING_NEXT_LABELS[6] ?? 'Submit Registration'}
      nextLoading={loading}
      footerError={error}
    >
      <ReviewSection title="Farmer profile" onEdit={() => edit('FarmerBasicDetails')}>
        <OnboardingReviewPhoto file={draft.farmer_photo} />
        <Line label="Name" value={draft.farmer_name} />
        <Line label="Mobile" value={draft.mobile} />
        <Line label="Language" value={draft.preferred_language} />
        <Line label="State" value={draft.state} />
        <Line label="District" value={draft.district_name} />
        <Line label="Taluka" value={draft.taluka_name} />
        <Line label="Village" value={draft.village_name} />
        <Line label="Pincode" value={draft.pincode} />
        {draftAlreadyHasFarmerFarm(draft) ? (
          <>
            <Line label="Farmer ID" value={String(draft.farmer_id)} />
            <Line label="Farm ID" value={draft.farm_code || String(draft.farm_id)} />
          </>
        ) : null}
      </ReviewSection>
      <ReviewSection title="Consent" onEdit={() => edit('FarmerConsent')}>
        <Line label="Data usage" value={draft.data_usage_consent ? 'Accepted' : 'Pending'} />
        <Line label="Carbon rights" value={draft.carbon_rights_consent ? 'Accepted' : 'Pending'} />
        <Line label="Participation" value={draft.project_participation_consent ? 'Accepted' : 'Pending'} />
        <Line label="Signature confirmed" value={draft.farmer_signature_confirmed ? 'Yes' : 'No'} />
        <Line label="Consent form" value={draft.consent_form?.name} />
      </ReviewSection>
      <ReviewSection title="Land details" onEdit={() => edit('FarmerLandDetails')}>
        <Line label="Survey no." value={draft.land_survey_number} />
        <Line label="Area" value={`${draft.land_area} ${draft.land_area_unit}`} />
        <Line label="Ownership" value={OPTION_LABELS[draft.ownership_type] ?? draft.ownership_type} />
        <Line label="Crop" value={draft.crop_type} />
        <Line label="Irrigation" value={OPTION_LABELS[draft.irrigation_type] ?? draft.irrigation_type} />
        <Line label="Soil" value={OPTION_LABELS[draft.soil_type] ?? draft.soil_type} />
        <Line label="Farming practice" value={draft.existing_farming_practice} />
        <Line label="Project interest" value={draft.project_interest.join(', ')} />
        <Line label="Service interest" value={draft.service_interests.join(', ')} />
        <Line label="Remarks" value={draft.remarks} />
      </ReviewSection>

      <View style={styles.mappingCard}>
        <Text style={styles.mappingTitle}>Land & Mapping Summary</Text>
        <Line label="Declared Area" value={landMappingSummary.declaredLabel} />
        {landMappingSummary.declaredOriginal ? (
          <Line label="Declared (entered)" value={landMappingSummary.declaredOriginal} />
        ) : null}
        <Line label="Mapped Area" value={landMappingSummary.mappedLabel} />
        {landMappingSummary.differenceLabel ? (
          <Line label="Difference" value={landMappingSummary.differenceLabel} />
        ) : null}
        <Line label="Mapping Status" value={landMappingSummary.statusLabel} />
        <Line
          label="Boundary Points"
          value={
            landMappingSummary.pointCount > 0
              ? `${landMappingSummary.pointCount} point${landMappingSummary.pointCount === 1 ? '' : 's'}`
              : 'None'
          }
        />
        {!mappingCompleted ? (
          <Text style={styles.mappingNote}>
            {draft.boundary_mapping_status === 'pending'
              ? 'Mapping Pending — can be completed later from Farm Mapping.'
              : 'Not mapped yet. Start Map Land Boundary if required.'}
          </Text>
        ) : null}
        {mappingCompleted ? (
          <Pressable style={styles.viewMapButton} onPress={openSavedMapping}>
            <Text style={styles.viewMapButtonText}>View Saved Mapping</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={() => edit('OnboardingBoundaryStart')}>
          <Text style={styles.edit}>{mappingCompleted ? 'Edit land mapping' : 'Start / continue land mapping'}</Text>
        </Pressable>
      </View>

      <ReviewSection title="GPS" onEdit={() => edit('FarmerGpsCapture')}>
        <Line
          label="Coordinates"
          value={
            draft.gps_latitude && draft.gps_longitude
              ? `${draft.gps_latitude}, ${draft.gps_longitude}`
              : landMappingSummary.center
                ? `${landMappingSummary.center.latitude.toFixed(7)}, ${landMappingSummary.center.longitude.toFixed(7)}`
                : undefined
          }
        />
        <Line label="Accuracy" value={draft.gps_accuracy ? `${draft.gps_accuracy} m` : undefined} />
        <Line label="Captured at" value={draft.gps_captured_at} />
      </ReviewSection>
      <ReviewSection title="Documents" onEdit={() => edit('FarmerProofUpload')}>
        <Line label="Land proof" value={draft.proof_of_land_ownership?.name} />
        <Line label="Consent" value={draft.consent_form?.name} />
      </ReviewSection>
    </OnboardingFormScreen>
  );
}

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <AppCard
      title={title}
      footer={
        <Pressable onPress={onEdit}>
          <Text style={styles.edit}>Edit {title.toLowerCase()}</Text>
        </Pressable>
      }
    >
      {children}
    </AppCard>
  );
}

function Line({ label, value }: { label: string; value?: string }) {
  return (
    <Text style={styles.line}>
      {label}: {value?.trim() ? value : '-'}
    </Text>
  );
}

const styles = StyleSheet.create({
  line: { fontSize: 14, color: colors.text, marginTop: 4 },
  edit: { color: colors.primary, fontWeight: '700', marginTop: 8 },
  mappingCard: {
    backgroundColor: '#F0F9F3',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 58, 0.18)',
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 4,
    gap: 2,
  },
  mappingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0B6B3A',
    marginBottom: 6,
  },
  mappingNote: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#5F6B63',
    lineHeight: 18,
  },
  viewMapButton: {
    marginTop: 12,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#0B6B3A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  viewMapButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
