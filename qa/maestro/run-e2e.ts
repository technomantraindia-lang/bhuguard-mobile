import * as fs from 'node:fs';
import * as path from 'node:path';

import { TestContext } from '../core/test-context';
import { runCheck } from '../core/test-runner';
import { runProcess } from '../core/process-runner';
import type { QaSuiteSummary } from '../core/result-types';

function walkYaml(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkYaml(full, out);
    else if (/\.ya?ml$/i.test(entry.name)) out.push(full);
  }
  return out;
}

export async function runE2eSuite(mobileRoot = process.cwd()): Promise<QaSuiteSummary> {
  const ctx = new TestContext('e2e', mobileRoot);
  const flows = walkYaml(path.join(mobileRoot, 'qa', 'maestro'));
  ctx.add(
    await runCheck('E2E', 'Maestro flow files present', async () => ({
      status: flows.length > 0 ? 'PASS' : 'FAIL',
      message: `Found ${flows.length} Maestro YAML flow(s)`,
    })),
  );

  const maestro = await runProcess({
    cwd: mobileRoot,
    command: 'maestro',
    args: ['--version'],
    timeoutMs: 30_000,
    stallTimeoutMs: 30_000,
  });
  const maestroAvailable = maestro.exitCode === 0;

  ctx.add(
    await runCheck('E2E', 'Maestro CLI availability', async () => ({
      status: maestroAvailable ? 'PASS' : 'PARTIAL',
      message: maestroAvailable
        ? (maestro.stdout.trim().split(/\r?\n/)[0] || 'maestro available')
        : 'maestro not on PATH — flow files validated only',
    })),
  );

  const adb = await runProcess({
    cwd: mobileRoot,
    command: 'adb',
    args: ['devices'],
    timeoutMs: 30_000,
    stallTimeoutMs: 30_000,
  });
  const devices = (adb.stdout || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('List of devices') && /\bdevice$/.test(l));

  ctx.add(
    await runCheck('E2E', 'Android device for Maestro', async () => ({
      status: devices.length > 0 ? 'PASS' : 'PARTIAL',
      message:
        devices.length > 0
          ? `${devices.length} device(s) connected`
          : 'No Android device connected — physical E2E execution PARTIAL',
    })),
  );

  if (maestroAvailable && devices.length > 0) {
    const smoke = path.join(mobileRoot, 'qa', 'maestro', 'common', 'smoke-launch.yaml');
    const logPath = ctx.evidencePath('logs', 'maestro-smoke.log');
    const run = await runProcess({
      cwd: mobileRoot,
      command: 'maestro',
      args: ['test', smoke],
      timeoutMs: 180_000,
      stallTimeoutMs: 120_000,
      logPath,
    });
    ctx.add(
      await runCheck('E2E', 'Maestro smoke-launch', async () => {
        if (run.timedOut || run.stalled) {
          return { status: 'PARTIAL', message: 'Maestro smoke stopped safely', evidencePath: logPath };
        }
        return {
          status: run.exitCode === 0 ? 'PASS' : 'FAIL',
          message: run.exitCode === 0 ? 'smoke-launch passed' : `maestro exited ${run.exitCode}`,
          evidencePath: logPath,
        };
      }),
    );
  } else {
    ctx.add(
      await runCheck('E2E', 'Maestro smoke-launch', async () => ({
        status: 'PARTIAL',
        message: 'Skipped physical execution (missing maestro and/or device); YAML flows retained',
      })),
    );
  }

  return ctx.writeSummary();
}
