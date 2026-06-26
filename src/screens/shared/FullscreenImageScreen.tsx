import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { EvidenceFullscreenViewer } from '../../components/evidence/EvidenceFullscreenViewer';

type FullscreenImageParams = {
  FullscreenImage: { uri: string; title?: string };
};

type Props = NativeStackScreenProps<FullscreenImageParams, 'FullscreenImage'>;

export function FullscreenImageScreen({ route, navigation }: Props) {
  const { uri, title } = route.params;

  return (
    <EvidenceFullscreenViewer
      uri={uri}
      title={title ?? 'Evidence Photo'}
      onClose={() => navigation.goBack()}
    />
  );
}
