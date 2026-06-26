import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { FarmerStackParamList } from '../../navigation/types';
import { FarmerLiveEvidenceUploadScreen } from '../shared/FarmerLiveEvidenceUploadScreen';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmerUploadEvidence'>;

export function FarmerUploadEvidenceScreen({ route }: Props) {
  return (
    <FarmerLiveEvidenceUploadScreen
      screenKey="add_farmer_evidence"
      farmId={route.params?.farmId}
      weeklyUpdateId={route.params?.weeklyUpdateId}
    />
  );
}
