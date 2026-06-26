import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '../../components/AppButton';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useCompanyProfileForm } from '../../hooks/useCompanyProfileForm';
import { useLogout } from '../../hooks/useLogout';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';

function ProfileField({
  label,
  value,
  onChangeText,
  editable,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  editable: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {editable ? (
        <TextInput
          value={value === '-' ? '' : value}
          onChangeText={onChangeText}
          style={styles.input}
          keyboardType={keyboardType}
          autoCapitalize="none"
        />
      ) : (
        <Text style={styles.readOnly}>{value === '-' ? '—' : value}</Text>
      )}
    </View>
  );
}

export function CompanyProfileScreen() {
  const logout = useLogout();
  const { values, loading, saving, error, successMessage, reload, updateField, save } =
    useCompanyProfileForm();

  if (loading && !values) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading profile..." />
      </SafeAreaView>
    );
  }

  if (error && !values) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message={error} onRetry={reload} />
      </SafeAreaView>
    );
  }

  if (!values) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <ScreenHeader title="My Profile" subtitle="Company account — edit your company details" />

          <ProfileField
            label="Company Name"
            value={values.companyName}
            onChangeText={(text) => updateField('companyName', text)}
            editable
          />
          <ProfileField
            label="Contact Person"
            value={values.contactPerson}
            onChangeText={(text) => updateField('contactPerson', text)}
            editable
          />
          <ProfileField
            label="Mobile"
            value={values.mobile}
            onChangeText={(text) => updateField('mobile', text)}
            editable
            keyboardType="phone-pad"
          />
          <ProfileField
            label="Email"
            value={values.email}
            onChangeText={(text) => updateField('email', text)}
            editable
            keyboardType="email-address"
          />
          <ProfileField
            label="GST Number"
            value={values.gstNumber}
            onChangeText={(text) => updateField('gstNumber', text)}
            editable
          />
          <ProfileField
            label="Address"
            value={values.address}
            onChangeText={(text) => updateField('address', text)}
            editable
          />
          <ProfileField
            label="City"
            value={values.city}
            onChangeText={(text) => updateField('city', text)}
            editable
          />
          <ProfileField
            label="District"
            value={values.district}
            onChangeText={(text) => updateField('district', text)}
            editable
          />
          <ProfileField
            label="State"
            value={values.state}
            onChangeText={(text) => updateField('state', text)}
            editable
          />
          <ProfileField
            label="Industry Type"
            value={values.industryType}
            onChangeText={(text) => updateField('industryType', text)}
            editable
          />
          <ProfileField label="Status" value={values.status} onChangeText={() => undefined} editable={false} />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}

          <AppButton label={saving ? 'Saving…' : 'Save Profile'} onPress={() => void save()} disabled={saving} />
          <AppButton label="Logout" onPress={logout} variant="danger" />
        </ScrollView>
      </KeyboardAvoidingView>
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
  readOnly: { fontSize: 15, color: dashboardTheme.onSurfaceVariant, paddingVertical: 4 },
  error: { color: dashboardTheme.error, fontSize: 14 },
  success: { color: dashboardTheme.primary, fontSize: 14, fontWeight: '600' },
});
