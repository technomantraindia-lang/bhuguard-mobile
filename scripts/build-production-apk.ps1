# Local production APK - does NOT use EAS cloud build quota.
$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$androidDir = Join-Path $repoRoot "android"
$releasesDir = Join-Path $repoRoot "releases"
$envProductionFile = Join-Path $repoRoot ".env.production"
$envFile = Join-Path $repoRoot ".env"

$env:JAVA_HOME = if ($env:JAVA_HOME) { $env:JAVA_HOME } else { "C:\Program Files\Android\Android Studio\jbr" }
$env:ANDROID_HOME = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { "$env:LOCALAPPDATA\Android\Sdk" }
$env:GRADLE_USER_HOME = if ($env:GRADLE_USER_HOME) { $env:GRADLE_USER_HOME } else { Join-Path $env:USERPROFILE ".gradle" }
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"
$env:NODE_ENV = "production"

function Import-ExpoPublicEnvFile([string]$path) {
  if (-not (Test-Path $path)) {
    return
  }

  Get-Content $path | ForEach-Object {
    if ($_ -match '^\s*EXPO_PUBLIC_(\w+)=(.*)$') {
      Set-Item -Path "env:EXPO_PUBLIC_$($Matches[1])" -Value $Matches[2].Trim()
    }
  }
}

Push-Location $repoRoot
try {
  # Prefer .env.production, then optional .env — but ALWAYS force live ERP after import.
  Import-ExpoPublicEnvFile $envFile
  Import-ExpoPublicEnvFile $envProductionFile

  $env:EXPO_PUBLIC_APP_VARIANT = "production"
  $env:EXPO_PUBLIC_APP_URL = "https://erp.bhuguard.com"
  $env:EXPO_PUBLIC_API_URL = "https://erp.bhuguard.com/api"
  $env:EXPO_PUBLIC_ENABLE_DEMO_CONSENT_OTP = "false"
  $env:EXPO_PUBLIC_ENABLE_DEMO_LOGIN = "false"

  Write-Host "Building Bhuguard production APK locally (API: $env:EXPO_PUBLIC_API_URL)" -ForegroundColor Cyan
  Write-Host "This build runs on your PC - no EAS cloud quota used." -ForegroundColor DarkGray

  if (-not (Test-Path (Join-Path $androidDir "gradlew.bat"))) {
    Write-Host "Creating android/ project (expo prebuild)..." -ForegroundColor Yellow
    npx expo prebuild --platform android --no-install
  } else {
    Write-Host "Using existing android/ project. Run with -CleanNative to regenerate." -ForegroundColor DarkGray
  }

  Push-Location $androidDir
  .\gradlew --stop 2>$null
  Start-Sleep -Seconds 2
  .\gradlew assembleRelease -x lint -x lintVitalAnalyzeRelease --no-daemon
  Pop-Location

  $apk = Join-Path $androidDir "app\build\outputs\apk\release\app-release.apk"
  if (-not (Test-Path $apk)) {
    throw "APK not found at $apk"
  }

  New-Item -ItemType Directory -Force -Path $releasesDir | Out-Null
  $version = (Get-Content (Join-Path $repoRoot "app.json") | ConvertFrom-Json).expo.version
  $dest = Join-Path $releasesDir "Bhuguard-v$version-production.apk"
  $offlineLiveDest = Join-Path $releasesDir "Bhuguard-Offline-LiveERP.apk"
  Copy-Item -Force $apk $dest
  Copy-Item -Force $apk $offlineLiveDest

  Write-Host ""
  Write-Host "Production APK ready:" -ForegroundColor Green
  Write-Host $dest
  Write-Host $offlineLiveDest
  Write-Host ""
  Write-Host "API URL baked in: $env:EXPO_PUBLIC_API_URL" -ForegroundColor Cyan
  certutil -hashfile $offlineLiveDest SHA256
}
catch {
  Write-Host ""
  Write-Host "Local Gradle build failed. Try EAS local build instead (also free, no cloud quota):" -ForegroundColor Yellow
  Write-Host "  npm run build:eas:local:android" -ForegroundColor White
  Write-Host ""
  throw
}
finally {
  Pop-Location
}
