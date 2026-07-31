import { useMemo, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AssignedOnboardingAddressFields } from '../../../components/onboarding/AssignedOnboardingAddressFields';
import { NoAssignmentState } from '../../../components/location/NoAssignmentState';
import { OnboardingSectionCard, OnboardingStepShell } from '../../../components/onboarding/OnboardingStepShell';
import { ONBOARDING_NEXT_LABELS } from '../../../constants/onboardingSteps';
import { useAssignedLocations } from '../../../hooks/useAssignedLocations';
import { useOnboarding } from '../../../context/OnboardingContext';
import type { FieldOfficerStackParamList } from '../../../navigation/types';
import { validateAddress } from '../../../utils/onboardingValidation';
import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList>;

export function FarmerGpsCaptureScreen() {
  const navigation = useNavigation<Nav>();
  const { draft, updateDraft } = useOnboarding();
  const [error, setError] = useState<string | null>(null);
  // `auto` uses Artisan Pro Admin allocations when logged in as artisan,
  // so FO-link is not required just to load Location Data.
  const assigned = useAssignedLocations('auto');

  const areaSummary = useMemo(() => {
    const villages = assigned.locations?.villages ?? [];
    const talukas = assigned.locations?.talukas ?? [];
    const districts = assigned.locations?.districts ?? [];

    if (villages.length > 0) {
      return `${villages.length} village${villages.length === 1 ? '' : 's'}: ${villages
        .slice(0, 3)
        .map((item) => item.name)
        .filter(Boolean)
        .join(', ')}`;
    }

    if (talukas.length > 0) {
      return `${talukas.length} taluka${talukas.length === 1 ? '' : 's'}`;
    }

    if (districts.length > 0) {
      return `${districts.length} district${districts.length === 1 ? '' : 's'}`;
    }

    return null;
  }, [assigned.locations]);

  const next = () => {
    if (!assigned.hasAssignment) {
      setError('No assigned working area found. Please ask Admin to assign villages.');
      return;
    }

    const validationError = validateAddress(draft);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    navigation.navigate('FarmerConsent');
  };

  return (
    <OnboardingStepShell
      stepCurrent={2}
      title="Location Data"
      subtitle="Select the farmer working area and address details."
      onNext={next}
      nextLabel={ONBOARDING_NEXT_LABELS[2]}
      footerError={error}
    >
      <OnboardingSectionCard title="Address">
        {assigned.hasAssignment && areaSummary ? (
          <View style={styles.areaBanner}>
            <Text style={styles.areaTitle}>Assigned Area</Text>
            <Text style={styles.areaText}>{areaSummary}</Text>
          </View>
        ) : null}

        {assigned.error && !assigned.hasAssignment ? (
          <NoAssignmentState
            message={assigned.error}
            onRefresh={assigned.refresh}
            refreshing={assigned.loading}
          />
        ) : !assigned.hasAssignment && !assigned.loading ? (
          <NoAssignmentState
            message="No assigned working area found. Please ask Admin to assign villages."
            onRefresh={assigned.refresh}
            refreshing={assigned.loading}
          />
        ) : (
          <AssignedOnboardingAddressFields
            value={{
              state: draft.state,
              district_id: draft.district_id,
              district_name: draft.district_name,
              taluka_id: draft.taluka_id,
              taluka_name: draft.taluka_name,
              village_id: draft.village_id,
              village_name: draft.village_name,
              pincode: draft.pincode,
            }}
            onChange={(patch) => updateDraft(patch)}
            locations={assigned.locations}
            loading={assigned.loading}
            disabled={!assigned.hasAssignment}
          />
        )}
      </OnboardingSectionCard>
    </OnboardingStepShell>
  );
}

const styles = StyleSheet.create({
  areaBanner: {
    marginBottom: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
    padding: 12,
    gap: 4,
  },
  areaTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: dashboardTheme.primary,
  },
  areaText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#166534',
  },
  areaMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#3F6212',
  },
});
