import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getVisitAssignments } from '../../api/fieldOfficerApi';
import { ApiListScreen } from '../../components/ApiListScreen';
import { AppCard } from '../../components/AppCard';
import { StatusBadge } from '../../components/StatusBadge';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { pickNestedString, pickString } from '../../utils/apiHelpers';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList>;

export function FieldOfficerAssignmentsScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <ApiListScreen
      title="Assigned Visits"
      subtitle="GET /field-officer/assignments"
      fetcher={getVisitAssignments}
      listKeys={['data', 'assignments']}
      emptyTitle="No assignments"
      renderItem={(item) => (
        <AppCard
          title={pickString(item, 'assignment_code', 'id')}
          subtitle={pickNestedString(item, 'service.name')}
          onPress={() =>
            navigation.navigate('FieldOfficerAssignmentDetail', {
              assignmentId: Number(item.id),
            })
          }
        >
          <StatusBadge status={pickString(item, 'assignment_status', 'status')} />
        </AppCard>
      )}
    />
  );
}
