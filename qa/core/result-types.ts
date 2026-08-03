export type QaStatus = 'PASS' | 'PARTIAL' | 'FAIL' | 'SKIPPED';

export interface QaTestResult {
  module: string;
  name: string;
  status: QaStatus;
  message: string;
  durationMs: number;
  evidencePath?: string;
  meta?: Record<string, unknown>;
}

export interface QaSuiteSummary {
  suite: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  totals: {
    total: number;
    pass: number;
    partial: number;
    fail: number;
    skipped: number;
  };
  results: QaTestResult[];
  criticalFailed: boolean;
  git?: {
    mobileBranch?: string;
    mobileCommit?: string;
    backendBranch?: string;
    backendCommit?: string;
  };
  environment?: Record<string, string | number | boolean | null>;
}

export function emptyTotals() {
  return { total: 0, pass: 0, partial: 0, fail: 0, skipped: 0 };
}

export function accumulateTotals(results: QaTestResult[]) {
  const totals = emptyTotals();
  totals.total = results.length;
  for (const result of results) {
    if (result.status === 'PASS') totals.pass += 1;
    else if (result.status === 'PARTIAL') totals.partial += 1;
    else if (result.status === 'FAIL') totals.fail += 1;
    else totals.skipped += 1;
  }
  return totals;
}

export function hasCriticalFailure(results: QaTestResult[]): boolean {
  return results.some((r) => r.status === 'FAIL' && r.meta?.critical !== false);
}
