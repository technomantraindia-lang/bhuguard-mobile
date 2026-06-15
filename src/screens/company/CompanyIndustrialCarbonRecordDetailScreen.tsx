import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getCompanyIndustrialCarbonRecordDetail } from '../../api/companyApi';
import { ApiDetailScreen } from '../../components/ApiDetailScreen';
import type { CompanyStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<CompanyStackParamList, 'CompanyIndustrialCarbonRecordDetail'>;

export function CompanyIndustrialCarbonRecordDetailScreen({ route }: Props) {
  const { id } = route.params;

  return (
    <ApiDetailScreen
      title="Industrial Carbon Record Detail"
      subtitle={`GET /company/industrial-carbon-records/${id}`}
      fetcher={() => getCompanyIndustrialCarbonRecordDetail(id)}
      rootKeys={['industrial_carbon_record', 'data']}
      fields={[
        { label: 'Record Code', keys: ['record_code', 'id'] },
        { label: 'Source Type', keys: ['source_type', 'emission_source'] },
        { label: 'Quantity', keys: ['emission_quantity', 'quantity'] },
        { label: 'Unit', keys: ['unit'] },
        { label: 'Reporting Month', keys: ['reporting_month', 'reporting_period_start'] },
        { label: 'Status', keys: ['status'] },
      ]}
    />
  );
}
