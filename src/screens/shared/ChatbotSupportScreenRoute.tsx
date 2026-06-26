import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { FarmerStackParamList, FieldOfficerStackParamList } from '../../navigation/types';
import { ChatbotSupportScreen } from './ChatbotSupportScreen';

type FarmerProps = NativeStackScreenProps<FarmerStackParamList, 'ChatbotSupport'>;
type OfficerProps = NativeStackScreenProps<FieldOfficerStackParamList, 'ChatbotSupport'>;

export function FarmerChatbotSupportRoute({ route }: FarmerProps) {
  return (
    <ChatbotSupportScreen
      supportRole="farmer"
      sourceModule={route.params?.sourceModule}
    />
  );
}

export function OfficerChatbotSupportRoute({ route }: OfficerProps) {
  return (
    <ChatbotSupportScreen
      supportRole="field_officer"
      sourceModule={route.params?.sourceModule}
    />
  );
}
