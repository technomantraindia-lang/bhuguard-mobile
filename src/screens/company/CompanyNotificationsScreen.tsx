import { getCompanyNotifications } from '../../api/companyApi';
import { ApiListScreen } from '../../components/ApiListScreen';
import { ListItemCard } from '../../components/ListItemCard';

export function CompanyNotificationsScreen() {
  return (
    <ApiListScreen
      title="Notifications"
      subtitle="GET /notifications"
      fetcher={getCompanyNotifications}
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
