import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { FarmerStackParamList, FieldOfficerStackParamList } from '../../navigation/types';
import { SupportChatScreen } from './SupportChatScreen';

type FarmerProps = NativeStackScreenProps<FarmerStackParamList, 'SupportChat'>;
type OfficerProps = NativeStackScreenProps<FieldOfficerStackParamList, 'SupportChat'>;

export function SupportChatScreenRoute({ route }: FarmerProps | OfficerProps) {
  return <SupportChatScreen threadId={route.params.threadId} />;
}
