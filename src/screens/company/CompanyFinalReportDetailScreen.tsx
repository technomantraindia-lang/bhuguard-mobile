import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getCompanyFinalReportDetail } from '../../api/companyApi';
import { ApiDetailScreen } from '../../components/ApiDetailScreen';
import { ReportDetailDownloadFooter } from '../../components/reports/ReportDetailDownloadFooter';
import type { CompanyStackParamList } from '../../navigation/types';
import { pickString, type ApiRecord } from '../../utils/apiHelpers';

type Props = NativeStackScreenProps<CompanyStackParamList, 'CompanyFinalReportDetail'>;

export function CompanyFinalReportDetailScreen({ route }: Props) {
  const { id } = route.params;

  return (
    <ApiDetailScreen
      title="Final Report Detail"
      subtitle="View and download your report"
      fetcher={() => getCompanyFinalReportDetail(id)}
      rootKeys={['final_report', 'data']}
      fields={[
        { label: 'Report Number', keys: ['report_number', 'report_code'] },
        { label: 'Service', keys: ['service_name'] },
        { label: 'Site', keys: ['site_name'] },
        { label: 'Generated At', keys: ['generated_at'] },
        { label: 'Credits', keys: ['estimated_carbon_credit', 'estimated_carbon_credits'] },
        { label: 'Status', keys: ['report_status', 'status'] },
        { label: 'Summary', keys: ['verification_summary', 'carbon_calculation_summary', 'notes'] },
        { label: 'Admin Remarks', keys: ['admin_remarks', 'notes'] },
      ]}
      renderExtra={(item: ApiRecord) => (
        <ReportDetailDownloadFooter
          role="company_user"
          reportId={id}
          fileNameBase={pickString(item, 'report_number', 'report_code', 'id')}
          previewRoute="CompanyReportPreview"
        />
      )}
    />
  );
}
