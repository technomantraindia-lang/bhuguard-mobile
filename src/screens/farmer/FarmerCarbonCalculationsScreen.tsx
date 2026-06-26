import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getFarmerCarbonCalculations } from '../../api/farmerApi';
import { ApiListScreen } from '../../components/ApiListScreen';
import { ListItemCard } from '../../components/ListItemCard';
import type { FarmerStackParamList } from '../../navigation/types';
import { REPORT_FILE_NOT_GENERATED_MESSAGE } from '../../utils/reportFileDownload';
type Nav = NativeStackNavigationProp<FarmerStackParamList>;

export function FarmerCarbonCalculationsScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <ApiListScreen
      title="Carbon Progress"
      subtitle="GET /farmer/carbon-calculations"
      fetcher={getFarmerCarbonCalculations}
      listKeys={['carbon_calculations']}
      emptyTitle="No carbon calculations"
      onItemPress={(item) =>
        navigation.navigate('FarmerCarbonCalculationDetail', { id: Number(item.id) })
      }
      renderItem={(item) => (
        <ListItemCard
          item={item}
          titleKeys={['service_name', 'calculation_code', 'id']}
          statusKey="status"
          lines={[
            { label: 'Project / Farm', keys: ['farm_name', 'service_name'] },
            { label: 'Estimated credits', keys: ['estimated_carbon_credits', 'estimated_carbon_credit'] },
            { label: 'CO₂e', keys: ['estimated_co2e'] },
            { label: 'Category', keys: ['calculation_category'] },
            { label: 'Period', keys: ['calculated_at'] },
          ]}
          downloadAvailable
          onDownload={() => {
            Alert.alert('Download unavailable', REPORT_FILE_NOT_GENERATED_MESSAGE);
          }}
        />
      )}
    />
  );
}
