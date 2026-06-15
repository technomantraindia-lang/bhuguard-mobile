import { getFieldOfficerNotifications } from '../../api/fieldOfficerApi';
import { ApiListScreen } from '../../components/ApiListScreen';
import { ListItemCard } from '../../components/ListItemCard';

export function FieldOfficerNotificationsScreen() {
  return (
    <ApiListScreen
      title="Notifications"
      subtitle="GET /notifications"
      fetcher={getFieldOfficerNotifications}
      listKeys={['notifications']}
      emptyTitle="No notifications"
      renderItem={(item) => (
        <ListItemCard
          item={item}
          titleKeys={['title', 'type']}
          subtitleKeys={['message', 'body']}
          statusKey="status"
          lines={[{ label: 'Created', keys: ['created_at'] }]}
        />
      )}
    />
  );
}
