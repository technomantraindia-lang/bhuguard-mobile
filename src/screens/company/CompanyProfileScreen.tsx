import { StyleSheet, View } from 'react-native';

import { getCompanyProfile } from '../../api/companyApi';
import { ApiObjectScreen } from '../../components/ApiObjectScreen';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { DetailRow } from '../../components/DetailRow';
import { useLogout } from '../../hooks/useLogout';
import { pickString, type ApiRecord } from '../../utils/apiHelpers';

function CompanyProfileContent({ data }: { data: ApiRecord }) {
  const logout = useLogout();
  const root = (data.profile ?? data) as ApiRecord;
  const company = (root.company ?? root) as ApiRecord;

  return (
    <>
      <AppCard
        title={pickString(company, 'company_name', 'name')}
        subtitle={pickString(company, 'company_code')}
      >
        <DetailRow label="Contact Person" value={pickString(company, 'contact_person')} />
        <DetailRow label="Mobile" value={pickString(company, 'mobile')} />
        <DetailRow label="Email" value={pickString(company, 'email')} />
        <DetailRow label="District" value={pickString(company, 'district')} />
        <DetailRow label="Status" value={pickString(company, 'status')} />
      </AppCard>

      <View style={styles.actions}>
        <AppButton label="Logout" onPress={logout} variant="danger" />
      </View>
    </>
  );
}

export function CompanyProfileScreen() {
  return (
    <ApiObjectScreen
      title="My Profile"
      subtitle="Company account"
      fetcher={getCompanyProfile}
      render={(data) => <CompanyProfileContent data={data} />}
    />
  );
}

const styles = StyleSheet.create({
  actions: {
    marginTop: 8,
  },
});
