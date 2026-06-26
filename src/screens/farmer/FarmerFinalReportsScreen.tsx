import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getFarmerFinalReports } from '../../api/farmerApi';
import { ApiListScreen } from '../../components/ApiListScreen';
import { ListItemCard } from '../../components/ListItemCard';
import { ReportListDownloadActions } from '../../components/reports/ReportListDownloadActions';
import type { FarmerStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<FarmerStackParamList>;

export function FarmerFinalReportsScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <ApiListScreen
      title="Final Reports"
      subtitle="View and download your reports"
      fetcher={getFarmerFinalReports}
      listKeys={['final_reports']}
      emptyTitle="No final reports"
      onItemPress={(item) =>
        navigation.navigate('FarmerFinalReportDetail', { id: Number(item.id) })
      }
      renderItem={(item) => (
        <ListItemCard
          item={item}
          titleKeys={['report_number', 'service_name', 'id']}
          statusKey="report_status"
          lines={[
            { label: 'Service', keys: ['service_name'] },
            { label: 'Farm', keys: ['farm_name'] },
            { label: 'Credits', keys: ['estimated_carbon_credit'] },
            { label: 'Generated', keys: ['generated_at'] },
          ]}
          renderFooter={() => <ReportListDownloadActions role="farmer" item={item} />}
        />
      )}
    />
  );
}
