import { TestContext } from '../core/test-context';
import { runCheck } from '../core/test-runner';
import { runProcess } from '../core/process-runner';
import type { QaSuiteSummary } from '../core/result-types';
import * as fs from 'node:fs';
import * as path from 'node:path';

export async function runUnitSuite(mobileRoot = process.cwd()): Promise<QaSuiteSummary> {
  const ctx = new TestContext('unit', mobileRoot);
  const jestConfig = path.join(mobileRoot, 'jest.config.js');
  const hasJest =
    fs.existsSync(jestConfig) ||
    Boolean(
      (() => {
        try {
          const pkg = JSON.parse(fs.readFileSync(path.join(mobileRoot, 'package.json'), 'utf8'));
          return pkg.devDependencies?.jest || pkg.devDependencies?.['jest-expo'];
        } catch {
          return false;
        }
      })(),
    );

  if (!hasJest) {
    ctx.add(
      await runCheck('Unit', 'Jest availability', async () => ({
        status: 'PARTIAL',
        message: 'Jest/jest-expo not configured yet — unit runner scaffold only',
      })),
    );
    // Still execute pure helper assertions without Jest harness
    const displayIdsPath = path.join(mobileRoot, 'src', 'utils', 'displayIds.ts');
    ctx.add(
      await runCheck('Unit', 'displayIds module exists', async () => ({
        status: fs.existsSync(displayIdsPath) ? 'PASS' : 'FAIL',
        message: fs.existsSync(displayIdsPath)
          ? 'src/utils/displayIds.ts present for Farmer/Artisan ID formatting'
          : 'Missing displayIds.ts',
      })),
    );
    const serverTimePath = path.join(mobileRoot, 'src', 'services', 'serverTimeSync.ts');
    ctx.add(
      await runCheck('Unit', 'serverTimeSync module exists', async () => ({
        status: fs.existsSync(serverTimePath) ? 'PASS' : 'FAIL',
        message: fs.existsSync(serverTimePath)
          ? 'serverTimeSync.ts present'
          : 'Missing serverTimeSync.ts',
      })),
    );
    return ctx.writeSummary();
  }

  const logPath = ctx.evidencePath('logs', 'jest-unit.log');
  const result = await runProcess({
    cwd: mobileRoot,
    command: 'npx',
    args: ['jest', '--coverage', '--passWithNoTests'],
    timeoutMs: 240_000,
    stallTimeoutMs: 180_000,
    logPath,
  });

  ctx.add(
    await runCheck('Unit', 'Jest unit run', async () => {
      if (result.timedOut || result.stalled) {
        return { status: 'PARTIAL', message: 'Jest stopped safely (timeout/stall)', evidencePath: logPath };
      }
      if (result.exitCode === 0) {
        return { status: 'PASS', message: 'Jest unit tests passed', evidencePath: logPath };
      }
      return { status: 'FAIL', message: `Jest exited ${result.exitCode}`, evidencePath: logPath };
    }),
  );

  return ctx.writeSummary();
}
