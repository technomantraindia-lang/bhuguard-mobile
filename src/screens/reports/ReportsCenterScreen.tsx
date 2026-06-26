import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { CompanyStackParamList, FarmerStackParamList, FieldOfficerStackParamList } from '../../navigation/types';
import { ReportPreviewScreen } from './ReportPreviewScreen';

type FarmerProps = NativeStackScreenProps<FarmerStackParamList, 'FarmerReportPreview'>;
type CompanyProps = NativeStackScreenProps<CompanyStackParamList, 'CompanyReportPreview'>;
type OfficerProps = NativeStackScreenProps<FieldOfficerStackParamList, 'FieldOfficerReportPreview'>;

export function FarmerReportPreviewScreen({ route }: FarmerProps) {
  return <ReportPreviewScreen role="farmer" reportId={route.params.id} title={route.params.title} />;
}

export function CompanyReportPreviewScreen({ route }: CompanyProps) {
  return <ReportPreviewScreen role="company_user" reportId={route.params.id} title={route.params.title} />;
}

export function FieldOfficerReportPreviewScreen({ route }: OfficerProps) {
  return (
    <ReportPreviewScreen
      role="field_officer"
      reportId={route.params.reportId}
      title={route.params.title}
    />
  );
}
