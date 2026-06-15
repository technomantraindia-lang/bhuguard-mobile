import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getFarmerServices } from '../../api/farmerApi';
import { ApiListScreen } from '../../components/ApiListScreen';
import { ListItemCard } from '../../components/ListItemCard';
import type { FarmerStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<FarmerStackParamList>;

export function FarmerServicesScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <ApiListScreen
      title="Services"
      subtitle="GET /farmer/services"
      fetcher={getFarmerServices}
      listKeys={['services']}
      emptyTitle="No services"
      onItemPress={(item) =>
        navigation.navigate('FarmerServiceDetail', { serviceId: Number(item.id) })
      }
      renderItem={(item) => (
        <ListItemCard
          item={item}
          titleKeys={['name', 'service_name', 'code']}
          statusKey="enrolment_status"
          lines={[
            { label: 'Service code', keys: ['code'] },
            { label: 'Enrolled', keys: ['enrolled_at'] },
            { label: 'Farm', nested: 'farm.farm_name' },
          ]}
        />
      )}
    />
  );
}
