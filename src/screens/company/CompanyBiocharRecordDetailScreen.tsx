import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getCompanyBiocharRecordDetail } from '../../api/companyApi';
import { ApiDetailScreen } from '../../components/ApiDetailScreen';
import type { CompanyStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<CompanyStackParamList, 'CompanyBiocharRecordDetail'>;

export function CompanyBiocharRecordDetailScreen({ route }: Props) {
  const { id } = route.params;

  return (
    <ApiDetailScreen
      title="Biochar Record Detail"
      subtitle={`GET /company/biochar-records/${id}`}
      fetcher={() => getCompanyBiocharRecordDetail(id)}
      rootKeys={['biochar_record', 'data']}
      fields={[
        { label: 'Record Code', keys: ['record_code', 'id'] },
        { label: 'Batch', keys: ['batch_code', 'batch_number'] },
        { label: 'Feedstock', keys: ['feedstock_type', 'feedstock'] },
        { label: 'Production Qty', keys: ['biochar_output', 'production_quantity'] },
        { label: 'Application Status', keys: ['application_status'] },
        { label: 'Status', keys: ['status'] },
      ]}
    />
  );
}
