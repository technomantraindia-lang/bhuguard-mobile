# Bhuguard QA Test Center

Automated mobile + Laravel QA harness for the Bhuguard client rebuild branch.

## One-click (Windows)

- `Run-Bhuguard-Full-Test.bat`
- `Run-Bhuguard-Smoke-Test.bat`
- `Run-Bhuguard-API-Health.bat`
- `Run-Bhuguard-Backend-Test.bat`
- `Open-Latest-QA-Report.bat`

## npm scripts

```bash
npm run qa:preflight
npm run qa:source
npm run qa:unit
npm run qa:integration
npm run qa:api
npm run qa:backend
npm run qa:navigation
npm run qa:e2e
npm run qa:smoke
npm run qa:full
npm run qa:report
npm run qa:clean
```

## Secrets

Copy `.env.qa.example` → `.env.qa` (gitignored). Never commit OTP/pattern/tokens.

## Default safety

`QA_TEST_ENVIRONMENT=production-read-only` and `QA_ALLOW_WRITES=false` — no production writes.
