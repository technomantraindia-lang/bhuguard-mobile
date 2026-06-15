import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getVerificationReportDetail } from '../../api/fieldOfficerApi';
import { ApiDetailScreen } from '../../components/ApiDetailScreen';
import type { FieldOfficerStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'FieldOfficerVerificationReportDetail'>;

export function FieldOfficerVerificationReportDetailScreen({ route }: Props) {
  const { reportId } = route.params;

  return (
    <ApiDetailScreen
      title="Verification Report Detail"
      subtitle={`GET /field-officer/assignments/${reportId}/report`}
      fetcher={() => getVerificationReportDetail(reportId)}
      rootKeys={['report', 'verification_report', 'data']}
      fields={[
        { label: 'Report Code', keys: ['report_code', 'id'] },
        { label: 'Recommendation', keys: ['officer_recommendation'] },
        { label: 'Admin Review', keys: ['admin_review_status'] },
        { label: 'Admin Remarks', keys: ['admin_remarks'] },
        { label: 'Submitted At', keys: ['submitted_at', 'created_at'] },
      ]}
    />
  );
}
