import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getCompanySiteDetail } from '../../api/companyApi';
import { ApiDetailScreen } from '../../components/ApiDetailScreen';
import { AppButton } from '../../components/AppButton';
import type { CompanyStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<CompanyStackParamList, 'CompanySiteDetail'>;
type Nav = NativeStackNavigationProp<CompanyStackParamList>;

export function CompanySiteDetailScreen({ route }: Props) {
  const { siteId } = route.params;
  const navigation = useNavigation<Nav>();

  if (!siteId || siteId <= 0) {
    return (
      <ApiDetailScreen
        title="Site Detail"
        subtitle="Invalid site ID"
        fetcher={async () => {
          throw new Error('Site ID is missing.');
        }}
        fields={[]}
      />
    );
  }

  return (
    <ApiDetailScreen
      title="Site Detail"
      subtitle={`GET /company/sites/${siteId}`}
      fetcher={() => getCompanySiteDetail(siteId)}
      rootKeys={['site', 'data']}
      fields={[
        { label: 'Site Name', keys: ['site_name', 'name'] },
        { label: 'Site Type', keys: ['site_type', 'industry_type'] },
        { label: 'Address', keys: ['address'] },
        { label: 'City', keys: ['city'] },
        { label: 'District', keys: ['district'] },
        { label: 'State', keys: ['state'] },
        { label: 'Industry Type', keys: ['industry_type'] },
        { label: 'Latitude', keys: ['latitude'] },
        { label: 'Longitude', keys: ['longitude'] },
        { label: 'Contact Person', keys: ['contact_person'] },
        { label: 'Mobile', keys: ['mobile'] },
        { label: 'Status', keys: ['status'] },
        { label: 'Remarks', keys: ['notes'] },
      ]}
      footer={
        <AppButton
          label="Edit Site"
          onPress={() => navigation.navigate('CompanyEditSite', { siteId })}
        />
      }
    />
  );
}
