$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot

$env:EXPO_PUBLIC_APP_VARIANT = "development"
$env:EXPO_PUBLIC_API_URL = "http://192.168.1.18:8000/api"
$env:NODE_ENV = "development"

Push-Location $repoRoot
try {
  Write-Host "Prebuilding Android development client (scheme: bhuguard, dev scheme: exp+bhuguard-mobile)" -ForegroundColor Cyan
  npx expo prebuild --platform android --clean --no-install
}
finally {
  Pop-Location
}
