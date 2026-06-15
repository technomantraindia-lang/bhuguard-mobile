import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getCompanyCarbonCalculations } from '../../api/companyApi';
import { ApiListScreen } from '../../components/ApiListScreen';
import { ListItemCard } from '../../components/ListItemCard';
import type { CompanyStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<CompanyStackParamList>;

export function CompanyCarbonCalculationsScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <ApiListScreen
      title="Carbon Calculations"
      subtitle="GET /company/carbon-calculations"
      fetcher={getCompanyCarbonCalculations}
      listKeys={['carbon_calculations']}
      onItemPress={(item) =>
        navigation.navigate('CompanyCarbonCalculationDetail', { id: Number(item.id) })
      }
      renderItem={(item) => (
        <ListItemCard
          item={item}
          titleKeys={['service_name', 'calculation_code', 'id']}
          statusKey="status"
          lines={[
            { label: 'Site', keys: ['site_name', 'company_name'] },
            { label: 'Estimated carbon', keys: ['estimated_carbon_credits', 'estimated_co2e'] },
            { label: 'Method', keys: ['calculation_type', 'calculation_category'] },
          ]}
        />
      )}
    />
  );
}
