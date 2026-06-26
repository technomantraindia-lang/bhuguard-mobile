import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getFarmerSoilSamples } from '../../api/farmerApi';
import { ApiListScreen } from '../../components/ApiListScreen';
import { ListItemCard } from '../../components/ListItemCard';
import type { FarmerStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<FarmerStackParamList>;

export function FarmerSoilSamplesScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <ApiListScreen
      title="Soil Samples"
      subtitle="GET /farmer/soil-samples"
      fetcher={getFarmerSoilSamples}
      listKeys={['soil_samples', 'samples']}
      emptyTitle="No soil samples"
      onItemPress={(item) =>
        navigation.navigate('FarmerSoilSampleDetail', { sampleId: Number(item?.id ?? 0) })
      }
      renderItem={(item) => (
        <ListItemCard
          item={item}
          titleKeys={['sample_code', 'id']}
          statusKey="status"
          lines={[
            { label: 'Sample Date', keys: ['sample_date', 'created_at'] },
            { label: 'Farm', nested: 'farm.farm_name' },
            { label: 'Lab Status', keys: ['lab_status'] },
          ]}
        />
      )}
    />
  );
}
