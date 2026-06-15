import { useCallback, useEffect, useMemo, useState } from 'react';

import { getApiErrorMessage } from '../api/authApi';
import {
  getFarmerActivityLogs,
  getFarmerBaselineAssessments,
  getFarmerCarbonCalculations,
  getFarmerDashboard,
  getFarmerFinalReports,
  getFarmerSoilSamples,
  getFarmerVerificationStatus,
} from '../api/farmerApi';
import {
  buildActivityReportItems,
  buildBaselineReportItems,
  buildCarbonReportItems,
  buildCatalogReports,
  buildFinalReportItems,
  buildReportHistory,
  buildReportsSummary,
  buildSoilHealthReportItems,
  buildVerificationReportItems,
  mergeReportItems,
  type FarmerReportHistoryItem,
  type FarmerReportItem,
  type FarmerReportsSummary,
} from '../utils/farmerReportHelpers';
import { extractList, type ApiRecord } from '../utils/apiHelpers';
import { getDownloadedReportIds } from '../utils/reportDownloadStorage';

export function useFarmerReportsData() {
  const [reports, setReports] = useState<FarmerReportItem[]>([]);
  const [history, setHistory] = useState<FarmerReportHistoryItem[]>([]);
  const [summary, setSummary] = useState<FarmerReportsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadedIds, setDownloadedIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        dashboardData,
        finalReportsData,
        carbonData,
        baselineData,
        verificationData,
        activityData,
        soilData,
        storedDownloads,
      ] = await Promise.all([
        getFarmerDashboard(),
        getFarmerFinalReports(),
        getFarmerCarbonCalculations(),
        getFarmerBaselineAssessments(),
        getFarmerVerificationStatus(),
        getFarmerActivityLogs(),
        getFarmerSoilSamples(),
        getDownloadedReportIds(),
      ]);

      void dashboardData;

      const finalReports = extractList(finalReportsData as ApiRecord, ['final_reports']);
      const calculations = extractList(carbonData as ApiRecord, ['carbon_calculations']);
      const baselineAssessments = extractList(baselineData as ApiRecord, ['baseline_assessments', 'assessments']);
      const assignments = extractList(verificationData as ApiRecord, ['assignments']);
      const activityLogs = extractList(activityData as ApiRecord, ['activity_logs', 'logs']);
      const soilSamples = extractList(soilData as ApiRecord, ['soil_samples', 'samples']);

      const apiReports = mergeReportItems([
        buildSoilHealthReportItems(soilSamples, baselineAssessments),
        buildBaselineReportItems(baselineAssessments),
        buildCarbonReportItems(calculations),
        buildVerificationReportItems(assignments),
        buildActivityReportItems(activityLogs),
        buildFinalReportItems(finalReports),
      ]);

      const catalogReports = buildCatalogReports(apiReports);
      const reportSummary = buildReportsSummary(catalogReports, calculations);
      const downloadedCount = storedDownloads.length > 0 ? storedDownloads.length : reportSummary.downloadedCount;

      setReports(catalogReports);
      setHistory(buildReportHistory(catalogReports, activityLogs, assignments));
      setSummary({
        ...reportSummary,
        downloadedCount,
        pendingCount: Math.max(0, reportSummary.totalReports - downloadedCount),
      });
      setDownloadedIds(storedDownloads);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load reports.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const downloadableReports = useMemo(() => reports, [reports]);

  return {
    reports,
    allReports: reports,
    history,
    summary,
    loading,
    error,
    reload: load,
    downloadableReports,
    downloadedIds,
    setDownloadedIds,
  };
}
