import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '../api/authApi';
import {
  getCompanyCarbonCalculations,
  getCompanyDashboard,
  getCompanyProfile,
  getCompanyServiceSubmissions,
} from '../api/companyApi';
import { getAuthUser } from '../storage/authStorage';
import { extractList, pickString, type ApiRecord } from '../utils/apiHelpers';

export interface CompanyOperationalStat {
  id: string;
  icon: 'group' | 'agriculture' | 'pending_actions';
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

export interface CompanyDashboardViewModel {
  companyName: string;
  totalCarbonCredits: string;
  activeProjects: number;
  operationalStats: CompanyOperationalStat[];
  pendingApprovals: CompanyPendingApproval[];
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

function sumCarbonCredits(calculations: ApiRecord[]): number {
  return calculations.reduce((total, item) => total + parseNumber(item.estimated_carbon_credit), 0);
}

function buildPendingApprovals(submissions: ApiRecord[]): CompanyPendingApproval[] {
  const pending = submissions.filter((item) => {
    const status = pickString(item, 'status').toLowerCase();

    return ['draft', 'pending', 'submitted', 'correction_requested', 'under_review'].includes(status);
  });

  return pending.slice(0, 4).map((item) => {
    const serviceName = pickString(item, 'service_name') !== '-'
      ? pickString(item, 'service_name')
      : pickString(item, 'service.name');

    return {
      id: `submission-${pickString(item, 'id')}`,
      title: serviceName !== '-' ? serviceName : `Submission ${pickString(item, 'submission_code', 'id')}`,
      subtitle: `${pickString(item, 'company_site.site_name', 'site_name') !== '-' ? pickString(item, 'company_site.site_name', 'site_name') : 'Company site'} • ${pickString(item, 'status')}`,
      icon: serviceName.toLowerCase().includes('soil') ? 'science' : 'map',
      targetRoute: 'submission',
      targetId: parseNumber(item.id) || undefined,
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
      const [user, dashboardData, profileData, carbonData, submissionsData] = await Promise.all([
        getAuthUser(),
        loadOptional(() => getCompanyDashboard(), { dashboard: {} }),
        loadOptional(() => getCompanyProfile(), { profile: {} }),
        loadOptional(() => getCompanyCarbonCalculations(), {}),
        loadOptional(() => getCompanyServiceSubmissions(), {}),
      ]);

      const dashboard = (dashboardData.dashboard ?? dashboardData) as ApiRecord;
      const profileRoot = (profileData.profile ?? profileData) as ApiRecord;
      const company = (profileRoot.company ?? profileRoot) as ApiRecord;
      const verification = (dashboard.verification_status ?? {}) as ApiRecord;
      const calculations = extractList(carbonData as ApiRecord, ['carbon_calculations']);
      const submissions = extractList(submissionsData as ApiRecord, ['service_submissions', 'submissions', 'data']);

      const totalCredits = sumCarbonCredits(calculations);
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
        activeProjects: parseNumber(dashboard.active_service_submissions_count),
        operationalStats: [
          {
            id: 'sites',
            icon: 'group',
            value: parseNumber(dashboard.sites_count),
            label: 'Active Sites',
          },
          {
            id: 'submissions',
            icon: 'agriculture',
            value: parseNumber(dashboard.active_service_submissions_count),
            label: 'Active Programs',
          },
          {
            id: 'queue',
            icon: 'pending_actions',
            value: pendingQueue,
            label: 'Verification Queue',
            tone: pendingQueue > 0 ? 'alert' : 'default',
          },
        ],
        pendingApprovals,
        taskProgressPercent,
        tasksCompleted,
        tasksTotal: tasksTotal || parseNumber(dashboard.active_service_submissions_count),
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
