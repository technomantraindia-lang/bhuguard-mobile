import { useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getVisitAssignments } from '../../api/fieldOfficerApi';
import { ApiListScreen } from '../../components/ApiListScreen';
import { ListItemCard } from '../../components/ListItemCard';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { extractList } from '../../utils/apiHelpers';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList>;

export function FieldOfficerVerificationReportsScreen() {
  const navigation = useNavigation<Nav>();

  const fetcher = useMemo(
    () => async () => {
      const data = await getVisitAssignments();
      const assignments = extractList(data as Record<string, unknown>, ['data', 'assignments']);

      return {
        reports: assignments.filter((item) => {
          const report = item.verification_report;

          return report && typeof report === 'object';
        }),
      };
    },
    [],
  );

  return (
    <ApiListScreen
      title="Verification Reports"
      subtitle="Assignments with submitted reports"
      fetcher={fetcher}
      listKeys={['reports']}
      emptyTitle="No verification reports"
      emptyMessage="Complete a visit checklist and submit a report from assignment detail."
      onItemPress={(item) =>
        navigation.navigate('FieldOfficerVerificationReportDetail', { reportId: Number(item.id) })
      }
      renderItem={(item) => (
        <ListItemCard
          item={item}
          titleKeys={['assignment_code', 'id']}
          statusNested="verification_report.admin_review_status"
          lines={[
            { label: 'Recommendation', nested: 'verification_report.officer_recommendation' },
            { label: 'Report code', nested: 'verification_report.report_code' },
            { label: 'Remarks', nested: 'verification_report.admin_remarks' },
          ]}
        />
      )}
    />
  );
}
