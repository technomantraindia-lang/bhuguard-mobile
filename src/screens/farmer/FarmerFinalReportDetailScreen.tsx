import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getFarmerFinalReportDetail } from '../../api/farmerApi';
import { ApiDetailScreen } from '../../components/ApiDetailScreen';
import type { FarmerStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmerFinalReportDetail'>;

export function FarmerFinalReportDetailScreen({ route }: Props) {
  const { id } = route.params;

  return (
    <ApiDetailScreen
      title="Final Report Detail"
      subtitle={`GET /farmer/final-reports/${id}`}
      showReportHeader
      fetcher={() => getFarmerFinalReportDetail(id)}
      rootKeys={['final_report', 'data']}
      fields={[
        { label: 'Report Number', keys: ['report_number', 'report_code'] },
        { label: 'Service', keys: ['service_name'] },
        { label: 'Farm', keys: ['farm_name'] },
        { label: 'Credits', keys: ['estimated_carbon_credit'] },
        { label: 'Generated At', keys: ['generated_at'] },
        { label: 'Status', keys: ['report_status', 'status'] },
      ]}
    />
  );
}
