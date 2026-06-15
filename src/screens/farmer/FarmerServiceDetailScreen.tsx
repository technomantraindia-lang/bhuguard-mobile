import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getFarmerServiceDetail } from '../../api/farmerApi';
import { ApiDetailScreen } from '../../components/ApiDetailScreen';
import type { FarmerStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmerServiceDetail'>;

export function FarmerServiceDetailScreen({ route }: Props) {
  const { serviceId } = route.params;

  return (
    <ApiDetailScreen
      title="Service Detail"
      subtitle={`GET /farmer/service-submissions/${serviceId}`}
      fetcher={() => getFarmerServiceDetail(serviceId)}
      rootKeys={['service_submission', 'service', 'data']}
      fields={[
        { label: 'Service Name', keys: ['name', 'service_name'] },
        { label: 'Service Code', keys: ['code', 'service_code'] },
        { label: 'Enrolment Status', keys: ['enrolment_status', 'status'] },
        { label: 'Farm', nested: 'farm.farm_name' },
        { label: 'Enrolled At', keys: ['enrolled_at', 'created_at'] },
      ]}
    />
  );
}
