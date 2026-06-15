import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getCompanyServiceSubmissions } from '../../api/companyApi';
import { ApiListScreen } from '../../components/ApiListScreen';
import { ListItemCard } from '../../components/ListItemCard';
import type { CompanyStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<CompanyStackParamList>;

export function CompanyServiceSubmissionsScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <ApiListScreen
      title="Service Submissions"
      subtitle="GET /company/service-submissions"
      fetcher={getCompanyServiceSubmissions}
      listKeys={['service_submissions', 'submissions']}
      onItemPress={(item) =>
        navigation.navigate('CompanyServiceSubmissionDetail', { id: Number(item.id) })
      }
      renderItem={(item) => (
        <ListItemCard
          item={item}
          titleKeys={['submission_code', 'service_name', 'id']}
          statusKey="status"
          lines={[
            { label: 'Service', nested: 'service.name' },
            { label: 'Submitted', keys: ['submitted_at', 'created_at'] },
            { label: 'Site', keys: ['site_name'] },
          ]}
        />
      )}
    />
  );
}
