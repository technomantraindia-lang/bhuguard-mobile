import { TestContext } from '../core/test-context';
import { runCheck } from '../core/test-runner';
import type { QaSuiteSummary } from '../core/result-types';

export async function runIntegrationSuite(mobileRoot = process.cwd()): Promise<QaSuiteSummary> {
  const ctx = new TestContext('integration', mobileRoot);
  ctx.add(
    await runCheck('Integration', 'Suite scaffold', async () => ({
      status: 'SKIPPED',
      message: 'Jest integration suite not implemented yet (Phase 8).',
    })),
  );
  return ctx.writeSummary();
}
