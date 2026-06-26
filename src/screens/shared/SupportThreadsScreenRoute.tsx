import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { FarmerStackParamList, FieldOfficerStackParamList } from '../../navigation/types';
import type { SupportRole } from '../../constants/supportCategories';
import { SupportThreadsScreen } from './SupportThreadsScreen';

type FarmerProps = NativeStackScreenProps<FarmerStackParamList, 'SupportThreads'>;
type OfficerProps = NativeStackScreenProps<FieldOfficerStackParamList, 'SupportThreads'>;

export function FarmerSupportThreadsRoute({ route }: FarmerProps) {
  return <SupportThreadsScreen supportRole={(route.params?.supportRole ?? 'farmer') as SupportRole} />;
}

export function OfficerSupportThreadsRoute({ route }: OfficerProps) {
  return <SupportThreadsScreen supportRole={(route.params?.supportRole ?? 'field_officer') as SupportRole} />;
}
