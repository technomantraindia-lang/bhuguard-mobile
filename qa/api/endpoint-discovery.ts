import * as fs from 'node:fs';
import * as path from 'node:path';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface DiscoveredEndpoint {
  module: string;
  method: HttpMethod;
  path: string;
  authRequired: boolean;
  write: boolean;
  sourceFile: string;
  safeInProductionReadOnly: boolean;
}

const METHOD_HINTS: Array<{ method: HttpMethod; re: RegExp }> = [
  { method: 'GET', re: /\b(get|fetch|fetchApiData)\s*\(/i },
  { method: 'POST', re: /\b(post|postApiData|create)\s*\(/i },
  { method: 'PUT', re: /\b(put|putApiData|update)\s*\(/i },
  { method: 'PATCH', re: /\b(patch|patchApiData)\s*\(/i },
  { method: 'DELETE', re: /\b(delete|deleteApiData|remove)\s*\(/i },
];

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function inferMethod(line: string, fallback: HttpMethod): HttpMethod {
  for (const hint of METHOD_HINTS) {
    if (hint.re.test(line)) return hint.method;
  }
  return fallback;
}

function isWrite(method: HttpMethod, p: string): boolean {
  if (method !== 'GET') return true;
  return /(create|submit|upload|update|delete|check-in|check_in|save|reset)/i.test(p);
}

/**
 * Discover API paths from mobile api service sources (not docs).
 */
export function discoverMobileApiEndpoints(mobileRoot: string): DiscoveredEndpoint[] {
  const apiDir = path.join(mobileRoot, 'src', 'api');
  const serviceFiles = walk(apiDir);
  const endpoints: DiscoveredEndpoint[] = [];
  const seen = new Set<string>();

  const pathRe = /[`'"](\/(?:api\/)?[A-Za-z0-9_\-/{}$.]+)[`'"]/g;

  for (const file of serviceFiles) {
    const rel = path.relative(mobileRoot, file).replace(/\\/g, '/');
    const text = fs.readFileSync(file, 'utf8');
    const lines = text.split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (!pathRe.test(line)) {
        pathRe.lastIndex = 0;
        return;
      }
      pathRe.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pathRe.exec(line))) {
        let p = match[1];
        if (p.startsWith('/api/')) p = p.slice(4);
        if (!p.startsWith('/')) continue;
        if (p.includes('${') && p.length < 6) continue;
        // Skip obvious non-endpoints
        if (/^\/(assets|static|docs)\b/.test(p)) continue;

        const method = inferMethod(line, /fetchApiData|get[A-Z]/.test(line) ? 'GET' : 'POST');
        const write = isWrite(method, p);
        const key = `${method} ${p}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const module = path.basename(file).replace(/\.(ts|tsx)$/, '');
        endpoints.push({
          module,
          method,
          path: p,
          authRequired: !/\/auth\/(login|otp|pattern\/capability)/i.test(p),
          write,
          sourceFile: `${rel}:${idx + 1}`,
          safeInProductionReadOnly: !write && method === 'GET',
        });
      }
    });
  }

  return endpoints.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
}

export function writeEndpointManifest(mobileRoot: string, outPath: string): DiscoveredEndpoint[] {
  const endpoints = discoverMobileApiEndpoints(mobileRoot);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(
    outPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), count: endpoints.length, endpoints }, null, 2),
    'utf8',
  );
  return endpoints;
}
