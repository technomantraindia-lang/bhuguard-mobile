import * as fs from 'node:fs';
import * as path from 'node:path';

import type { QaSuiteSummary, QaTestResult } from '../core/result-types';
import { maskSecrets } from '../core/secret-masker';

function statusClass(status: string): string {
  return status.toLowerCase();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function rowsFromResults(results: QaTestResult[]): string {
  return results
    .map(
      (r) => `<tr class="${statusClass(r.status)}">
  <td>${escapeHtml(r.module)}</td>
  <td>${escapeHtml(r.name)}</td>
  <td><strong>${r.status}</strong></td>
  <td>${escapeHtml(maskSecrets(r.message))}</td>
  <td>${r.durationMs}</td>
  <td>${r.evidencePath ? escapeHtml(r.evidencePath) : ''}</td>
</tr>`,
    )
    .join('\n');
}

export function writeHtmlReport(
  summaries: QaSuiteSummary[],
  outPath: string,
  title = 'Bhuguard QA Test Center',
): void {
  const allResults = summaries.flatMap((s) => s.results);
  const totals = {
    total: allResults.length,
    pass: allResults.filter((r) => r.status === 'PASS').length,
    partial: allResults.filter((r) => r.status === 'PARTIAL').length,
    fail: allResults.filter((r) => r.status === 'FAIL').length,
    skipped: allResults.filter((r) => r.status === 'SKIPPED').length,
  };
  const score =
    totals.total === 0
      ? 0
      : Math.round(((totals.pass + totals.partial * 0.5) / totals.total) * 100);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Segoe UI, sans-serif; margin: 24px; background: #f6f8f5; color: #122; }
    h1 { margin-bottom: 8px; }
    .cards { display: flex; flex-wrap: wrap; gap: 12px; margin: 16px 0 24px; }
    .card { background: #fff; border: 1px solid #d7e0d5; border-radius: 12px; padding: 14px 18px; min-width: 120px; }
    .pass { color: #0a7a32; }
    .partial { color: #9a6b00; }
    .fail { color: #b00020; }
    .skipped { color: #555; }
    table { width: 100%; border-collapse: collapse; background: #fff; }
    th, td { border: 1px solid #dde5db; padding: 8px; text-align: left; vertical-align: top; font-size: 13px; }
    th { background: #eef5ea; }
    tr.fail { background: #fff1f1; }
    tr.partial { background: #fff8e8; }
    tr.pass { background: #f3fff6; }
    code { background: #eef2ec; padding: 1px 4px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>Generated: ${new Date().toISOString()}</p>
  <div class="cards">
    <div class="card"><div>Health Score</div><strong>${score}%</strong></div>
    <div class="card"><div>Total</div><strong>${totals.total}</strong></div>
    <div class="card pass"><div>PASS</div><strong>${totals.pass}</strong></div>
    <div class="card partial"><div>PARTIAL</div><strong>${totals.partial}</strong></div>
    <div class="card fail"><div>FAIL</div><strong>${totals.fail}</strong></div>
    <div class="card skipped"><div>SKIPPED</div><strong>${totals.skipped}</strong></div>
  </div>
  <h2>Results</h2>
  <table>
    <thead><tr><th>Module</th><th>Name</th><th>Status</th><th>Message</th><th>ms</th><th>Evidence</th></tr></thead>
    <tbody>
      ${rowsFromResults(allResults)}
    </tbody>
  </table>
</body>
</html>`;

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html, 'utf8');
}

export function writeMarkdownReport(summaries: QaSuiteSummary[], outPath: string): void {
  const allResults = summaries.flatMap((s) => s.results);
  const lines = [
    '# Bhuguard QA Report',
    '',
    `| Status | Count |`,
    `| --- | --- |`,
    `| PASS | ${allResults.filter((r) => r.status === 'PASS').length} |`,
    `| PARTIAL | ${allResults.filter((r) => r.status === 'PARTIAL').length} |`,
    `| FAIL | ${allResults.filter((r) => r.status === 'FAIL').length} |`,
    `| SKIPPED | ${allResults.filter((r) => r.status === 'SKIPPED').length} |`,
    '',
    `| Module | Name | Status | Message |`,
    `| --- | --- | --- | --- |`,
    ...allResults.map(
      (r) =>
        `| ${r.module} | ${r.name} | ${r.status} | ${maskSecrets(r.message).replace(/\|/g, '\\|')} |`,
    ),
    '',
  ];
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
}

export function writeJsonSummary(summaries: QaSuiteSummary[], outPath: string): void {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), summaries }, null, 2), 'utf8');
}

export function writeJunit(summaries: QaSuiteSummary[], outPath: string): void {
  const allResults = summaries.flatMap((s) => s.results);
  const cases = allResults
    .map((r) => {
      const name = escapeHtml(`${r.module}.${r.name}`);
      if (r.status === 'FAIL') {
        return `<testcase classname="${escapeHtml(r.module)}" name="${name}" time="${(r.durationMs / 1000).toFixed(3)}"><failure message="${escapeHtml(maskSecrets(r.message))}"/></testcase>`;
      }
      if (r.status === 'SKIPPED') {
        return `<testcase classname="${escapeHtml(r.module)}" name="${name}" time="${(r.durationMs / 1000).toFixed(3)}"><skipped message="${escapeHtml(maskSecrets(r.message))}"/></testcase>`;
      }
      if (r.status === 'PARTIAL') {
        return `<testcase classname="${escapeHtml(r.module)}" name="${name}" time="${(r.durationMs / 1000).toFixed(3)}"><system-out>${escapeHtml(maskSecrets(r.message))}</system-out></testcase>`;
      }
      return `<testcase classname="${escapeHtml(r.module)}" name="${name}" time="${(r.durationMs / 1000).toFixed(3)}"/>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="BhuguardQA" tests="${allResults.length}" failures="${allResults.filter((r) => r.status === 'FAIL').length}" skipped="${allResults.filter((r) => r.status === 'SKIPPED').length}">
${cases}
</testsuite>`;
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, xml, 'utf8');
}
