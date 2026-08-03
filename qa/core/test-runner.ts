import type { QaStatus, QaTestResult } from './result-types';

export async function runCheck(
  module: string,
  name: string,
  fn: () => Promise<{ status: QaStatus; message: string; evidencePath?: string; meta?: Record<string, unknown> }>,
): Promise<QaTestResult> {
  const started = Date.now();
  try {
    const outcome = await fn();
    return {
      module,
      name,
      status: outcome.status,
      message: outcome.message,
      durationMs: Date.now() - started,
      evidencePath: outcome.evidencePath,
      meta: outcome.meta,
    };
  } catch (error) {
    return {
      module,
      name,
      status: 'FAIL',
      message: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - started,
      meta: { critical: true },
    };
  }
}
