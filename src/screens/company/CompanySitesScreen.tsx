import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getCompanySites } from '../../api/companyApi';
import { ApiListScreen } from '../../components/ApiListScreen';
import { ListItemCard } from '../../components/ListItemCard';
import type { CompanyStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<CompanyStackParamList>;

export function CompanySitesScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <ApiListScreen
      title="Sites & Maps"
      subtitle="Company site locations"
      fetcher={getCompanySites}
      listKeys={['sites']}
      onItemPress={(item) =>
        navigation.navigate('CompanySiteDetail', { siteId: Number(item.id) })
      }
      renderItem={(item) => (
        <ListItemCard
          item={item}
          titleKeys={['site_name', 'name']}
          statusKey="status"
          lines={[
            { label: 'Location', keys: ['city', 'district', 'state'] },
            { label: 'Address', keys: ['address'] },
            { label: 'Contact', keys: ['contact_person', 'mobile'] },
          ]}
        />
      )}
    />
  );
}
