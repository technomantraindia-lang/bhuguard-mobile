$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot

$env:EXPO_PUBLIC_APP_VARIANT = "development"
$env:EXPO_PUBLIC_APP_URL = 'https://erp.bhuguard.com'
$env:EXPO_PUBLIC_API_URL = 'https://erp.bhuguard.com/api'
Remove-Item Env:EXPO_PUBLIC_DEV_LOCAL_API_URL -ErrorAction SilentlyContinue
$env:NODE_ENV = "development"

Push-Location $repoRoot
try {
  . (Join-Path $PSScriptRoot 'load-expo-env.ps1') -Root $repoRoot

  Write-Host "Prebuilding Android development client (scheme: bhuguard, dev scheme: exp+bhuguard-mobile)" -ForegroundColor Cyan
  npx expo prebuild --platform android --clean --no-install
}
finally {
  Pop-Location
}
