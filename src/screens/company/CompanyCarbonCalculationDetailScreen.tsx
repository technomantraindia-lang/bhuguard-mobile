import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getCompanyCarbonCalculationDetail } from '../../api/companyApi';
import { ApiDetailScreen } from '../../components/ApiDetailScreen';
import type { CompanyStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<CompanyStackParamList, 'CompanyCarbonCalculationDetail'>;

export function CompanyCarbonCalculationDetailScreen({ route }: Props) {
  const { id } = route.params;

  return (
    <ApiDetailScreen
      title="Carbon Calculation Detail"
      subtitle={`GET /company/carbon-calculations/${id}`}
      fetcher={() => getCompanyCarbonCalculationDetail(id)}
      rootKeys={['carbon_calculation', 'data']}
      fields={[
        { label: 'Calculation Code', keys: ['calculation_code', 'id'] },
        { label: 'Site', keys: ['site_name', 'company_name'] },
        { label: 'Estimated Carbon', keys: ['estimated_carbon_credits'] },
        { label: 'Estimated CO2e', keys: ['estimated_co2e'] },
        { label: 'Method', keys: ['calculation_type', 'calculation_category'] },
        { label: 'Status', keys: ['status'] },
      ]}
    />
  );
}
