import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getFarmerSoilSampleDetail } from '../../api/farmerApi';
import { ApiDetailScreen } from '../../components/ApiDetailScreen';
import type { FarmerStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmerSoilSampleDetail'>;

export function FarmerSoilSampleDetailScreen({ route }: Props) {
  const { sampleId } = route.params;

  return (
    <ApiDetailScreen
      title="Soil Sample Detail"
      subtitle={`GET /farmer/soil-samples/${sampleId}`}
      fetcher={() => getFarmerSoilSampleDetail(sampleId)}
      rootKeys={['soil_sample']}
      titleKeys={['sample_code', 'id']}
      statusKeys={['status']}
      fields={[
        { label: 'Sample Code', keys: ['sample_code'] },
        { label: 'Farm', keys: ['farm_name'] },
        { label: 'Sample Date', keys: ['sampling_date'] },
        { label: 'Soil Depth', keys: ['soil_depth'] },
        { label: 'Organic Carbon', keys: ['soil_organic_carbon'] },
        { label: 'pH', keys: ['soil_ph'] },
        { label: 'Nitrogen', keys: ['nitrogen'] },
        { label: 'Phosphorus', keys: ['phosphorus'] },
        { label: 'Potassium', keys: ['potassium'] },
        { label: 'Lab', keys: ['lab_name'] },
        { label: 'Recorded At', keys: ['created_at'] },
      ]}
    />
  );
}
