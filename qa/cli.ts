#!/usr/bin/env node
import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

import { resolveQaConfig } from './config/qa.config';
import { writeHtmlReport, writeJsonSummary, writeJunit, writeMarkdownReport } from './reporters/html-reporter';
import type { QaSuiteSummary } from './core/result-types';

async function loadSuite(name: string): Promise<QaSuiteSummary> {
  const mobileRoot = process.cwd();
  switch (name) {
    case 'preflight': {
      const mod = await import('./preflight/environment-check');
      return mod.runPreflightSuite(mobileRoot);
    }
    case 'source': {
      const mod = await import('./source-health/import-check');
      return mod.runSourceHealthSuite(mobileRoot);
    }
    case 'api': {
      const mod = await import('./api/api-health-runner');
      return mod.runApiHealthSuite(mobileRoot);
    }
    case 'backend': {
      const mod = await import('./backend/laravel-health-runner');
      return mod.runBackendHealthSuite(mobileRoot);
    }
    case 'navigation': {
      const mod = await import('./navigation/broken-navigation-check');
      return mod.runNavigationHealthSuite(mobileRoot);
    }
    case 'unit': {
      const mod = await import('./unit/run-unit');
      return mod.runUnitSuite(mobileRoot);
    }
    case 'integration': {
      const mod = await import('./integration/run-integration');
      return mod.runIntegrationSuite(mobileRoot);
    }
    case 'e2e': {
      const mod = await import('./maestro/run-e2e');
      return mod.runE2eSuite(mobileRoot);
    }
    case 'report': {
      return regenerateReports(mobileRoot);
    }
    default:
      throw new Error(`Unknown QA suite: ${name}`);
  }
}

function collectExistingSummaries(latestRoot: string): QaSuiteSummary[] {
  const reportsDir = path.join(latestRoot, 'reports');
  if (!fs.existsSync(reportsDir)) return [];
  return fs
    .readdirSync(reportsDir)
    .filter((f) => f.endsWith('-summary.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(reportsDir, f), 'utf8')) as QaSuiteSummary);
}

function writeAllReports(mobileRoot: string, summaries: QaSuiteSummary[]): void {
  const config = resolveQaConfig(mobileRoot);
  const reportsDir = path.join(config.latestRoot, 'reports');
  writeHtmlReport(summaries, path.join(reportsDir, 'index.html'));
  writeMarkdownReport(summaries, path.join(reportsDir, 'report.md'));
  writeJsonSummary(summaries, path.join(reportsDir, 'summary.json'));
  writeJunit(summaries, path.join(reportsDir, 'junit.xml'));
}

function regenerateReports(mobileRoot: string): QaSuiteSummary {
  const config = resolveQaConfig(mobileRoot);
  const summaries = collectExistingSummaries(config.latestRoot);
  writeAllReports(mobileRoot, summaries);
  return {
    suite: 'report',
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    durationMs: 0,
    totals: {
      total: summaries.reduce((n, s) => n + s.results.length, 0),
      pass: summaries.reduce((n, s) => n + s.totals.pass, 0),
      partial: summaries.reduce((n, s) => n + s.totals.partial, 0),
      fail: summaries.reduce((n, s) => n + s.totals.fail, 0),
      skipped: summaries.reduce((n, s) => n + s.totals.skipped, 0),
    },
    results: [
      {
        module: 'Report',
        name: 'Regenerate reports',
        status: 'PASS',
        message: `Wrote index.html from ${summaries.length} suite summary file(s)`,
        durationMs: 0,
        evidencePath: path.join(config.latestRoot, 'reports', 'index.html'),
      },
    ],
    criticalFailed: false,
  };
}

async function main(): Promise<void> {
  const suiteArg = process.argv[2] || 'preflight';
  const suites =
    suiteArg === 'full'
      ? ['preflight', 'source', 'unit', 'integration', 'api', 'backend', 'navigation', 'e2e']
      : suiteArg === 'smoke'
        ? ['preflight', 'source', 'api', 'navigation']
        : [suiteArg];

  const mobileRoot = process.cwd();
  const config = resolveQaConfig(mobileRoot);
  const summaries: QaSuiteSummary[] = [];

  for (const suite of suites) {
    // eslint-disable-next-line no-console
    console.log(`\n=== Running QA suite: ${suite} ===`);
    const summary = await loadSuite(suite);
    summaries.push(summary);
    // eslint-disable-next-line no-console
    console.log(
      `Suite ${suite}: PASS=${summary.totals.pass} PARTIAL=${summary.totals.partial} FAIL=${summary.totals.fail} SKIPPED=${summary.totals.skipped}`,
    );
  }

  writeAllReports(mobileRoot, collectExistingSummaries(config.latestRoot).length
    ? (() => {
        // Merge latest disk summaries with this run
        const bySuite = new Map<string, QaSuiteSummary>();
        for (const s of collectExistingSummaries(config.latestRoot)) bySuite.set(s.suite, s);
        for (const s of summaries) bySuite.set(s.suite, s);
        return [...bySuite.values()];
      })()
    : summaries);

  const reportPath = path.join(config.latestRoot, 'reports', 'index.html');
  // eslint-disable-next-line no-console
  console.log(`\nHTML report: ${reportPath}`);

  const failed = summaries.some((s) => s.criticalFailed || s.totals.fail > 0);
  process.exitCode = failed ? 1 : 0;
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exitCode = 1;
});

// Keep import side-effect free for tsx; pathToFileURL reserved for future dynamic ESM paths.
void pathToFileURL;
