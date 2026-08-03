import { TestContext } from '../core/test-context';
import { runCheck } from '../core/test-runner';
import type { QaSuiteSummary } from '../core/result-types';

export async function runE2eSuite(mobileRoot = process.cwd()): Promise<QaSuiteSummary> {
  const ctx = new TestContext('e2e', mobileRoot);
  ctx.add(
    await runCheck('E2E', 'Suite scaffold', async () => ({
      status: 'SKIPPED',
      message: 'Maestro E2E suite not implemented yet (Phase 10).',
    })),
  );
  return ctx.writeSummary();
}
