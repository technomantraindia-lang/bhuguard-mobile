import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import { AppButton } from '../../components/AppButton';
import { KeyboardSafeScrollView } from '../../components/layout/KeyboardSafeScrollView';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useCompanySiteForm } from '../../hooks/useCompanySiteForm';
import type { CompanyStackParamList } from '../../navigation/types';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';

type Props = NativeStackScreenProps<CompanyStackParamList, 'CompanyEditSite'>;

function SiteField({
  label,
  value,
  onChangeText,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value === '-' ? '' : value}
        onChangeText={onChangeText}
        style={[styles.input, multiline && styles.multiline]}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  );
}

export function CompanyEditSiteScreen({ route }: Props) {
  const navigation = useNavigation();
  const siteId = route.params?.siteId;
  const { values, loading, saving, error, isEdit, reload, updateField, submit } = useCompanySiteForm(siteId);

  const handleSubmit = async () => {
    const ok = await submit();

    if (ok) {
      Alert.alert('Saved', isEdit ? 'Site updated successfully.' : 'Site created successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading site..." />
      </SafeAreaView>
    );
  }

  if (error && isEdit && !values.siteName) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message={error} onRetry={reload} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardSafeScrollView contentContainerStyle={styles.container} extraBottomPadding={16}>
          <ScreenHeader
            title={isEdit ? 'Edit Site' : 'Add Site'}
            subtitle={isEdit ? `PUT /company/sites/${siteId}` : 'POST /company/sites'}
          />

          <SiteField label="Site Name *" value={values.siteName} onChangeText={(t) => updateField('siteName', t)} />
          <SiteField label="Contact Person" value={values.contactPerson} onChangeText={(t) => updateField('contactPerson', t)} />
          <SiteField label="Mobile" value={values.mobile} onChangeText={(t) => updateField('mobile', t)} keyboardType="phone-pad" />
          <SiteField label="Email" value={values.email} onChangeText={(t) => updateField('email', t)} keyboardType="email-address" />
          <SiteField label="Address" value={values.address} onChangeText={(t) => updateField('address', t)} multiline />
          <SiteField label="City" value={values.city} onChangeText={(t) => updateField('city', t)} />
          <SiteField label="District" value={values.district} onChangeText={(t) => updateField('district', t)} />
          <SiteField label="State" value={values.state} onChangeText={(t) => updateField('state', t)} />
          <SiteField label="Pincode" value={values.pincode} onChangeText={(t) => updateField('pincode', t)} />
          <SiteField label="Latitude" value={values.latitude} onChangeText={(t) => updateField('latitude', t)} keyboardType="numeric" />
          <SiteField label="Longitude" value={values.longitude} onChangeText={(t) => updateField('longitude', t)} keyboardType="numeric" />
          <SiteField label="Remarks" value={values.notes} onChangeText={(t) => updateField('notes', t)} multiline />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <AppButton label={saving ? 'Saving…' : isEdit ? 'Update Site' : 'Create Site'} onPress={() => void handleSubmit()} disabled={saving} />
      </KeyboardSafeScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dashboardTheme.background },
  flex: { flex: 1 },
  container: { padding: dashboardTheme.marginMobile, gap: 12, paddingBottom: 40 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: dashboardTheme.onSurface },
  input: {
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: dashboardTheme.surfaceLowest,
    color: dashboardTheme.onSurface,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  error: { color: dashboardTheme.error, fontSize: 14 },
});
