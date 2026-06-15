import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getFarmerCarbonCalculationDetail } from '../../api/farmerApi';
import { ApiDetailScreen } from '../../components/ApiDetailScreen';
import type { FarmerStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmerCarbonCalculationDetail'>;

export function FarmerCarbonCalculationDetailScreen({ route }: Props) {
  const { id } = route.params;

  return (
    <ApiDetailScreen
      title="Carbon Calculation Detail"
      subtitle={`GET /farmer/carbon-calculations/${id}`}
      fetcher={() => getFarmerCarbonCalculationDetail(id)}
      rootKeys={['carbon_calculation', 'data']}
      fields={[
        { label: 'Calculation Code', keys: ['calculation_code', 'id'] },
        { label: 'Service', keys: ['service_name'] },
        { label: 'Farm', keys: ['farm_name'] },
        { label: 'Estimated Credits', keys: ['estimated_carbon_credits', 'estimated_carbon_credit'] },
        { label: 'Estimated CO2e', keys: ['estimated_co2e'] },
        { label: 'Status', keys: ['status'] },
      ]}
    />
  );
}
