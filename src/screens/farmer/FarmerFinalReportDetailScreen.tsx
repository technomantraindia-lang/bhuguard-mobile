import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ApiDetailScreen } from '../../components/ApiDetailScreen';
import { ReportDetailDownloadFooter } from '../../components/reports/ReportDetailDownloadFooter';
import { getFarmerFinalReportDetail } from '../../api/farmerApi';
import type { FarmerStackParamList } from '../../navigation/types';
import { pickString, type ApiRecord } from '../../utils/apiHelpers';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmerFinalReportDetail'>;

export function FarmerFinalReportDetailScreen({ route }: Props) {
  const { id } = route.params;

  return (
    <ApiDetailScreen
      title="Final Report Detail"
      subtitle="View and download your report"
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
        { label: 'Summary', keys: ['verification_summary', 'carbon_calculation_summary', 'notes'] },
        { label: 'Admin Remarks', keys: ['admin_remarks', 'notes'] },
      ]}
      renderExtra={(item: ApiRecord) => (
        <ReportDetailDownloadFooter
          role="farmer"
          reportId={id}
          fileNameBase={pickString(item, 'report_number', 'report_code', 'id')}
          previewRoute="FarmerReportPreview"
        />
      )}
    />
  );
}
