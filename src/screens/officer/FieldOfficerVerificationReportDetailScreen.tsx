import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { FieldOfficerReportDetailScreen } from './FieldOfficerReportDetailScreen';
import type { FieldOfficerStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'FieldOfficerVerificationReportDetail'>;

export function FieldOfficerVerificationReportDetailScreen({ route, navigation }: Props) {
  const { reportId } = route.params;

  return (
    <FieldOfficerReportDetailScreen
      navigation={
        navigation as NativeStackScreenProps<
          FieldOfficerStackParamList,
          'FieldOfficerReportDetail'
        >['navigation']
      }
      route={{
        key: route.key,
        name: 'FieldOfficerReportDetail',
        params: { reportId },
      }}
    />
  );
}
