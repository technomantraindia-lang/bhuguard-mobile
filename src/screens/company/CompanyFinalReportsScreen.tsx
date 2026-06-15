import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getCompanyFinalReports } from '../../api/companyApi';
import { ApiListScreen } from '../../components/ApiListScreen';
import { ListItemCard } from '../../components/ListItemCard';
import type { CompanyStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<CompanyStackParamList>;

export function CompanyFinalReportsScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <ApiListScreen
      title="Final Reports"
      subtitle="GET /company/final-reports"
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
          downloadAvailable={item.download_available === true}
          onDownload={() => Alert.alert('Download', 'Use GET /company/final-reports/{id}/download in next build.')}
        />
      )}
    />
  );
}
