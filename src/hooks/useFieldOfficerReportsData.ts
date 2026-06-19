import { useCallback, useMemo } from 'react';

import { getFieldOfficerReports } from '../api/fieldOfficerApi';
import { useApiList } from './useApiList';
import {
  buildReportSummary,
  filterReportsByStatus,
  mapFieldOfficerReport,
  matchesReportSearch,
  type FieldOfficerReportFilter,
  type FieldOfficerReportItem,
  type FieldOfficerReportSummary,
} from '../utils/fieldOfficerReportHelpers';
import { extractList, type ApiRecord } from '../utils/apiHelpers';

interface UseFieldOfficerReportsDataOptions {
  searchQuery?: string;
  filter?: FieldOfficerReportFilter;
}

export function useFieldOfficerReportsData(options?: UseFieldOfficerReportsDataOptions) {
  const fetcher = useCallback(async () => {
    const data = await getFieldOfficerReports();
    const records = Array.isArray(data)
      ? (data as ApiRecord[])
      : extractList(data as ApiRecord, ['data', 'reports']);

    return { reports: records };
  }, []);

  const { items, loading, refreshing, error, reload, refresh } = useApiList({
    fetcher,
    listKeys: ['reports'],
  });

  const reports = useMemo(() => items.map((record) => mapFieldOfficerReport(record)), [items]);

  const summary = useMemo<FieldOfficerReportSummary>(() => buildReportSummary(reports), [reports]);

  const filteredReports = useMemo(() => {
    const query = options?.searchQuery?.trim() ?? '';
    const filter = options?.filter ?? 'all';

    const searched = query ? reports.filter((report) => matchesReportSearch(report, query)) : reports;

    return filterReportsByStatus(searched, filter);
  }, [options?.filter, options?.searchQuery, reports]);

  return {
    reports,
    filteredReports,
    summary,
    loading,
    refreshing,
    error,
    reload,
    refresh,
  };
}
