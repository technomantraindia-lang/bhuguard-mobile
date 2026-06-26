import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getFarmerWeeklyUpdates } from '../../api/farmerApi';
import { ApiListScreen } from '../../components/ApiListScreen';
import { ListItemCard } from '../../components/ListItemCard';
import type { FarmerStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<FarmerStackParamList>;

export function FarmerWeeklyUpdatesScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <ApiListScreen
      title="Weekly Updates"
      subtitle="GET /farmer/weekly-updates"
      fetcher={getFarmerWeeklyUpdates}
      listKeys={['weekly_updates']}
      refetchOnFocus
      emptyTitle="No weekly updates yet"
      headerAction={{
        label: 'Create Update',
        onPress: () => navigation.navigate('FarmerCreateWeeklyUpdate'),
      }}
      onItemPress={(item) =>
        navigation.navigate('FarmerWeeklyUpdateDetail', { updateId: Number(item.id) })
      }
      renderItem={(item) => (
        <ListItemCard
          item={item}
          titleKeys={['update_date', 'update_code']}
          subtitleKeys={['activity_done', 'crop_or_stage']}
          statusKey="status"
          lines={[
            { label: 'Week', keys: ['week_number'] },
            { label: 'Service', nested: 'service.name' },
            { label: 'Farm', nested: 'farm.farm_name' },
            { label: 'Submitted', keys: ['submitted_at'] },
          ]}
        />
      )}
    />
  );
}
