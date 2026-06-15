import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AddressSelector } from '../../../components/AddressSelector';
import { useOnboarding } from '../../../context/OnboardingContext';
import type { FieldOfficerStackParamList } from '../../../navigation/types';
import { colors } from '../../../theme/colors';
import { validateAddress } from '../../../utils/onboardingValidation';
import { FormField, OnboardingFormScreen } from './OnboardingFormScreen';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList>;

export function FarmerAddressScreen() {
  const navigation = useNavigation<Nav>();
  const { draft, updateDraft } = useOnboarding();
  const [error, setError] = useState<string | null>(null);

  const next = () => {
    const validationError = validateAddress(draft);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    navigation.navigate('FarmerLandDetails');
  };

  return (
    <OnboardingFormScreen
      stepCurrent={1}
      title="Address"
      subtitle="Gujarat location details for the farmer."
      onNext={next}
    >
      <AddressSelector
        value={{
          state: draft.state,
          district_id: draft.district_id,
          district_name: draft.district_name,
          taluka_id: draft.taluka_id,
          taluka_name: draft.taluka_name,
          village_id: draft.village_id,
          village_name: draft.village_name,
        }}
        onChange={(patch) => updateDraft(patch)}
        requireDistrict
        requireTaluka
        requireVillage
      />
      <FormField
        label="Pincode"
        value={draft.pincode}
        onChangeText={(v) => updateDraft({ pincode: v.replace(/\D/g, '').slice(0, 6) })}
        placeholder="6-digit pincode"
        keyboardType="numeric"
      />
      <FormField
        label="Address line"
        value={draft.address_line}
        onChangeText={(v) => updateDraft({ address_line: v })}
        placeholder="House / street / landmark"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </OnboardingFormScreen>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.error, fontSize: 14 },
});
