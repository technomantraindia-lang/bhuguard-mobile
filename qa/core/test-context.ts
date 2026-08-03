import * as fs from 'node:fs';
import * as path from 'node:path';

import { type QaConfig, resolveQaConfig } from '../config/qa.config';
import type { QaSuiteSummary, QaTestResult } from './result-types';
import { accumulateTotals, hasCriticalFailure } from './result-types';

export class TestContext {
  readonly config: QaConfig;
  readonly suite: string;
  readonly startedAt: Date;
  readonly results: QaTestResult[] = [];

  constructor(suite: string, mobileRoot = process.cwd()) {
    this.suite = suite;
    this.config = resolveQaConfig(mobileRoot);
    this.startedAt = new Date();
    this.ensureDirs();
  }

  ensureDirs(): void {
    const roots = [
      this.config.latestRoot,
      path.join(this.config.latestRoot, 'reports'),
      path.join(this.config.latestRoot, 'screenshots'),
      path.join(this.config.latestRoot, 'logs'),
      path.join(this.config.latestRoot, 'api'),
      path.join(this.config.latestRoot, 'mobile'),
      path.join(this.config.latestRoot, 'backend'),
      path.join(this.config.resultsRoot, 'history'),
    ];
    for (const dir of roots) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  evidencePath(...parts: string[]): string {
    return path.join(this.config.latestRoot, ...parts);
  }

  add(result: QaTestResult): void {
    this.results.push(result);
  }

  writeSummary(extra?: Partial<QaSuiteSummary>): QaSuiteSummary {
    const finishedAt = new Date();
    const summary: QaSuiteSummary = {
      suite: this.suite,
      startedAt: this.startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - this.startedAt.getTime(),
      totals: accumulateTotals(this.results),
      results: this.results,
      criticalFailed: hasCriticalFailure(this.results),
      environment: {
        apiBaseUrl: this.config.apiBaseUrl,
        testMode: this.config.testMode,
        environment: this.config.environment,
        allowWrites: this.config.allowWrites,
        node: process.version,
        platform: process.platform,
      },
      ...extra,
    };

    const jsonPath = this.evidencePath('reports', `${this.suite}-summary.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2), 'utf8');
    return summary;
  }
}
