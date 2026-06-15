import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getFarmerBaselineAssessments } from '../../api/farmerApi';
import { ApiListScreen } from '../../components/ApiListScreen';
import { ListItemCard } from '../../components/ListItemCard';
import type { FarmerStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<FarmerStackParamList>;

export function FarmerBaselineAssessmentsScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <ApiListScreen
      title="Baseline Assessments"
      subtitle="GET /farmer/baseline-assessments"
      fetcher={getFarmerBaselineAssessments}
      listKeys={['baseline_assessments', 'assessments']}
      emptyTitle="No baseline assessments"
      onItemPress={(item) =>
        navigation.navigate('StitchScreen', {
          screenKey: 'baseline_detail',
          itemId: Number(item?.id ?? 0),
        })
      }
      renderItem={(item) => (
        <ListItemCard
          item={item}
          titleKeys={['assessment_code', 'id']}
          statusKey="status"
          lines={[
            { label: 'Assessment Date', keys: ['assessment_date', 'created_at'] },
            { label: 'Farm', nested: 'farm.farm_name' },
            { label: 'Officer', nested: 'field_officer.name' },
          ]}
        />
      )}
    />
  );
}
