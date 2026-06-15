import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getCompanySiteDetail } from '../../api/companyApi';
import { ApiDetailScreen } from '../../components/ApiDetailScreen';
import type { CompanyStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<CompanyStackParamList, 'CompanySiteDetail'>;

export function CompanySiteDetailScreen({ route }: Props) {
  const { siteId } = route.params;

  return (
    <ApiDetailScreen
      title="Site Detail"
      subtitle={`GET /company/sites/${siteId}`}
      fetcher={() => getCompanySiteDetail(siteId)}
      rootKeys={['site', 'data']}
      fields={[
        { label: 'Site Name', keys: ['site_name', 'name'] },
        { label: 'Address', keys: ['address'] },
        { label: 'City', keys: ['city'] },
        { label: 'District', keys: ['district'] },
        { label: 'Contact Person', keys: ['contact_person'] },
        { label: 'Status', keys: ['status'] },
      ]}
    />
  );
}
