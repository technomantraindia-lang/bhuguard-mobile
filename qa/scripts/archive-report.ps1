$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$latest = Join-Path $root 'test-results\latest'
$history = Join-Path $root 'test-results\history'
New-Item -ItemType Directory -Force -Path $history | Out-Null
if (Test-Path (Join-Path $latest 'reports')) {
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $dest = Join-Path $history $stamp
  New-Item -ItemType Directory -Force -Path $dest | Out-Null
  Copy-Item -Recurse -Force (Join-Path $latest '*') $dest -ErrorAction SilentlyContinue
}
Write-Host "Archived to $dest"
