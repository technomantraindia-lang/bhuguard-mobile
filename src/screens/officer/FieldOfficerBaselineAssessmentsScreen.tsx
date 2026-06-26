import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getBaselineAssessments } from '../../api/fieldOfficerApi';
import { ApiListScreen } from '../../components/ApiListScreen';
import { ListItemCard } from '../../components/ListItemCard';
import type { FieldOfficerStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList>;

export function FieldOfficerBaselineAssessmentsScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <ApiListScreen
      title="Baseline Assessments"
      subtitle="GET /field-officer/baseline-assessments"
      fetcher={getBaselineAssessments}
      listKeys={['baseline_assessments', 'assessments']}
      headerAction={{
        label: 'Add Assessment',
        onPress: () =>
          navigation.navigate('FieldOfficerCreateRecord', { formKey: 'officer_create_baseline' }),
      }}
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
