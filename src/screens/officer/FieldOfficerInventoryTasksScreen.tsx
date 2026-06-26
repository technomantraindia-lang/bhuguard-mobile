import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getInventoryVerificationTasks } from '../../api/fieldOfficerApi';
import { ApiListScreen } from '../../components/ApiListScreen';
import { ListItemCard } from '../../components/ListItemCard';
import type { FieldOfficerStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList>;

export function FieldOfficerInventoryTasksScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <ApiListScreen
      title="Inventory Verification Tasks"
      subtitle="GET /field-officer/inventory-tasks"
      fetcher={getInventoryVerificationTasks}
      listKeys={['inventory_tasks', 'tasks']}
      onItemPress={(item) =>
        navigation.navigate('FieldOfficerInventoryTaskDetail', {
          taskId: Number(item.id),
        })
      }
      renderItem={(item) => (
        <ListItemCard
          item={item}
          titleKeys={['task_code', 'task_type', 'title']}
          subtitleKeys={['farmer_name', 'farm_name']}
          statusKey="status"
          lines={[
            { label: 'Due', keys: ['due_date', 'scheduled_at'] },
            { label: 'Type', keys: ['verification_type'] },
          ]}
        />
      )}
    />
  );
}
