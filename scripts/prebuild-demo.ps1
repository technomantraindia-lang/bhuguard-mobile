$ErrorActionPreference = "Stop"
$env:EXPO_PUBLIC_APP_VARIANT = "demo"
$env:EXPO_PUBLIC_APP_URL = "https://erp.bhuguard.com"
$env:EXPO_PUBLIC_API_URL = "https://erp.bhuguard.com/api"
$env:NODE_ENV = "production"

Push-Location (Split-Path -Parent $PSScriptRoot)
npx expo prebuild --platform android --clean --no-install
Pop-Location
