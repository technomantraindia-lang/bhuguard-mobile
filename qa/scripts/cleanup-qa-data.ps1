$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$latest = Join-Path $root 'test-results\latest'
$history = Join-Path $root 'test-results\history'
New-Item -ItemType Directory -Force -Path $history | Out-Null
if (Test-Path $latest) {
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $dest = Join-Path $history $stamp
  New-Item -ItemType Directory -Force -Path $dest | Out-Null
  Copy-Item -Recurse -Force (Join-Path $latest '*') $dest
}
# Remove only temporary QA results under latest (never source)
Get-ChildItem -Path $latest -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
@(
  'reports','screenshots','logs','api','mobile','backend'
) | ForEach-Object {
  New-Item -ItemType Directory -Force -Path (Join-Path $latest $_) | Out-Null
}
Write-Host "QA latest results cleaned. History archived when present."
