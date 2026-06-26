import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { ReportRole } from '../../api/reportsApi';
import { ReportDownloadActions } from './ReportDownloadActions';
import { useReportDownload } from '../../hooks/useReportDownload';

interface ReportDetailDownloadFooterProps {
  role: ReportRole;
  reportId: number;
  fileNameBase?: string;
  previewRoute: 'FarmerReportPreview' | 'CompanyReportPreview' | 'FieldOfficerReportPreview';
  previewParamKey?: 'id' | 'reportId';
  disabled?: boolean;
}

export function ReportDetailDownloadFooter({
  role,
  reportId,
  fileNameBase,
  previewRoute,
  previewParamKey = 'id',
  disabled = false,
}: ReportDetailDownloadFooterProps) {
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>();
  const { downloadingFormat, download } = useReportDownload({
    role,
    reportId,
    fileNameBase,
    downloadKey: `${role}-${reportId}`,
  });

  return (
    <ReportDownloadActions
      downloadingFormat={downloadingFormat}
      disabled={disabled}
      onDownload={(format) => void download(format)}
      onPreview={() =>
        navigation.navigate(previewRoute, {
          [previewParamKey]: reportId,
        })
      }
    />
  );
}
