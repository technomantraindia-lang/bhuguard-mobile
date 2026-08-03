$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$outDir = Join-Path $root 'test-results\latest\logs'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$outFile = Join-Path $outDir ("logcat-" + (Get-Date -Format 'yyyyMMdd-HHmmss') + ".txt")
$adb = Get-Command adb -ErrorAction SilentlyContinue
if (-not $adb) {
  "adb not available" | Set-Content -Path $outFile
  Write-Host "PARTIAL: adb missing. Wrote $outFile"
  exit 0
}
adb logcat -d -t 400 *:W 2>&1 | Out-File -FilePath $outFile -Encoding utf8
Write-Host "Wrote $outFile"
