import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getCompanyFinalReports } from '../../api/companyApi';
import { ApiListScreen } from '../../components/ApiListScreen';
import { ListItemCard } from '../../components/ListItemCard';
import { ReportListDownloadActions } from '../../components/reports/ReportListDownloadActions';
import type { CompanyStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<CompanyStackParamList>;

export function CompanyFinalReportsScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <ApiListScreen
      title="Final Reports"
      subtitle="View and download your reports"
      fetcher={getCompanyFinalReports}
      listKeys={['final_reports']}
      onItemPress={(item) =>
        navigation.navigate('CompanyFinalReportDetail', { id: Number(item.id) })
      }
      renderItem={(item) => (
        <ListItemCard
          item={item}
          titleKeys={['report_number', 'service_name', 'id']}
          statusKey="report_status"
          lines={[
            { label: 'Site', keys: ['site_name'] },
            { label: 'Generated', keys: ['generated_at'] },
          ]}
          renderFooter={() => <ReportListDownloadActions role="company_user" item={item} />}
        />
      )}
    />
  );
}
