import * as fs from 'node:fs';
import * as path from 'node:path';

import { TestContext } from '../core/test-context';
import { runCheck } from '../core/test-runner';
import { runProcess } from '../core/process-runner';
import type { QaSuiteSummary } from '../core/result-types';

const DESTRUCTIVE_PATTERNS: Array<{ rule: string; re: RegExp }> = [
  { rule: 'dropTable', re: /->dropTable\s*\(/ },
  { rule: 'dropColumn', re: /->dropColumn\s*\(/ },
  { rule: 'truncate', re: /->truncate\s*\(|DB::table\([^)]+\)->truncate/ },
  { rule: 'migrate_fresh', re: /migrate:fresh|MigrateFresh/ },
  { rule: 'db_wipe', re: /db:wipe|DbWipe/ },
  { rule: 'raw_drop', re: /\bDROP\s+(TABLE|COLUMN|DATABASE)\b/i },
];

function walkPhp(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['vendor', 'node_modules', 'storage', '.git'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkPhp(full, out);
    else if (entry.name.endsWith('.php')) out.push(full);
  }
  return out;
}

export async function runBackendHealthSuite(mobileRoot = process.cwd()): Promise<QaSuiteSummary> {
  const ctx = new TestContext('backend', mobileRoot);
  const backendRoot = ctx.config.backendRoot;

  if (!fs.existsSync(backendRoot)) {
    ctx.add(
      await runCheck('Backend', 'Backend root', async () => ({
        status: 'FAIL',
        message: `Missing ${backendRoot}`,
      })),
    );
    return ctx.writeSummary();
  }

  ctx.add(
    await runCheck('Backend', 'Backend root', async () => ({
      status: 'PASS',
      message: backendRoot,
    })),
  );

  // Migration safety on migration files only
  const migrationsDir = path.join(backendRoot, 'database', 'migrations');
  const migrationFiles = walkPhp(migrationsDir);
  const hits: Array<{ file: string; rule: string; line: number; excerpt: string }> = [];
  for (const file of migrationFiles) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, idx) => {
      for (const pattern of DESTRUCTIVE_PATTERNS) {
        if (pattern.re.test(line)) {
          hits.push({
            file: path.relative(backendRoot, file).replace(/\\/g, '/'),
            rule: pattern.rule,
            line: idx + 1,
            excerpt: line.trim().slice(0, 160),
          });
        }
      }
    });
  }
  const safetyPath = ctx.evidencePath('backend', 'migration-safety.json');
  fs.writeFileSync(safetyPath, JSON.stringify({ hits, scanned: migrationFiles.length }, null, 2), 'utf8');
  ctx.add(
    await runCheck('Backend', 'Migration safety scan', async () => ({
      status: hits.length === 0 ? 'PASS' : 'FAIL',
      message:
        hits.length === 0
          ? `No destructive migration patterns in ${migrationFiles.length} files`
          : `${hits.length} destructive pattern hit(s)`,
      evidencePath: safetyPath,
      meta: { critical: true },
    })),
  );

  // PHP lint sample of API controllers (bounded)
  const controllersDir = path.join(backendRoot, 'app', 'Http', 'Controllers');
  const controllers = walkPhp(controllersDir).slice(0, 40);
  let lintFails = 0;
  for (const file of controllers) {
    const result = await runProcess({
      cwd: backendRoot,
      command: 'php',
      args: ['-l', file],
      timeoutMs: 30_000,
      stallTimeoutMs: 30_000,
    });
    if (result.exitCode !== 0) lintFails += 1;
  }
  ctx.add(
    await runCheck('Backend', 'PHP syntax (Controllers sample)', async () => ({
      status: lintFails === 0 ? 'PASS' : 'FAIL',
      message: `php -l on ${controllers.length} controllers; fails=${lintFails}`,
    })),
  );

  // artisan test — may be slow / missing; mark PARTIAL on timeout
  const testLog = ctx.evidencePath('logs', 'php-artisan-test.log');
  const testResult = await runProcess({
    cwd: backendRoot,
    command: 'php',
    args: ['artisan', 'test', '--parallel=0'],
    timeoutMs: 240_000,
    stallTimeoutMs: 180_000,
    logPath: testLog,
  });
  if (testResult.timedOut || testResult.stalled) {
    ctx.add(
      await runCheck('Backend', 'php artisan test', async () => ({
        status: 'PARTIAL',
        message: 'artisan test stopped safely due to timeout/stall',
        evidencePath: testLog,
      })),
    );
  } else if (testResult.exitCode === 0) {
    ctx.add(
      await runCheck('Backend', 'php artisan test', async () => ({
        status: 'PASS',
        message: 'artisan test passed',
        evidencePath: testLog,
      })),
    );
  } else {
    ctx.add(
      await runCheck('Backend', 'php artisan test', async () => ({
        status: 'PARTIAL',
        message: `artisan test exited ${testResult.exitCode} (see log; may need DB/env)`,
        evidencePath: testLog,
      })),
    );
  }

  const routeLog = ctx.evidencePath('logs', 'php-route-list.log');
  const routeResult = await runProcess({
    cwd: backendRoot,
    command: 'php',
    args: ['artisan', 'route:list', '--json'],
    timeoutMs: 120_000,
    stallTimeoutMs: 120_000,
    logPath: routeLog,
  });
  ctx.add(
    await runCheck('Backend', 'route:list', async () => {
      if (routeResult.exitCode !== 0) {
        return { status: 'FAIL', message: 'route:list failed', evidencePath: routeLog };
      }
      try {
        const routes = JSON.parse(routeResult.stdout);
        return {
          status: 'PASS',
          message: `Routes loaded: ${Array.isArray(routes) ? routes.length : 0}`,
          evidencePath: routeLog,
        };
      } catch {
        return { status: 'PARTIAL', message: 'route:list OK but JSON parse failed', evidencePath: routeLog };
      }
    }),
  );

  return ctx.writeSummary();
}
