import { getMonitoringReports } from '../../api/fieldOfficerApi';
import { ApiListScreen } from '../../components/ApiListScreen';
import { ListItemCard } from '../../components/ListItemCard';

export function FieldOfficerMonitoringReportsScreen() {
  return (
    <ApiListScreen
      title="Monitoring Reports"
      subtitle="GET /field-officer/monitoring-reports"
      fetcher={getMonitoringReports}
      listKeys={['monitoring_reports', 'reports']}
      emptyTitle="No monitoring reports"
      renderItem={(item) => (
        <ListItemCard
          item={item}
          titleKeys={['report_code', 'id']}
          statusKey="status"
          lines={[
            { label: 'Submitted At', keys: ['submitted_at', 'created_at'] },
            { label: 'Farmer', nested: 'farmer.user.name' },
            { label: 'Summary', keys: ['summary', 'remarks'] },
          ]}
        />
      )}
    />
  );
}
