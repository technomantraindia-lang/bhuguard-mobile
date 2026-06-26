import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ApiRecordFormScreen } from '../../components/ApiRecordFormScreen';
import { STITCH_FORM_CONFIGS } from '../../config/stitchFormConfig';
import type { FieldOfficerStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'FieldOfficerCreateRecord'>;

export function FieldOfficerCreateRecordScreen({ route }: Props) {
  const config = STITCH_FORM_CONFIGS[route.params.formKey];

  if (!config) {
    return null;
  }

  return <ApiRecordFormScreen config={config} />;
}
