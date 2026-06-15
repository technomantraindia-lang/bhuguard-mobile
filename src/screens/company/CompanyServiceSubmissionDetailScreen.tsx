import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getCompanyServiceSubmissionDetail } from '../../api/companyApi';
import { ApiDetailScreen } from '../../components/ApiDetailScreen';
import type { CompanyStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<CompanyStackParamList, 'CompanyServiceSubmissionDetail'>;

export function CompanyServiceSubmissionDetailScreen({ route }: Props) {
  const { id } = route.params;

  return (
    <ApiDetailScreen
      title="Service Submission Detail"
      subtitle={`GET /company/service-submissions/${id}`}
      fetcher={() => getCompanyServiceSubmissionDetail(id)}
      rootKeys={['service_submission', 'submission', 'data']}
      fields={[
        { label: 'Submission Code', keys: ['submission_code', 'id'] },
        { label: 'Service', nested: 'service.name' },
        { label: 'Site', keys: ['site_name'] },
        { label: 'Submitted At', keys: ['submitted_at', 'created_at'] },
        { label: 'Status', keys: ['status'] },
      ]}
    />
  );
}
