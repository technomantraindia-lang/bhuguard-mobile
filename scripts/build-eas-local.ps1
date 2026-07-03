# EAS build on your machine - does NOT use EAS cloud build quota.
param(
  [ValidateSet("android", "ios")]
  [string]$Platform = "android",
  [ValidateSet("preview", "demo", "production")]
  [string]$Profile = "production"
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot

Push-Location $repoRoot
try {
  Write-Host "Starting local EAS build: platform=$Platform profile=$Profile" -ForegroundColor Cyan
  Write-Host "Runs on this PC - no EAS cloud quota used." -ForegroundColor DarkGray
  npx eas-cli@latest build -p $Platform --profile $Profile --local --non-interactive
}
finally {
  Pop-Location
}
