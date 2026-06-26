import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '../api/authApi';
import {
  getCompanyDashboard,
  getCompanyProfile,
  getCompanyServiceSubmissions,
} from '../api/companyApi';
import { getAuthUser } from '../storage/authStorage';
import { extractList, pickString, type ApiRecord } from '../utils/apiHelpers';

export interface CompanyOperationalStat {
  id: string;
  icon: 'group' | 'agriculture' | 'pending_actions' | 'description' | 'science' | 'co2';
  value: number;
  label: string;
  tone?: 'default' | 'alert';
}

export interface CompanyPendingApproval {
  id: string;
  title: string;
  subtitle: string;
  icon: 'science' | 'map';
  targetRoute: 'submission' | 'verification';
  targetId?: number;
}

export interface CompanyRecentSubmission {
  id: number;
  title: string;
  subtitle: string;
  status: string;
}

export interface CompanyDashboardViewModel {
  companyName: string;
  totalCarbonCredits: string;
  activeProjects: number;
  sitesCount: number;
  wasteRecordsCount: number;
  biocharRecordsCount: number;
  industrialCarbonRecordsCount: number;
  evidenceUploadsCount: number;
  pendingVerificationCount: number;
  finalReportsCount: number;
  operationalStats: CompanyOperationalStat[];
  pendingApprovals: CompanyPendingApproval[];
  recentSubmissions: CompanyRecentSubmission[];
  taskProgressPercent: number;
  tasksCompleted: number;
  tasksTotal: number;
}

function parseNumber(value: unknown): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCredits(total: number): string {
  if (total >= 1_000_000) {
    return `${(total / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }

  if (total >= 1_000) {
    return `${(total / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }

  return total > 0 ? String(Math.round(total)) : '0';
}

function buildPendingApprovals(submissions: ApiRecord[]): CompanyPendingApproval[] {
  const pending = submissions.filter((item) => {
    const status = pickString(item, 'status').toLowerCase();

    return ['draft', 'pending', 'submitted', 'correction_requested', 'under_review'].includes(status);
  });

  return pending.slice(0, 4).map((item) => {
    const serviceName =
      pickString(item, 'service_name') !== '-'
        ? pickString(item, 'service_name')
        : pickString(item, 'service.name');

    return {
      id: `submission-${pickString(item, 'id')}`,
      title: serviceName !== '-' ? serviceName : `Submission ${pickString(item, 'submission_code', 'id')}`,
      subtitle: `${pickString(item, 'company_site.site_name', 'site_name') !== '-' ? pickString(item, 'company_site.site_name', 'site_name') : 'Company site'} • ${pickString(item, 'status')}`,
      icon: serviceName.toLowerCase().includes('waste') ? 'science' : 'map',
      targetRoute: 'submission',
      targetId: parseNumber(item.id) || undefined,
    };
  });
}

function buildRecentSubmissions(submissions: ApiRecord[]): CompanyRecentSubmission[] {
  return submissions.slice(0, 5).map((item) => {
    const serviceName =
      pickString(item, 'service_name') !== '-'
        ? pickString(item, 'service_name')
        : pickString(item, 'service.name');

    return {
      id: parseNumber(item.id),
      title: serviceName !== '-' ? serviceName : pickString(item, 'submission_code', 'id'),
      subtitle: pickString(item, 'company_site.site_name', 'site_name'),
      status: pickString(item, 'status'),
    };
  });
}

async function loadOptional<T>(loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader();
  } catch {
    return fallback;
  }
}

export function useCompanyDashboardData() {
  const [data, setData] = useState<CompanyDashboardViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [user, dashboardData, profileData, submissionsData] = await Promise.all([
        getAuthUser(),
        getCompanyDashboard(),
        loadOptional(() => getCompanyProfile(), { profile: {} }),
        loadOptional(() => getCompanyServiceSubmissions(), {}),
      ]);

      const dashboard = (dashboardData.dashboard ?? dashboardData) as ApiRecord;
      const profileRoot = (profileData.profile ?? profileData) as ApiRecord;
      const company = (profileRoot.company ?? profileRoot) as ApiRecord;
      const verification = (dashboard.verification_status ?? {}) as ApiRecord;
      const carbonSummary = (dashboard.carbon_calculation_status ?? {}) as ApiRecord;
      const submissions = extractList(submissionsData as ApiRecord, [
        'service_submissions',
        'submissions',
        'data',
      ]);

      const sitesCount = parseNumber(dashboard.sites_count);
      const activeProjects = parseNumber(dashboard.active_service_submissions_count);
      const wasteRecordsCount = parseNumber(dashboard.waste_records_count);
      const biocharRecordsCount = parseNumber(dashboard.biochar_records_count);
      const industrialCarbonRecordsCount = parseNumber(dashboard.industrial_carbon_records_count);
      const evidenceUploadsCount = parseNumber(dashboard.evidence_uploads_count);
      const pendingVerificationCount = parseNumber(dashboard.pending_verification_count);
      const finalReportsCount = parseNumber(dashboard.final_reports_count);

      const totalCredits = parseNumber(carbonSummary.completed) + parseNumber(carbonSummary.approved);
      const pendingQueue =
        parseNumber(verification.pending) +
        parseNumber(verification.submitted_to_admin) +
        parseNumber(verification.correction_requested);

      const tasksTotal = parseNumber(verification.total_assignments);
      const tasksCompleted =
        parseNumber(verification.approved) + parseNumber(verification.submitted_to_admin);
      const taskProgressPercent =
        tasksTotal > 0 ? Math.min(100, Math.round((tasksCompleted / tasksTotal) * 100)) : 0;

      const pendingApprovals = buildPendingApprovals(submissions);

      if (pendingApprovals.length === 0 && pendingQueue > 0) {
        pendingApprovals.push({
          id: 'verification-queue',
          title: 'Verification Review Queue',
          subtitle: `${pendingQueue} item${pendingQueue === 1 ? '' : 's'} awaiting review`,
          icon: 'science',
          targetRoute: 'verification',
        });
      }

      setData({
        companyName:
          pickString(company, 'company_name', 'name') !== '-'
            ? pickString(company, 'company_name', 'name')
            : user?.name ?? 'Company Admin',
        totalCarbonCredits: formatCredits(totalCredits),
        activeProjects,
        sitesCount,
        wasteRecordsCount,
        biocharRecordsCount,
        industrialCarbonRecordsCount,
        evidenceUploadsCount,
        pendingVerificationCount,
        finalReportsCount,
        operationalStats: [
          { id: 'sites', icon: 'group', value: sitesCount, label: 'Active Sites' },
          { id: 'submissions', icon: 'agriculture', value: activeProjects, label: 'Active Submissions' },
          { id: 'waste', icon: 'description', value: wasteRecordsCount, label: 'Waste Records' },
          { id: 'biochar', icon: 'science', value: biocharRecordsCount, label: 'Biochar Records' },
          { id: 'industrial', icon: 'co2', value: industrialCarbonRecordsCount, label: 'Industrial Carbon' },
          {
            id: 'queue',
            icon: 'pending_actions',
            value: pendingVerificationCount || pendingQueue,
            label: 'Pending Verification',
            tone: pendingVerificationCount > 0 ? 'alert' : 'default',
          },
        ],
        pendingApprovals,
        recentSubmissions: buildRecentSubmissions(submissions),
        taskProgressPercent,
        tasksCompleted,
        tasksTotal: tasksTotal || activeProjects,
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load company dashboard.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}
