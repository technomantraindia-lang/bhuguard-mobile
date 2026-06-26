$ErrorActionPreference = "Stop"
$env:EXPO_PUBLIC_APP_VARIANT = "demo"
$env:EXPO_PUBLIC_API_URL = "https://demo.bhuguard.com/api"
$env:NODE_ENV = "production"

Push-Location (Split-Path -Parent $PSScriptRoot)
npx expo prebuild --platform android --clean --no-install
Pop-Location
