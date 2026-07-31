import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { FarmerStackParamList, FieldOfficerStackParamList } from '../../navigation/types';
import { SupportChatScreen } from './SupportChatScreen';

type FarmerProps = NativeStackScreenProps<FarmerStackParamList, 'SupportChat'>;
type OfficerProps = NativeStackScreenProps<FieldOfficerStackParamList, 'SupportChat'>;

export function SupportChatScreenRoute({ route }: FarmerProps | OfficerProps) {
  const threadId = route?.params?.threadId ?? null;

  if (threadId == null) {
    return null;
  }

  return <SupportChatScreen threadId={threadId} />;
}
