import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getMonitoringReports } from '../../api/fieldOfficerApi';
import { ApiListScreen } from '../../components/ApiListScreen';
import { ListItemCard } from '../../components/ListItemCard';
import type { FieldOfficerStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList>;

export function FieldOfficerMonitoringReportsScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <ApiListScreen
      title="Monitoring Reports"
      subtitle="GET /field-officer/monitoring-reports"
      fetcher={getMonitoringReports}
      listKeys={['monitoring_reports', 'reports']}
      headerAction={{
        label: 'Create Report',
        onPress: () =>
          navigation.navigate('FieldOfficerCreateRecord', {
            formKey: 'officer_create_monitoring_report',
          }),
      }}
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
