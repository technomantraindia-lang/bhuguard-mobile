import { TestContext } from '../core/test-context';
import { runCheck } from '../core/test-runner';
import type { QaSuiteSummary } from '../core/result-types';

export async function runUnitSuite(mobileRoot = process.cwd()): Promise<QaSuiteSummary> {
  const ctx = new TestContext('unit', mobileRoot);
  ctx.add(
    await runCheck('Unit', 'Suite scaffold', async () => ({
      status: 'SKIPPED',
      message: 'Jest unit suite not implemented yet (Phase 8).',
    })),
  );
  return ctx.writeSummary();
}
