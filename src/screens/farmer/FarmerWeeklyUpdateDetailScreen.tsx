import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getFarmerWeeklyUpdateDetail } from '../../api/farmerApi';
import { ApiDetailScreen } from '../../components/ApiDetailScreen';
import type { FarmerStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmerWeeklyUpdateDetail'>;

export function FarmerWeeklyUpdateDetailScreen({ route }: Props) {
  const { updateId } = route.params;

  return (
    <ApiDetailScreen
      title="Weekly Update Detail"
      subtitle={`GET /farmer/weekly-updates/${updateId}`}
      fetcher={() => getFarmerWeeklyUpdateDetail(updateId)}
      rootKeys={['weekly_update', 'data']}
      fields={[
        { label: 'Update Date', keys: ['update_date'] },
        { label: 'Week Number', keys: ['week_number'] },
        { label: 'Activity', keys: ['activity_done'] },
        { label: 'Crop Stage', keys: ['crop_or_stage'] },
        { label: 'Farm', nested: 'farm.farm_name' },
        { label: 'Status', keys: ['status'] },
      ]}
    />
  );
}
