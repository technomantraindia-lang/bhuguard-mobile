$ErrorActionPreference = 'Stop'
$mobileRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$backendRoot = if ($env:QA_BACKEND_ROOT) { $env:QA_BACKEND_ROOT } else { Join-Path (Split-Path -Parent $mobileRoot) 'bhuguard-latest' }
$outDir = Join-Path $mobileRoot 'test-results\latest\logs'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$outFile = Join-Path $outDir ("laravel-" + (Get-Date -Format 'yyyyMMdd-HHmmss') + ".log")
$laravelLog = Join-Path $backendRoot 'storage\logs\laravel.log'
if (-not (Test-Path $laravelLog)) {
  "laravel.log not found at $laravelLog" | Set-Content -Path $outFile
  Write-Host "PARTIAL: missing laravel.log"
  exit 0
}
# Copy only last 200 lines and strip common secret-looking lines
Get-Content $laravelLog -Tail 200 |
  Where-Object { $_ -notmatch '(?i)(password|authorization:|bearer |otp|pattern_hash|app_key)' } |
  Set-Content -Path $outFile
Write-Host "Wrote sanitized tail to $outFile"
