import * as fs from 'node:fs';

import { TestContext } from '../core/test-context';
import { runCheck } from '../core/test-runner';
import type { QaSuiteSummary } from '../core/result-types';
import { writeEndpointManifest, type DiscoveredEndpoint } from './endpoint-discovery';
import { maskSecrets } from '../core/secret-masker';

interface EndpointResult {
  module: string;
  method: string;
  endpoint: string;
  status: 'PASS' | 'PARTIAL' | 'FAIL' | 'SKIPPED';
  http: number | null;
  latencyMs: number;
  message: string;
}

async function probe(
  baseUrl: string,
  endpoint: DiscoveredEndpoint,
  allowWrites: boolean,
): Promise<EndpointResult> {
  if (endpoint.write && !allowWrites) {
    return {
      module: endpoint.module,
      method: endpoint.method,
      endpoint: endpoint.path,
      status: 'SKIPPED',
      http: null,
      latencyMs: 0,
      message: 'Write endpoint skipped in production-read-only mode',
    };
  }

  // Skip templated paths without substitution
  if (endpoint.path.includes('{') || endpoint.path.includes('$')) {
    return {
      module: endpoint.module,
      method: endpoint.method,
      endpoint: endpoint.path,
      status: 'SKIPPED',
      http: null,
      latencyMs: 0,
      message: 'Parameterized path requires fixture IDs',
    };
  }

  const url = `${baseUrl.replace(/\/$/, '')}${endpoint.path.startsWith('/') ? endpoint.path : `/${endpoint.path}`}`;
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      method: endpoint.method === 'GET' ? 'GET' : endpoint.method,
      headers: { Accept: 'application/json' },
      signal: controller.signal,
      redirect: 'follow',
    });
    const latencyMs = Date.now() - started;
    const contentType = response.headers.get('content-type') || '';
    const bodyText = await response.text();
    const looksHtml = /text\/html/i.test(contentType) || /<html/i.test(bodyText.slice(0, 200));

    if (looksHtml && response.status >= 500) {
      return {
        module: endpoint.module,
        method: endpoint.method,
        endpoint: endpoint.path,
        status: 'FAIL',
        http: response.status,
        latencyMs,
        message: 'HTML error page instead of JSON',
      };
    }

    // Unauthenticated GET on auth-required endpoints often 401/403 — that is PASS
    if (endpoint.authRequired && (response.status === 401 || response.status === 403)) {
      return {
        module: endpoint.module,
        method: endpoint.method,
        endpoint: endpoint.path,
        status: 'PASS',
        http: response.status,
        latencyMs,
        message: 'Expected unauthorized/forbidden without credentials',
      };
    }

    if (response.status === 404) {
      return {
        module: endpoint.module,
        method: endpoint.method,
        endpoint: endpoint.path,
        status: 'FAIL',
        http: 404,
        latencyMs,
        message: 'Unexpected 404 for discovered mobile API path',
      };
    }

    if (response.status >= 500) {
      return {
        module: endpoint.module,
        method: endpoint.method,
        endpoint: endpoint.path,
        status: 'FAIL',
        http: response.status,
        latencyMs,
        message: `Unexpected server error HTTP ${response.status}`,
      };
    }

    // 200/422/405 etc. without auth may still be informative
    return {
      module: endpoint.module,
      method: endpoint.method,
      endpoint: endpoint.path,
      status: 'PASS',
      http: response.status,
      latencyMs,
      message: `HTTP ${response.status}; content-type=${contentType || 'n/a'}`,
    };
  } catch (error) {
    return {
      module: endpoint.module,
      method: endpoint.method,
      endpoint: endpoint.path,
      status: 'FAIL',
      http: null,
      latencyMs: Date.now() - started,
      message: maskSecrets(error instanceof Error ? error.message : String(error)),
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function runApiHealthSuite(mobileRoot = process.cwd()): Promise<QaSuiteSummary> {
  const ctx = new TestContext('api', mobileRoot);
  const manifestPath = ctx.evidencePath('api', 'endpoint-manifest.json');
  const endpoints = writeEndpointManifest(mobileRoot, manifestPath);

  ctx.add(
    await runCheck('API', 'Endpoint discovery', async () => ({
      status: endpoints.length > 0 ? 'PASS' : 'FAIL',
      message: `Discovered ${endpoints.length} endpoint(s) from src/api`,
      evidencePath: manifestPath,
    })),
  );

  // Cap probes to keep one-click runs bounded; prefer safe GET endpoints first
  const safeGets = endpoints.filter((e) => e.safeInProductionReadOnly);
  const probeList = [
    ...safeGets.slice(0, 40),
    ...endpoints.filter((e) => !e.safeInProductionReadOnly).slice(0, 15),
  ];

  const results: EndpointResult[] = [];
  for (const endpoint of probeList) {
    const result = await probe(ctx.config.apiBaseUrl, endpoint, ctx.config.allowWrites);
    results.push(result);
    ctx.add({
      module: 'API',
      name: `${result.method} ${result.endpoint}`,
      status: result.status,
      message: `HTTP=${result.http ?? 'n/a'}; ${result.latencyMs}ms; ${result.message}`,
      durationMs: result.latencyMs,
      evidencePath: manifestPath,
    });
  }

  const apiHealthPath = ctx.evidencePath('api', 'api-health.json');
  fs.writeFileSync(apiHealthPath, JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2), 'utf8');

  const csv = [
    'Module,Method,Endpoint,Status,HTTP,LatencyMs,Message',
    ...results.map(
      (r) =>
        `${JSON.stringify(r.module)},${r.method},${JSON.stringify(r.endpoint)},${r.status},${r.http ?? ''},${r.latencyMs},${JSON.stringify(r.message)}`,
    ),
  ].join('\n');
  fs.writeFileSync(ctx.evidencePath('reports', 'api-health.csv'), csv, 'utf8');
  fs.writeFileSync(
    ctx.evidencePath('reports', 'api-health.md'),
    [
      '# API health',
      '',
      `| Module | Method | Endpoint | Status | HTTP | Latency | Message |`,
      `| --- | --- | --- | --- | --- | --- | --- |`,
      ...results.map(
        (r) =>
          `| ${r.module} | ${r.method} | \`${r.endpoint}\` | ${r.status} | ${r.http ?? ''} | ${r.latencyMs} | ${r.message.replace(/\|/g, '/')} |`,
      ),
      '',
    ].join('\n'),
    'utf8',
  );

  return ctx.writeSummary();
}
