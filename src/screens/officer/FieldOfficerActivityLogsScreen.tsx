import { getActivityLogs } from '../../api/fieldOfficerApi';
import { ApiListScreen } from '../../components/ApiListScreen';
import { ListItemCard } from '../../components/ListItemCard';

export function FieldOfficerActivityLogsScreen() {
  return (
    <ApiListScreen
      title="Farmer Activity Logs"
      subtitle="GET /field-officer/activity-logs"
      fetcher={getActivityLogs}
      listKeys={['activity_logs', 'logs']}
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
