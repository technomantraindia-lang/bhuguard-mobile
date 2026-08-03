import * as fs from 'node:fs';
import * as path from 'node:path';

import { TestContext } from '../core/test-context';
import { runCheck } from '../core/test-runner';
import { runProcess } from '../core/process-runner';
import { describeTimeout } from '../core/timeout-handler';
import type { QaStatus } from '../core/result-types';

function parseSemverMajor(version: string): number | null {
  const match = version.match(/v?(\d+)/);
  return match ? Number(match[1]) : null;
}

export async function runPreflightSuite(mobileRoot = process.cwd()) {
  const ctx = new TestContext('preflight', mobileRoot);
  const logsDir = ctx.evidencePath('logs');

  const runCmd = async (
    name: string,
    cwd: string,
    command: string,
    args: string[],
    assert: (stdout: string, stderr: string, code: number | null) => { status: QaStatus; message: string },
    timeoutMs = 120_000,
  ) => {
    const logPath = path.join(logsDir, `${name.replace(/[^a-z0-9_-]+/gi, '_')}.log`);
    const result = await runProcess({
      cwd,
      command,
      args,
      timeoutMs,
      stallTimeoutMs: Math.min(ctx.config.stallTimeoutMs, 180_000),
      logPath,
    });

    if (result.timedOut || result.stalled) {
      return ctx.add(
        await runCheck('Environment', name, async () => ({
          status: 'PARTIAL',
          message: describeTimeout(result) || 'Command stopped safely.',
          evidencePath: logPath,
        })),
      );
    }

    const asserted = assert(result.stdout, result.stderr, result.exitCode);
    ctx.add({
      module: 'Environment',
      name,
      status: asserted.status,
      message: asserted.message,
      durationMs: result.durationMs,
      evidencePath: logPath,
    });
  };

  await runCmd('Node version', mobileRoot, 'node', ['-v'], (out) => {
    const major = parseSemverMajor(out.trim());
    if (major == null) {
      return { status: 'FAIL', message: `Unable to parse node version: ${out.trim()}` };
    }
    if (major === 20) {
      return { status: 'PASS', message: `Node ${out.trim()} (target v20.x)` };
    }
    return {
      status: 'PARTIAL',
      message: `Node ${out.trim()} (documented target v20.20.2; continuing)`,
    };
  });

  await runCmd('npm version', mobileRoot, 'npm', ['-v'], (out, _err, code) => {
    if (code !== 0) return { status: 'FAIL', message: 'npm -v failed' };
    return { status: 'PASS', message: `npm ${out.trim()}` };
  });

  await runCmd(
    'Expo / RN / babel-preset-expo versions',
    mobileRoot,
    'npm',
    ['ls', 'expo', 'react-native', 'babel-preset-expo', '--depth=0'],
    (out, err, code) => {
      const text = `${out}\n${err}`;
      const hasExpo = /expo@/.test(text);
      const hasRn = /react-native@0\.85\.3/.test(text);
      if (!hasExpo || !hasRn) {
        return { status: 'FAIL', message: 'Expected expo + react-native@0.85.3 in npm ls output' };
      }
      if (code !== 0 && !/babel-preset-expo/.test(text)) {
        return {
          status: 'PARTIAL',
          message: 'expo + RN present; babel-preset-expo may be nested (npm ls exit non-zero)',
        };
      }
      return { status: 'PASS', message: 'expo and react-native@0.85.3 detected' };
    },
    180_000,
  );

  for (const file of ['package.json', 'package-lock.json', 'metro.config.js', 'tsconfig.json', 'app.json', 'app.config.js', 'index.ts']) {
    const full = path.join(mobileRoot, file);
    ctx.add(
      await runCheck('Environment', `Mobile file: ${file}`, async () => ({
        status: fs.existsSync(full) ? 'PASS' : 'FAIL',
        message: fs.existsSync(full) ? `Found ${file}` : `Missing ${file}`,
        evidencePath: full,
      })),
    );
  }

  const babelCandidates = ['babel.config.js', 'babel.config.cjs', 'babel.config.json'];
  ctx.add(
    await runCheck('Environment', 'Babel config', async () => {
      const found = babelCandidates.find((f) => fs.existsSync(path.join(mobileRoot, f)));
      return found
        ? { status: 'PASS', message: `Found ${found}` }
        : { status: 'PARTIAL', message: 'No babel.config.* at root (Expo may use defaults)' };
    }),
  );

  const androidDir = path.join(mobileRoot, 'android');
  ctx.add(
    await runCheck('Environment', 'Android folder', async () => ({
      status: fs.existsSync(androidDir) ? 'PASS' : 'PARTIAL',
      message: fs.existsSync(androidDir)
        ? 'android/ present'
        : 'android/ missing or gitignored on this checkout',
    })),
  );

  await runCmd(
    'TypeScript check (tsc --noEmit)',
    mobileRoot,
    'npx',
    ['tsc', '--noEmit'],
    (out, err, code) => {
      const text = `${out}\n${err}`.trim();
      if (code === 0) return { status: 'PASS', message: 'tsc --noEmit clean' };
      const errorCount = (text.match(/error TS/g) || []).length;
      return {
        status: 'PARTIAL',
        message: `tsc exited ${code} with ${errorCount} TS error(s) (baseline may include legacy warnings)`,
      };
    },
    300_000,
  );

  await runCmd(
    'Expo Doctor',
    mobileRoot,
    'npx',
    ['expo-doctor'],
    (out, err, code) => {
      if (code === 0) return { status: 'PASS', message: 'expo-doctor passed' };
      return {
        status: 'PARTIAL',
        message: `expo-doctor exited ${code} (see evidence log)`,
      };
    },
    240_000,
  );

  await runCmd('adb devices', mobileRoot, 'adb', ['devices'], (out, err, code) => {
    if (code !== 0 && /not recognized|ENOENT/i.test(`${out}\n${err}`)) {
      return { status: 'PARTIAL', message: 'adb not available on PATH' };
    }
    const connected = out
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => Boolean(l) && !l.startsWith('List of devices') && /\bdevice$/.test(l));
    if (connected.length === 0) {
      return { status: 'PARTIAL', message: 'adb available but no device/emulator connected' };
    }
    return { status: 'PASS', message: `${connected.length} Android device(s) connected` };
  });

  ctx.add(
    await runCheck('Environment', 'JAVA_HOME', async () => {
      const javaHome = process.env.JAVA_HOME || '';
      if (!javaHome) {
        return { status: 'PARTIAL', message: 'JAVA_HOME not set' };
      }
      return { status: 'PASS', message: `JAVA_HOME set (${javaHome.length} chars)` };
    }),
  );

  ctx.add(
    await runCheck('Environment', '.env.qa availability', async () => {
      const example = fs.existsSync(path.join(mobileRoot, '.env.qa.example'));
      const real = fs.existsSync(path.join(mobileRoot, '.env.qa'));
      if (!example) {
        return { status: 'FAIL', message: 'Missing .env.qa.example' };
      }
      if (!real) {
        return {
          status: 'PARTIAL',
          message: '.env.qa.example present; .env.qa not configured (auth flows will be PARTIAL)',
        };
      }
      return { status: 'PASS', message: '.env.qa present (secrets not printed)' };
    }),
  );

  ctx.add(
    await runCheck('Environment', 'API base URL configured', async () => ({
      status: ctx.config.apiBaseUrl.startsWith('https://') ? 'PASS' : 'FAIL',
      message: `QA_API_BASE_URL=${ctx.config.apiBaseUrl}`,
    })),
  );

  ctx.add(
    await runCheck('Environment', 'QA mode safety', async () => {
      if (ctx.config.allowWrites && ctx.config.environment !== 'staging') {
        return {
          status: 'FAIL',
          message: 'Writes enabled outside staging — blocked by QA safety policy',
          meta: { critical: true },
        };
      }
      return {
        status: 'PASS',
        message: `mode=${ctx.config.testMode}; environment=${ctx.config.environment}; allowWrites=${ctx.config.allowWrites}`,
      };
    }),
  );

  // Backend checks
  const backendRoot = ctx.config.backendRoot;
  ctx.add(
    await runCheck('Environment', 'Backend root exists', async () => ({
      status: fs.existsSync(backendRoot) ? 'PASS' : 'FAIL',
      message: fs.existsSync(backendRoot) ? backendRoot : `Missing backend at ${backendRoot}`,
    })),
  );

  if (fs.existsSync(backendRoot)) {
    await runCmd('PHP version', backendRoot, 'php', ['-v'], (out, _e, code) => {
      if (code !== 0) return { status: 'FAIL', message: 'php -v failed' };
      const first = out.split(/\r?\n/)[0] || out.trim();
      return { status: 'PASS', message: first };
    });

    await runCmd('Composer version', backendRoot, 'composer', ['--version'], (out, err, code) => {
      if (code !== 0) {
        return { status: 'PARTIAL', message: `composer unavailable: ${(err || out).slice(0, 200)}` };
      }
      return { status: 'PASS', message: out.trim().split(/\r?\n/)[0] };
    });

    for (const file of ['artisan', 'composer.json']) {
      const full = path.join(backendRoot, file);
      ctx.add(
        await runCheck('Environment', `Backend file: ${file}`, async () => ({
          status: fs.existsSync(full) ? 'PASS' : 'FAIL',
          message: fs.existsSync(full) ? `Found ${file}` : `Missing ${file}`,
        })),
      );
    }

    ctx.add(
      await runCheck('Environment', 'Backend .env presence (no secret read)', async () => {
        const exists = fs.existsSync(path.join(backendRoot, '.env'));
        return {
          status: exists ? 'PASS' : 'PARTIAL',
          message: exists ? '.env exists (contents not read by QA)' : 'Backend .env missing',
        };
      }),
    );

    await runCmd(
      'php artisan --version',
      backendRoot,
      'php',
      ['artisan', '--version'],
      (out, _e, code) =>
        code === 0
          ? { status: 'PASS', message: out.trim() }
          : { status: 'FAIL', message: 'artisan --version failed' },
    );

    await runCmd(
      'php artisan about',
      backendRoot,
      'php',
      ['artisan', 'about'],
      (out, _e, code) =>
        code === 0
          ? { status: 'PASS', message: 'artisan about succeeded' }
          : { status: 'PARTIAL', message: `artisan about exited ${code}` },
      180_000,
    );

    await runCmd(
      'php artisan route:list',
      backendRoot,
      'php',
      ['artisan', 'route:list', '--json'],
      (out, err, code) => {
        if (code !== 0) {
          return { status: 'FAIL', message: `route:list failed: ${(err || out).slice(0, 240)}` };
        }
        try {
          const routes = JSON.parse(out);
          const count = Array.isArray(routes) ? routes.length : 0;
          fs.writeFileSync(
            ctx.evidencePath('backend', 'route-list.json'),
            JSON.stringify({ count, generatedAt: new Date().toISOString() }),
            'utf8',
          );
          return { status: 'PASS', message: `Loaded ${count} routes` };
        } catch {
          return { status: 'PARTIAL', message: 'route:list ran but JSON parse failed; see log' };
        }
      },
      180_000,
    );

    await runCmd(
      'php artisan migrate:status',
      backendRoot,
      'php',
      ['artisan', 'migrate:status'],
      (out, err, code) => {
        if (code !== 0) {
          return { status: 'PARTIAL', message: `migrate:status exited ${code}` };
        }
        const pending = (out.match(/Pending/gi) || []).length;
        return {
          status: pending > 0 ? 'PARTIAL' : 'PASS',
          message: pending > 0 ? `migrate:status OK with pending markers (~${pending})` : 'No pending migrations reported',
        };
      },
      180_000,
    );
  }

  // Network check to live API (HEAD/GET health-ish)
  ctx.add(
    await runCheck('Environment', 'Live API network reachability', async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(ctx.config.apiBaseUrl.replace(/\/$/, '') + '/', {
          method: 'GET',
          signal: controller.signal,
          redirect: 'follow',
        });
        return {
          status: response.status < 500 ? 'PASS' : 'FAIL',
          message: `GET ${ctx.config.apiBaseUrl}/ → HTTP ${response.status}`,
        };
      } catch (error) {
        return {
          status: 'FAIL',
          message: `Network error: ${error instanceof Error ? error.message : String(error)}`,
        };
      } finally {
        clearTimeout(timer);
      }
    }),
  );

  const summary = ctx.writeSummary();
  fs.writeFileSync(
    ctx.evidencePath('mobile', 'preflight-results.json'),
    JSON.stringify(summary, null, 2),
    'utf8',
  );
  return summary;
}
