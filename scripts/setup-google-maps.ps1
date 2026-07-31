param(
  [string] $ApiKey
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$envLocal = Join-Path $repoRoot '.env.local'

if (-not $ApiKey) {
  $ApiKey = $env:BHUGUARD_GOOGLE_MAPS_API_KEY
}

if (-not $ApiKey) {
  $ApiKey = $env:EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
}

if (-not $ApiKey -or $ApiKey.Trim().Length -lt 20) {
  Write-Host ''
  Write-Host 'Google Maps API key is required.' -ForegroundColor Red
  Write-Host ''
  Write-Host 'Usage:' -ForegroundColor Yellow
  Write-Host '  .\scripts\setup-google-maps.ps1 -ApiKey "YOUR_GOOGLE_MAPS_API_KEY"'
  Write-Host ''
  Write-Host 'Or set BHUGUARD_GOOGLE_MAPS_API_KEY, then run this script again.'
  Write-Host ''
  Write-Host 'Google Cloud requirements:' -ForegroundColor Cyan
  Write-Host '  1. Enable "Maps SDK for Android"'
  Write-Host '  2. Restrict key to package: com.bhuguard.app'
  Write-Host '  3. Add your debug SHA-1 for local development builds'
  exit 1
}

$ApiKey = $ApiKey.Trim()

$lines = @(
  '# Local secrets — not committed to git',
  'EXPO_PUBLIC_USE_NATIVE_MAPS=true',
  "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=$ApiKey"
)

Set-Content -Path $envLocal -Value ($lines -join "`n") -Encoding UTF8

Write-Host 'Saved Google Maps configuration to .env.local' -ForegroundColor Green
Write-Host ''
Write-Host 'Next steps:' -ForegroundColor Cyan
Write-Host '  1. Uninstall the old Bhuguard app from your Android phone'
Write-Host '  2. npm run build:dev-client'
Write-Host '  3. npx expo start --dev-client --clear --host lan'
