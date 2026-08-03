$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $root
npx --yes tsx qa/cli.ts report
$report = Join-Path $root 'test-results\latest\reports\index.html'
if (Test-Path $report) {
  Start-Process $report
}
exit $LASTEXITCODE
