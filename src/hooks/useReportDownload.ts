import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import type { ReportDownloadFormat, ReportRole } from '../api/reportsApi';
import { downloadReportFile } from '../utils/reportFileDownload';

export interface UseReportDownloadOptions {
  role: ReportRole;
  reportId: number | string;
  fileNameBase?: string;
  downloadKey?: string;
}

export function useReportDownload(options: UseReportDownloadOptions) {
  const [downloadingFormat, setDownloadingFormat] = useState<ReportDownloadFormat | null>(null);
  const [lastSuccessMessage, setLastSuccessMessage] = useState<string | null>(null);
  const [lastErrorMessage, setLastErrorMessage] = useState<string | null>(null);

  const download = useCallback(
    async (format: ReportDownloadFormat) => {
      setDownloadingFormat(format);
      setLastErrorMessage(null);
      setLastSuccessMessage(null);

      try {
        const result = await downloadReportFile({
          role: options.role,
          reportId: options.reportId,
          format,
          fileNameBase: options.fileNameBase,
          downloadKey: options.downloadKey,
        });

        if (!result.success) {
          const message = result.message ?? 'Report download is not available yet.';
          setLastErrorMessage(message);
          Alert.alert('Download unavailable', message);
          return result;
        }

        setLastSuccessMessage(result.message ?? 'Report downloaded successfully.');
        Alert.alert('Success', result.message ?? 'Report downloaded successfully.');
        return result;
      } finally {
        setDownloadingFormat(null);
      }
    },
    [options.downloadKey, options.fileNameBase, options.reportId, options.role],
  );

  return {
    downloadingFormat,
    isDownloading: downloadingFormat !== null,
    lastSuccessMessage,
    lastErrorMessage,
    downloadPdf: () => download('pdf'),
    downloadExcel: () => download('excel'),
    downloadDoc: () => download('doc'),
    download,
  };
}
