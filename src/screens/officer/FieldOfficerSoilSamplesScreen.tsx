import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getSoilSamples } from '../../api/fieldOfficerApi';
import { ApiListScreen } from '../../components/ApiListScreen';
import { ListItemCard } from '../../components/ListItemCard';
import type { FieldOfficerStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList>;

export function FieldOfficerSoilSamplesScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <ApiListScreen
      title="Soil Samples"
      subtitle="GET /field-officer/soil-samples"
      fetcher={getSoilSamples}
      listKeys={['soil_samples', 'samples']}
      headerAction={{
        label: 'Add Sample',
        onPress: () =>
          navigation.navigate('FieldOfficerCreateRecord', { formKey: 'officer_create_soil_sample' }),
      }}
      emptyTitle="No soil samples"
      renderItem={(item) => (
        <ListItemCard
          item={item}
          titleKeys={['sample_code', 'id']}
          statusKey="status"
          lines={[
            { label: 'Sample Date', keys: ['sample_date', 'created_at'] },
            { label: 'Farmer', nested: 'farmer.user.name' },
            { label: 'Farm', nested: 'farm.farm_name' },
            { label: 'Lab Status', keys: ['lab_status'] },
          ]}
        />
      )}
    />
  );
}
