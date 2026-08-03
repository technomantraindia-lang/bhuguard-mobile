import * as fs from 'node:fs';
import * as path from 'node:path';

import { TestContext } from '../core/test-context';
import { runCheck } from '../core/test-runner';
import type { QaSuiteSummary } from '../core/result-types';

interface NavScreen {
  name: string;
  file: string;
  line: number;
}

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function discoverScreens(mobileRoot: string): NavScreen[] {
  const navDir = path.join(mobileRoot, 'src', 'navigation');
  const files = walk(navDir);
  const screens: NavScreen[] = [];
  const nameRe = /name\s*=\s*["']([A-Za-z0-9_]+)["']/g;
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const lines = text.split(/\r?\n/);
    lines.forEach((line, idx) => {
      let match: RegExpExecArray | null;
      const re = new RegExp(nameRe.source, 'g');
      while ((match = re.exec(line))) {
        screens.push({
          name: match[1],
          file: path.relative(mobileRoot, file).replace(/\\/g, '/'),
          line: idx + 1,
        });
      }
    });
  }
  return screens;
}

function discoverNavigateTargets(mobileRoot: string): Array<{ target: string; file: string; line: number }> {
  const src = path.join(mobileRoot, 'src');
  const files = walk(src);
  const targets: Array<{ target: string; file: string; line: number }> = [];
  const re = /navigate\(\s*['"]([A-Za-z0-9_]+)['"]/g;
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const lines = text.split(/\r?\n/);
    lines.forEach((line, idx) => {
      let match: RegExpExecArray | null;
      const local = new RegExp(re.source, 'g');
      while ((match = local.exec(line))) {
        targets.push({
          target: match[1],
          file: path.relative(mobileRoot, file).replace(/\\/g, '/'),
          line: idx + 1,
        });
      }
    });
  }
  return targets;
}

export async function runNavigationHealthSuite(mobileRoot = process.cwd()): Promise<QaSuiteSummary> {
  const ctx = new TestContext('navigation', mobileRoot);
  const screens = discoverScreens(mobileRoot);
  const targets = discoverNavigateTargets(mobileRoot);
  const screenNames = new Set(screens.map((s) => s.name));

  // Param list type names are not always registered as Stack.Screen name= — also parse types.ts keys
  const typesPath = path.join(mobileRoot, 'src', 'navigation', 'types.ts');
  if (fs.existsSync(typesPath)) {
    const typesText = fs.readFileSync(typesPath, 'utf8');
    const keyRe = /^\s{2}([A-Z][A-Za-z0-9_]+)\s*:/gm;
    let m: RegExpExecArray | null;
    while ((m = keyRe.exec(typesText))) {
      screenNames.add(m[1]);
    }
  }

  const missing = targets.filter((t) => !screenNames.has(t.target));
  const duplicates = screens.reduce<Record<string, number>>((acc, s) => {
    acc[s.name] = (acc[s.name] || 0) + 1;
    return acc;
  }, {});
  const dupList = Object.entries(duplicates).filter(([, n]) => n > 3); // navigators may intentionally re-register

  const evidence = ctx.evidencePath('reports', 'navigation-health.json');
  fs.writeFileSync(
    evidence,
    JSON.stringify(
      {
        screenCount: screens.length,
        navigateCallCount: targets.length,
        uniqueScreens: screenNames.size,
        missing: missing.slice(0, 200),
        heavyDuplicates: dupList,
      },
      null,
      2,
    ),
    'utf8',
  );
  fs.writeFileSync(
    ctx.evidencePath('reports', 'navigation-health.md'),
    [
      '# Navigation health',
      '',
      `Registered Stack.Screen name= count: ${screens.length}`,
      `navigate('X') call sites: ${targets.length}`,
      `Known screen/type names: ${screenNames.size}`,
      `Missing targets: ${missing.length}`,
      '',
    ].join('\n'),
    'utf8',
  );

  ctx.add(
    await runCheck('Navigation', 'Discover navigators/screens', async () => ({
      status: screens.length > 0 ? 'PASS' : 'FAIL',
      message: `Found ${screens.length} Stack.Screen name registrations`,
      evidencePath: evidence,
    })),
  );

  ctx.add(
    await runCheck('Navigation', 'Broken navigate targets', async () => ({
      status: missing.length === 0 ? 'PASS' : missing.length > 20 ? 'FAIL' : 'PARTIAL',
      message:
        missing.length === 0
          ? 'All navigate() string targets resolve to known screens/types'
          : `${missing.length} navigate() target(s) not found in screen registry/types`,
      evidencePath: evidence,
    })),
  );

  return ctx.writeSummary();
}
