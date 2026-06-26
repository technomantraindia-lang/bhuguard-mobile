import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getCompanyBiocharRecords } from '../../api/companyApi';
import { ApiListScreen } from '../../components/ApiListScreen';
import { ListItemCard } from '../../components/ListItemCard';
import type { CompanyStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<CompanyStackParamList>;

export function CompanyBiocharRecordsScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <ApiListScreen
      title="Biochar Records"
      subtitle="Biochar production records"
      fetcher={getCompanyBiocharRecords}
      listKeys={['biochar_records']}
      emptyTitle="No biochar records yet"
      emptyMessage="Add production batches linked to your biochar service submissions."
      headerAction={{
        label: 'Add Record',
        onPress: () =>
          navigation.navigate('CompanyCreateRecord', { formKey: 'company_create_biochar' }),
      }}
      onItemPress={(item) =>
        navigation.navigate('CompanyBiocharRecordDetail', { id: Number(item.id) })
      }
      renderItem={(item) => (
        <ListItemCard
          item={item}
          titleKeys={['record_code', 'batch_code', 'batch_number']}
          statusKey="status"
          lines={[
            { label: 'Feedstock', keys: ['feedstock_type', 'feedstock'] },
            { label: 'Production qty', keys: ['biochar_output', 'production_quantity', 'quantity'] },
            { label: 'Application', keys: ['application_status'] },
          ]}
        />
      )}
    />
  );
}
