import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getCompanyWasteRecordDetail } from '../../api/companyApi';
import { ApiDetailScreen } from '../../components/ApiDetailScreen';
import type { CompanyStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<CompanyStackParamList, 'CompanyWasteRecordDetail'>;

export function CompanyWasteRecordDetailScreen({ route }: Props) {
  const { id } = route.params;

  return (
    <ApiDetailScreen
      title="Waste Record Detail"
      subtitle={`GET /company/waste-records/${id}`}
      fetcher={() => getCompanyWasteRecordDetail(id)}
      rootKeys={['waste_record', 'data']}
      fields={[
        { label: 'Record Code', keys: ['record_code', 'id'] },
        { label: 'Waste Type', keys: ['waste_type'] },
        { label: 'Quantity', keys: ['quantity'] },
        { label: 'Unit', keys: ['unit'] },
        { label: 'Record Date', keys: ['record_date', 'created_at'] },
        { label: 'Status', keys: ['status'] },
      ]}
    />
  );
}
