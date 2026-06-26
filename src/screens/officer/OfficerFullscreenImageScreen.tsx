import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { EvidenceFullscreenViewer } from '../../components/evidence/EvidenceFullscreenViewer';
import type { FieldOfficerStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'OfficerFullscreenImage'>;

export function OfficerFullscreenImageScreen({ route, navigation }: Props) {
  const { uri, title } = route.params;

  return (
    <EvidenceFullscreenViewer
      uri={uri}
      title={title ?? 'Evidence Photo'}
      onClose={() => navigation.goBack()}
    />
  );
}
