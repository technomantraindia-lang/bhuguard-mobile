import * as fs from 'node:fs';
import * as path from 'node:path';

import { TestContext } from '../core/test-context';
import { runCheck } from '../core/test-runner';
import type { QaSuiteSummary } from '../core/result-types';

export async function runIntegrationSuite(mobileRoot = process.cwd()): Promise<QaSuiteSummary> {
  const ctx = new TestContext('integration', mobileRoot);

  const gate = path.join(mobileRoot, 'src', 'components', 'officer', 'checkin', 'FieldOfficerCheckInGate.tsx');
  const artisanGate = path.join(mobileRoot, 'src', 'components', 'artisan', 'ArtisanCheckInGate.tsx');
  const marquee = path.join(mobileRoot, 'src', 'components', 'shared', 'FraudWarningMarquee.tsx');

  ctx.add(
    await runCheck('Integration', 'FO mandatory check-in gate module', async () => ({
      status: fs.existsSync(gate) ? 'PASS' : 'FAIL',
      message: fs.existsSync(gate) ? 'FieldOfficerCheckInGate.tsx present' : 'Missing FO check-in gate',
    })),
  );
  ctx.add(
    await runCheck('Integration', 'Artisan mandatory check-in gate module', async () => ({
      status: fs.existsSync(artisanGate) ? 'PASS' : 'FAIL',
      message: fs.existsSync(artisanGate) ? 'ArtisanCheckInGate.tsx present' : 'Missing Artisan check-in gate',
    })),
  );
  ctx.add(
    await runCheck('Integration', 'Fraud warning marquee module', async () => ({
      status: fs.existsSync(marquee) ? 'PASS' : 'FAIL',
      message: fs.existsSync(marquee) ? 'FraudWarningMarquee.tsx present' : 'Missing fraud marquee',
    })),
  );

  // Duplicate-submit guard presence in check-in hook
  const foHook = path.join(mobileRoot, 'src', 'hooks', 'useFieldOfficerMandatoryCheckIn.ts');
  ctx.add(
    await runCheck('Integration', 'FO check-in duplicate guard signals', async () => {
      if (!fs.existsSync(foHook)) {
        return { status: 'FAIL', message: 'Missing useFieldOfficerMandatoryCheckIn.ts' };
      }
      const text = fs.readFileSync(foHook, 'utf8');
      const hasLock = /submitting|inFlight|lock|duplicate/i.test(text);
      return {
        status: hasLock ? 'PASS' : 'PARTIAL',
        message: hasLock
          ? 'Check-in hook contains submit-lock / in-flight signals'
          : 'Hook present but no obvious submit-lock naming found',
      };
    }),
  );

  return ctx.writeSummary();
}
