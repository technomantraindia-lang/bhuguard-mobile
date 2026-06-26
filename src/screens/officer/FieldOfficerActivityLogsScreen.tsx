import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getActivityLogs } from '../../api/fieldOfficerApi';
import { ApiListScreen } from '../../components/ApiListScreen';
import { ListItemCard } from '../../components/ListItemCard';
import type { FieldOfficerStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList>;

export function FieldOfficerActivityLogsScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <ApiListScreen
      title="Farmer Activity Logs"
      subtitle="GET /field-officer/activity-logs"
      fetcher={getActivityLogs}
      listKeys={['activity_logs', 'logs']}
      headerAction={{
        label: 'Log Activity',
        onPress: () =>
          navigation.navigate('FieldOfficerCreateRecord', { formKey: 'officer_create_activity_log' }),
      }}
      emptyTitle="No activity logs"
      renderItem={(item) => (
        <ListItemCard
          item={item}
          titleKeys={['activity_type', 'title', 'id']}
          subtitleKeys={['description', 'remarks']}
          statusKey="status"
          lines={[
            { label: 'Date', keys: ['activity_date', 'created_at'] },
            { label: 'Farmer', nested: 'farmer.user.name' },
            { label: 'Farm', nested: 'farm.farm_name' },
          ]}
        />
      )}
    />
  );
}
