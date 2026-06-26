import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getCompanyWasteRecords } from '../../api/companyApi';
import { ApiListScreen } from '../../components/ApiListScreen';
import { ListItemCard } from '../../components/ListItemCard';
import type { CompanyStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<CompanyStackParamList>;

export function CompanyWasteRecordsScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <ApiListScreen
      title="Waste Records"
      subtitle="Company waste management records"
      fetcher={getCompanyWasteRecords}
      listKeys={['waste_records']}
      emptyTitle="No waste records yet"
      emptyMessage="Add waste records linked to your service submissions."
      headerAction={{
        label: 'Add Waste Record',
        onPress: () => navigation.navigate('CompanyCreateRecord', { formKey: 'company_create_waste' }),
      }}
      onItemPress={(item) =>
        navigation.navigate('CompanyWasteRecordDetail', { id: Number(item.id) })
      }
      renderItem={(item) => (
        <ListItemCard
          item={item}
          titleKeys={['record_code', 'waste_type']}
          statusKey="status"
          lines={[
            { label: 'Quantity', keys: ['quantity'] },
            { label: 'Unit', keys: ['unit'] },
            { label: 'Date', keys: ['record_date', 'created_at'] },
            { label: 'Evidence', keys: ['evidence_status'] },
          ]}
        />
      )}
    />
  );
}
