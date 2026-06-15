import { getBaselineAssessments } from '../../api/fieldOfficerApi';
import { ApiListScreen } from '../../components/ApiListScreen';
import { ListItemCard } from '../../components/ListItemCard';

export function FieldOfficerBaselineAssessmentsScreen() {
  return (
    <ApiListScreen
      title="Baseline Assessments"
      subtitle="GET /field-officer/baseline-assessments"
      fetcher={getBaselineAssessments}
      listKeys={['baseline_assessments', 'assessments']}
      emptyTitle="No baseline assessments"
      renderItem={(item) => (
        <ListItemCard
          item={item}
          titleKeys={['assessment_code', 'id']}
          statusKey="status"
          lines={[
            { label: 'Assessment Date', keys: ['assessment_date', 'created_at'] },
            { label: 'Farmer', nested: 'farmer.user.name' },
            { label: 'Farm', nested: 'farm.farm_name' },
          ]}
        />
      )}
    />
  );
}
