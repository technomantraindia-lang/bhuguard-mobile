import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ApiRecordFormScreen } from '../../components/ApiRecordFormScreen';
import { ErrorState } from '../../components/ErrorState';
import { COMPANY_FORM_CONFIGS } from '../../config/stitchFormConfig';
import type { CompanyStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<CompanyStackParamList, 'CompanyCreateRecord'>;

export function CompanyCreateRecordScreen({ route, navigation }: Props) {
  const config = COMPANY_FORM_CONFIGS[route.params.formKey];

  if (!config) {
    return (
      <ErrorState
        message="This form is not configured yet."
        onRetry={() => navigation.goBack()}
      />
    );
  }

  return <ApiRecordFormScreen config={config} />;
}
