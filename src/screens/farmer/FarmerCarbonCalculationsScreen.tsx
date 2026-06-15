import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getFarmerCarbonCalculations } from '../../api/farmerApi';
import { ApiListScreen } from '../../components/ApiListScreen';
import { ListItemCard } from '../../components/ListItemCard';
import type { FarmerStackParamList } from '../../navigation/types';
import { pickString } from '../../utils/apiHelpers';
import { downloadFarmerReport } from '../../utils/reportDownload';
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
          onDownload={async () => {
            const result = await downloadFarmerReport({
              id: `carbon-${item.id}`,
              catalogId: 'monitoring',
              sourceType: 'carbon',
              sourceId: Number(item.id),
              title: `Monitoring Report ${pickString(item, 'calculation_code', 'id')}`,
              description: 'Quarterly monitoring report',
              updatedLabel: `Updated: ${pickString(item, 'calculated_at')}`,
              updatedAt: pickString(item, 'calculated_at'),
              statusBadge: 'available',
              icon: 'science',
              downloadAvailable: true,
            });

            if (!result.success) {
              Alert.alert('Download failed', result.message ?? 'Unable to download this report.');
            }
          }}        />
      )}
    />
  );
}
