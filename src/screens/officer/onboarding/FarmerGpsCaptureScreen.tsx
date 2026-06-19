import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { LandBoundaryVerificationSection } from '../../../components/shared/LandBoundaryVerificationSection';
import { AppButton } from '../../../components/AppButton';
import { AppCard } from '../../../components/AppCard';
import { StatusBadge } from '../../../components/StatusBadge';
import { useOnboarding } from '../../../context/OnboardingContext';
import type { FieldOfficerStackParamList } from '../../../navigation/types';
import { colors } from '../../../theme/colors';
import type { AreaUnit } from '../../../utils/boundaryGeometry';
import { mappedAreaLabelForDraft } from '../../../utils/onboardingBoundary';
import { validateBoundaryMapping } from '../../../utils/onboardingValidation';
import { OnboardingFormScreen } from './OnboardingFormScreen';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList>;

export function FarmerGpsCaptureScreen() {
  const navigation = useNavigation<Nav>();
  const { draft } = useOnboarding();
  const [error, setError] = useState<string | null>(null);

  const mapped = draft.boundary_mapping_status === 'mapped' || draft.boundary_mapping_status === 'pending_review';
  const mappedLabel = mappedAreaLabelForDraft(draft);

  const next = () => {
    const validationError = validateBoundaryMapping(draft);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    navigation.navigate('FarmerProofUpload');
  };

  return (
    <OnboardingFormScreen
      stepCurrent={4}
      title="Mobile Land Mapping"
      subtitle="Verify actual land size with GPS boundary mapping."
      onNext={next}
      nextDisabled={!mapped}
    >
      <AppCard title="Land mapping status" subtitle="Boundary mapping is required before documents upload.">
        <View style={styles.badgeRow}>
          <StatusBadge
            label={mapped ? 'Mapped' : draft.boundary_mapping_status === 'draft' ? 'Draft' : 'Pending'}
            tone={mapped ? 'success' : 'warning'}
          />
        </View>
        {mappedLabel ? <Text style={styles.line}>Mapped area: {mappedLabel}</Text> : null}
        <Text style={styles.line}>Captured points: {draft.boundary_points.length}</Text>
        <Text style={styles.line}>
          Center GPS: {draft.gps_latitude || '-'}, {draft.gps_longitude || '-'}
        </Text>
      </AppCard>

      <LandBoundaryVerificationSection
        declaredArea={draft.land_area}
        declaredUnit={(draft.land_area_unit as AreaUnit) || 'acre'}
        surveyNumber={draft.land_survey_number}
        village={draft.village_name}
        taluka={draft.taluka_name}
        district={draft.district_name}
        state={draft.state}
        mappingStatus={draft.boundary_mapping_status}
        mappedAreaLabel={mappedLabel ?? undefined}
        onStartMapping={() => navigation.navigate('OnboardingBoundaryStart')}
        error={error}
      />

      <AppButton
        label={mapped ? 'Review mapped boundary' : 'Start Mobile Mapping'}
        onPress={() => navigation.navigate(mapped ? 'OnboardingBoundaryPreview' : 'OnboardingBoundaryStart')}
      />
    </OnboardingFormScreen>
  );
}

const styles = StyleSheet.create({
  badgeRow: { marginBottom: 4 },
  line: { fontSize: 14, color: colors.text, marginTop: 4 },
});
