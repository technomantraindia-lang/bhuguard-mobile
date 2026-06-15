import { useState } from 'react';
import { SafeAreaView, StyleSheet, Switch, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../../api/authApi';
import { submitChecklist } from '../../api/fieldOfficerApi';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { ScreenHeader } from '../../components/ScreenHeader';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'VerificationChecklist'>;

const CHECKS = [
  { key: 'farmer_present', label: 'Farmer present at site' },
  { key: 'documents_verified', label: 'Documents verified' },
  { key: 'field_conditions_verified', label: 'Field conditions verified' },
] as const;

export function VerificationChecklistScreen({ route, navigation }: Props) {
  const { assignmentId } = route.params;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, boolean>>({
    farmer_present: false,
    documents_verified: false,
    field_conditions_verified: false,
  });

  const submit = async () => {
    setLoading(true);
    setError(null);

    try {
      await submitChecklist(assignmentId, values);
      navigation.navigate('VisitEvidenceUpload', { assignmentId });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Checklist submit failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Verification Checklist" subtitle={`Assignment #${assignmentId}`} />
      <AppCard title="Checklist">
        {CHECKS.map((item) => (
          <View key={item.key} style={styles.row}>
            <Text style={styles.label}>{item.label}</Text>
            <Switch
              value={values[item.key]}
              onValueChange={(next) => setValues((prev) => ({ ...prev, [item.key]: next }))}
              trackColor={{ true: colors.primary }}
            />
          </View>
        ))}
      </AppCard>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <AppButton label="Submit Checklist" onPress={submit} loading={loading} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, padding: 20, gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  label: { flex: 1, color: colors.text, fontSize: 14 },
  error: { color: colors.error, fontSize: 13 },
});
