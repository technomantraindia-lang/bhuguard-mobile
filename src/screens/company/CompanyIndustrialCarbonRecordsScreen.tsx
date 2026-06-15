import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getCompanyIndustrialCarbonRecords } from '../../api/companyApi';
import { ApiListScreen } from '../../components/ApiListScreen';
import { ListItemCard } from '../../components/ListItemCard';
import type { CompanyStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<CompanyStackParamList>;

export function CompanyIndustrialCarbonRecordsScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <ApiListScreen
      title="Industrial Carbon Records"
      subtitle="GET /company/industrial-carbon-records"
      fetcher={getCompanyIndustrialCarbonRecords}
      listKeys={['industrial_carbon_records']}
      onItemPress={(item) =>
        navigation.navigate('CompanyIndustrialCarbonRecordDetail', { id: Number(item.id) })
      }
      renderItem={(item) => (
        <ListItemCard
          item={item}
          titleKeys={['record_code', 'source_type', 'emission_source']}
          statusKey="status"
          lines={[
            { label: 'Quantity', keys: ['emission_quantity', 'quantity'] },
            { label: 'Unit', keys: ['unit'] },
            { label: 'Reporting month', keys: ['reporting_period_start', 'reporting_month'] },
          ]}
        />
      )}
    />
  );
}
