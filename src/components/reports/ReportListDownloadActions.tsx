import { useState } from 'react';
import { Alert, View } from 'react-native';

import type { ReportDownloadFormat, ReportRole } from '../../api/reportsApi';
import { ReportDownloadActions } from './ReportDownloadActions';
import { downloadReportFile } from '../../utils/reportFileDownload';
import { pickString, type ApiRecord } from '../../utils/apiHelpers';

interface ReportListDownloadActionsProps {
  role: ReportRole;
  item: ApiRecord;
}

export function ReportListDownloadActions({ role, item }: ReportListDownloadActionsProps) {
  const reportId = Number(item.id);
  const fileNameBase = pickString(item, 'report_number', 'report_id', 'report_code', 'id');
  const [downloadingFormat, setDownloadingFormat] = useState<ReportDownloadFormat | null>(null);

  const handleDownload = async (format: ReportDownloadFormat) => {
    setDownloadingFormat(format);

    try {
      const result = await downloadReportFile({
        role,
        reportId,
        format,
        fileNameBase,
        downloadKey: `${role}-${reportId}`,
      });

      if (!result.success) {
        Alert.alert('Download unavailable', result.message ?? 'Report download is not available yet.');
        return;
      }

      Alert.alert('Success', result.message ?? 'Report downloaded successfully');
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <View style={{ marginTop: 8 }}>
      <ReportDownloadActions compact downloadingFormat={downloadingFormat} onDownload={(format) => void handleDownload(format)} />
    </View>
  );
}
