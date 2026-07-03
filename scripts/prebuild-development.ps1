$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot

$devApiUrl = if ($env:EXPO_PUBLIC_DEV_LOCAL_API_URL) { $env:EXPO_PUBLIC_DEV_LOCAL_API_URL } else { "http://192.168.0.100:8000/api" }
$env:EXPO_PUBLIC_APP_VARIANT = "development"
$env:EXPO_PUBLIC_API_URL = $devApiUrl
$env:EXPO_PUBLIC_DEV_LOCAL_API_URL = $devApiUrl
$env:NODE_ENV = "development"

Push-Location $repoRoot
try {
  Write-Host "Prebuilding Android development client (scheme: bhuguard, dev scheme: exp+bhuguard-mobile)" -ForegroundColor Cyan
  npx expo prebuild --platform android --clean --no-install
}
finally {
  Pop-Location
}
