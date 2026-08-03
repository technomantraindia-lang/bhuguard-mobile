import * as fs from 'node:fs';
import * as path from 'node:path';

import { TestContext } from '../core/test-context';
import { runCheck } from '../core/test-runner';
import type { QaSuiteSummary } from '../core/result-types';

type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

interface Finding {
  severity: FindingSeverity;
  rule: string;
  file: string;
  line: number;
  excerpt: string;
}

const OBSOLETE_PATTERNS: Array<{ rule: string; re: RegExp; severity: FindingSeverity }> = [
  { rule: 'obsolete-farmer-code-label', re: /Farmer Code/g, severity: 'high' },
  { rule: 'obsolete-farm-code-label', re: /Farm Code/g, severity: 'high' },
  { rule: 'farmer-change-mpin', re: /Change MPIN/g, severity: 'high' },
  { rule: 'onboarding-set-mpin', re: /Set MPIN/g, severity: 'high' },
  { rule: 'existing-farming-practice', re: /Existing Farming Practice/g, severity: 'medium' },
  { rule: 'visited-field-card', re: /Visited Field/g, severity: 'medium' },
  { rule: 'pending-visit-card', re: /Pending Visit/g, severity: 'medium' },
];

const SECRET_PATTERNS: Array<{ rule: string; re: RegExp; severity: FindingSeverity }> = [
  { rule: 'hardcoded-otp', re: /\bOTP\s*[=:]\s*['"`]?\d{4,8}/gi, severity: 'critical' },
  { rule: 'hardcoded-bearer', re: /Bearer\s+[A-Za-z0-9\-._~+/]{20,}/g, severity: 'critical' },
  { rule: 'hardcoded-password', re: /password\s*[:=]\s*['"`][^'"`]{4,}['"`]/gi, severity: 'critical' },
  { rule: 'fake-bhg-kishan', re: /BHG-KISHAN-\d+/g, severity: 'high' },
  { rule: 'fake-bhg-art', re: /BHG-ART-\d+/g, severity: 'high' },
  { rule: 'fake-wallet-balance', re: /walletBalance\s*[:=]\s*\d+/gi, severity: 'high' },
];

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === 'coverage') {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js|jsx|json)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function scanFile(file: string, root: string): Finding[] {
  const findings: Finding[] = [];
  const rel = path.relative(root, file).replace(/\\/g, '/');
  // Skip QA tooling itself and reports from obsolete-wording scans that mention the rules
  if (rel.startsWith('qa/') || rel.startsWith('test-results/')) {
    return findings;
  }

  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);

  const scanPatterns = [...OBSOLETE_PATTERNS, ...SECRET_PATTERNS];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    for (const pattern of scanPatterns) {
      if (!pattern.re.test(line)) {
        pattern.re.lastIndex = 0;
        continue;
      }
      pattern.re.lastIndex = 0;

      // Allow display ID format documentation / comments in displayIds helpers
      if (
        (pattern.rule === 'fake-bhg-kishan' || pattern.rule === 'fake-bhg-art') &&
        (rel.includes('displayIds') || rel.includes('IMPLEMENTATION_PROGRESS') || line.trim().startsWith('*') || line.trim().startsWith('//'))
      ) {
        continue;
      }

      findings.push({
        severity: pattern.severity,
        rule: pattern.rule,
        file: rel,
        line: i + 1,
        excerpt: line.trim().slice(0, 180),
      });
    }

    if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(line) || /catch\s*\{\s*\}/.test(line)) {
      findings.push({
        severity: 'medium',
        rule: 'empty-catch',
        file: rel,
        line: i + 1,
        excerpt: line.trim().slice(0, 180),
      });
    }
    if (/@ts-ignore/.test(line)) {
      findings.push({
        severity: 'low',
        rule: 'ts-ignore',
        file: rel,
        line: i + 1,
        excerpt: line.trim().slice(0, 180),
      });
    }
  }

  return findings;
}

function checkRelativeImports(root: string): Finding[] {
  const findings: Finding[] = [];
  const srcRoot = path.join(root, 'src');
  const files = walk(srcRoot);
  for (const file of files) {
    if (!/\.(ts|tsx)$/.test(file)) continue;
    const text = fs.readFileSync(file, 'utf8');
    const importRe = /from\s+['"](\.[^'"]+)['"]/g;
    let match: RegExpExecArray | null;
    while ((match = importRe.exec(text))) {
      const spec = match[1];
      const base = path.resolve(path.dirname(file), spec);
      const candidates = [
        base,
        `${base}.ts`,
        `${base}.tsx`,
        `${base}.js`,
        `${base}.jsx`,
        path.join(base, 'index.ts'),
        path.join(base, 'index.tsx'),
      ];
      if (!candidates.some((c) => fs.existsSync(c))) {
        findings.push({
          severity: 'high',
          rule: 'broken-relative-import',
          file: path.relative(root, file).replace(/\\/g, '/'),
          line: text.slice(0, match.index).split(/\r?\n/).length,
          excerpt: `Missing import target: ${spec}`,
        });
      }
    }
  }
  return findings;
}

function checkBighaInFarmerUi(root: string): Finding[] {
  const findings: Finding[] = [];
  const farmerDir = path.join(root, 'src', 'screens', 'farmer');
  for (const file of walk(farmerDir)) {
    const text = fs.readFileSync(file, 'utf8');
    const lines = text.split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (/bigha/i.test(line) && !/hidden|exclude|intentionally|Bigha hidden/i.test(line) && !line.trim().startsWith('//')) {
        findings.push({
          severity: 'high',
          rule: 'bigha-in-farmer-ui',
          file: path.relative(root, file).replace(/\\/g, '/'),
          line: idx + 1,
          excerpt: line.trim().slice(0, 180),
        });
      }
    });
  }
  return findings;
}

export async function runSourceHealthSuite(mobileRoot = process.cwd()): Promise<QaSuiteSummary> {
  const ctx = new TestContext('source', mobileRoot);
  const scanRoots = [
    path.join(mobileRoot, 'src'),
    path.join(mobileRoot, 'App.tsx'),
    path.join(mobileRoot, 'index.ts'),
  ];

  const files: string[] = [];
  for (const root of scanRoots) {
    if (fs.existsSync(root) && fs.statSync(root).isDirectory()) walk(root, files);
    else if (fs.existsSync(root)) files.push(root);
  }

  const findings: Finding[] = [];
  for (const file of files) findings.push(...scanFile(file, mobileRoot));
  findings.push(...checkRelativeImports(mobileRoot));
  findings.push(...checkBighaInFarmerUi(mobileRoot));

  const evidencePath = ctx.evidencePath('mobile', 'source-health-findings.json');
  fs.writeFileSync(
    evidencePath,
    JSON.stringify({ generatedAt: new Date().toISOString(), count: findings.length, findings }, null, 2),
    'utf8',
  );

  const bySeverity = {
    critical: findings.filter((f) => f.severity === 'critical').length,
    high: findings.filter((f) => f.severity === 'high').length,
    medium: findings.filter((f) => f.severity === 'medium').length,
    low: findings.filter((f) => f.severity === 'low').length,
    info: findings.filter((f) => f.severity === 'info').length,
  };

  ctx.add(
    await runCheck('Source', 'Source scan executed', async () => ({
      status: 'PASS',
      message: `Scanned ${files.length} files; findings=${findings.length}`,
      evidencePath,
    })),
  );

  ctx.add(
    await runCheck('Source', 'Critical secret/fake-data findings', async () => ({
      status: bySeverity.critical === 0 ? 'PASS' : 'FAIL',
      message:
        bySeverity.critical === 0
          ? 'No critical hardcoded secret/OTP/token findings in src'
          : `${bySeverity.critical} critical finding(s)`,
      evidencePath,
      meta: { critical: true },
    })),
  );

  ctx.add(
    await runCheck('Source', 'High severity findings', async () => ({
      status: bySeverity.high === 0 ? 'PASS' : bySeverity.high > 25 ? 'FAIL' : 'PARTIAL',
      message: `${bySeverity.high} high finding(s) (obsolete wording / broken imports / farmer Bigha)`,
      evidencePath,
    })),
  );

  // Translation key presence (EN/HI)
  const enPath = path.join(mobileRoot, 'src', 'i18n', 'locales', 'en.json');
  const hiPath = path.join(mobileRoot, 'src', 'i18n', 'locales', 'hi.json');
  ctx.add(
    await runCheck('Translations', 'EN/HI locale files exist', async () => {
      const ok = fs.existsSync(enPath) && fs.existsSync(hiPath);
      return {
        status: ok ? 'PASS' : 'FAIL',
        message: ok ? 'en.json and hi.json present' : 'Missing en.json and/or hi.json',
      };
    }),
  );

  if (fs.existsSync(enPath) && fs.existsSync(hiPath)) {
    const en = JSON.parse(fs.readFileSync(enPath, 'utf8')) as Record<string, unknown>;
    const hi = JSON.parse(fs.readFileSync(hiPath, 'utf8')) as Record<string, unknown>;
    const flatten = (obj: Record<string, unknown>, prefix = ''): string[] => {
      const keys: string[] = [];
      for (const [k, v] of Object.entries(obj)) {
        const key = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          keys.push(...flatten(v as Record<string, unknown>, key));
        } else {
          keys.push(key);
        }
      }
      return keys;
    };
    const enKeys = new Set(flatten(en));
    const hiKeys = new Set(flatten(hi));
    const missingInHi = [...enKeys].filter((k) => !hiKeys.has(k));
    const missingInEn = [...hiKeys].filter((k) => !enKeys.has(k));
    const translationEvidence = ctx.evidencePath('reports', 'translation-health.json');
    fs.writeFileSync(
      translationEvidence,
      JSON.stringify({ missingInHi, missingInEn, enCount: enKeys.size, hiCount: hiKeys.size }, null, 2),
      'utf8',
    );
    fs.writeFileSync(
      ctx.evidencePath('reports', 'translation-health.md'),
      [
        '# Translation health',
        '',
        `EN keys: ${enKeys.size}`,
        `HI keys: ${hiKeys.size}`,
        `Missing in HI: ${missingInHi.length}`,
        `Missing in EN: ${missingInEn.length}`,
        '',
      ].join('\n'),
      'utf8',
    );

    ctx.add(
      await runCheck('Translations', 'EN/HI key parity', async () => ({
        status: missingInHi.length + missingInEn.length === 0 ? 'PASS' : 'PARTIAL',
        message: `missingInHi=${missingInHi.length}, missingInEn=${missingInEn.length}`,
        evidencePath: translationEvidence,
      })),
    );

    const requiredHints = ['fraud', 'pattern', 'timeSync', 'serverTime', 'deviceTime'];
    const joined = [...enKeys].join(' ').toLowerCase();
    for (const hint of requiredHints) {
      ctx.add(
        await runCheck('Translations', `Key family present: ${hint}`, async () => ({
          status: joined.includes(hint.toLowerCase()) ? 'PASS' : 'PARTIAL',
          message: joined.includes(hint.toLowerCase())
            ? `Found keys related to ${hint}`
            : `No EN keys containing "${hint}" (may use different naming)`,
        })),
      );
    }
  }

  // Assets
  const assetChecks = [
    ['assets/auth-environment-bg.jpg', 'Login farm background'],
    ['assets/splash-native-blank.png', 'Native splash blank'],
  ];
  for (const [rel, label] of assetChecks) {
    const full = path.join(mobileRoot, rel);
    ctx.add(
      await runCheck('Assets', label, async () => ({
        status: fs.existsSync(full) ? 'PASS' : 'FAIL',
        message: fs.existsSync(full) ? `Found ${rel}` : `Missing ${rel}`,
      })),
    );
  }

  // Invalid Android resource backups inside res/
  const androidRes = path.join(mobileRoot, 'android', 'app', 'src', 'main', 'res');
  ctx.add(
    await runCheck('Assets', 'Android res invalid backup filenames', async () => {
      if (!fs.existsSync(androidRes)) {
        return { status: 'PARTIAL', message: 'android/res not present on this checkout' };
      }
      const bad: string[] = [];
      const walkRes = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) walkRes(full);
          else if (entry.name.includes('.before-') || /\s/.test(entry.name)) bad.push(full);
        }
      };
      walkRes(androidRes);
      return {
        status: bad.length === 0 ? 'PASS' : 'FAIL',
        message:
          bad.length === 0
            ? 'No invalid backup/space filenames under android res'
            : `Invalid resource files: ${bad.map((b) => path.relative(mobileRoot, b)).join(', ')}`,
      };
    }),
  );

  return ctx.writeSummary();
}
