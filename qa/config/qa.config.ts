/**
 * Bhuguard QA Test Center — shared configuration.
 * Default mode is production read-only. Never enable writes without staging + QA_ALLOW_WRITES.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

export type QaTestMode = 'read-only' | 'staging-write';
export type QaEnvironment = 'production-read-only' | 'staging' | 'local';

export interface QaConfig {
  mobileRoot: string;
  backendRoot: string;
  resultsRoot: string;
  latestRoot: string;
  apiBaseUrl: string;
  testMode: QaTestMode;
  environment: QaEnvironment;
  allowWrites: boolean;
  testDataPrefix: string;
  cleanupTestData: boolean;
  farmerMobile: string;
  fieldOfficerMobile: string;
  artisanMobile: string;
  artisanProMobile: string;
  testOtpEnabled: boolean;
  testOtp: string;
  testPatternEnabled: boolean;
  testPattern: string;
  commandTimeoutMs: number;
  stallTimeoutMs: number;
  mobileBranchExpected: string;
  backendBranchExpected: string;
}

function loadDotEnvQa(mobileRoot: string): void {
  const envPath = path.join(mobileRoot, '.env.qa');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq <= 0) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env) || process.env[key] === '') {
      process.env[key] = value;
    }
  }
}

function boolEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw == null || raw === '') {
    return fallback;
  }
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
}

export function resolveQaConfig(mobileRoot = process.cwd()): QaConfig {
  loadDotEnvQa(mobileRoot);

  const backendRoot =
    process.env.QA_BACKEND_ROOT?.trim() ||
    path.resolve(mobileRoot, '..', 'bhuguard-latest');

  const resultsRoot = path.join(mobileRoot, 'test-results');
  const latestRoot = path.join(resultsRoot, 'latest');

  const environment = (process.env.QA_TEST_ENVIRONMENT?.trim() ||
    'production-read-only') as QaEnvironment;
  const allowWrites = boolEnv('QA_ALLOW_WRITES', false);
  const testMode: QaTestMode =
    environment === 'staging' && allowWrites ? 'staging-write' : 'read-only';

  return {
    mobileRoot,
    backendRoot,
    resultsRoot,
    latestRoot,
    apiBaseUrl: (process.env.QA_API_BASE_URL || 'https://erp.bhuguard.com/api').replace(/\/$/, ''),
    testMode,
    environment,
    allowWrites: testMode === 'staging-write',
    testDataPrefix: process.env.QA_TEST_DATA_PREFIX || 'BHG-QA-',
    cleanupTestData: boolEnv('QA_CLEANUP_TEST_DATA', true),
    farmerMobile: process.env.QA_FARMER_MOBILE || '',
    fieldOfficerMobile: process.env.QA_FIELD_OFFICER_MOBILE || '',
    artisanMobile: process.env.QA_ARTISAN_MOBILE || '',
    artisanProMobile: process.env.QA_ARTISAN_PRO_MOBILE || '',
    testOtpEnabled: boolEnv('QA_TEST_OTP_ENABLED', false),
    testOtp: process.env.QA_TEST_OTP || '',
    testPatternEnabled: boolEnv('QA_TEST_PATTERN_ENABLED', false),
    testPattern: process.env.QA_TEST_PATTERN || '',
    commandTimeoutMs: Number(process.env.QA_COMMAND_TIMEOUT_MS || 300000),
    stallTimeoutMs: Number(process.env.QA_STALL_TIMEOUT_MS || 300000),
    mobileBranchExpected: 'office-rebuild-client-changes-2026-08',
    backendBranchExpected: 'office-rebuild-client-changes-2026-08',
  };
}
