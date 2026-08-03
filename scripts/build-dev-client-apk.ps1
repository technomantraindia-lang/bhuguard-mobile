$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$androidDir = Join-Path $repoRoot "android"
$releasesDir = Join-Path $repoRoot "releases"
$envFile = Join-Path $repoRoot ".env"

$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"
$devApiUrl = if ($env:EXPO_PUBLIC_DEV_LOCAL_API_URL) { $env:EXPO_PUBLIC_DEV_LOCAL_API_URL } else { "http://192.168.1.11:8000/api" }
$env:EXPO_PUBLIC_APP_VARIANT = "development"
$env:EXPO_PUBLIC_APP_URL = if ($env:EXPO_PUBLIC_APP_URL) { $env:EXPO_PUBLIC_APP_URL } else { "http://192.168.1.11:8000" }
$env:EXPO_PUBLIC_API_URL = $devApiUrl
$env:EXPO_PUBLIC_DEV_LOCAL_API_URL = $devApiUrl
$env:NODE_ENV = "development"

Write-Host "Building Bhuguard Android development client (API: $env:EXPO_PUBLIC_API_URL)" -ForegroundColor Cyan

Push-Location $repoRoot
try {
  . (Join-Path $PSScriptRoot 'load-expo-env.ps1') -Root $repoRoot

  Write-Host "Regenerating native android/ with expo-dev-client and deep-link intent filters..." -ForegroundColor Yellow
  npx expo prebuild --platform android --clean --no-install

  # Expo prebuild can leave Fabric on; force old architecture to avoid
  # IllegalViewOperationException / PreAllocateMountItem crashes on Android.
  $gradleProps = Join-Path $androidDir "gradle.properties"
  if (Test-Path $gradleProps) {
    $props = Get-Content $gradleProps -Raw
    if ($props -match 'newArchEnabled\s*=\s*true') {
      $props = $props -replace 'newArchEnabled\s*=\s*true', 'newArchEnabled=false'
      Set-Content -Path $gradleProps -Value $props -NoNewline
      Write-Host "Forced newArchEnabled=false in android/gradle.properties" -ForegroundColor Yellow
    }
  }

  $manifestPath = Join-Path $androidDir "app\src\main\AndroidManifest.xml"
  if (-not (Test-Path $manifestPath)) {
    throw "AndroidManifest.xml not found after prebuild."
  }

  $manifest = Get-Content $manifestPath -Raw
  if ($manifest -notmatch 'android:scheme="bhuguard"') {
    throw "Missing bhuguard scheme intent filter in AndroidManifest.xml"
  }
  if ($manifest -notmatch 'android:scheme="exp\+bhuguard-mobile"') {
    throw "Missing exp+bhuguard-mobile dev-client scheme in AndroidManifest.xml"
  }

  $mapsApiKey = $env:EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
  if ([string]::IsNullOrWhiteSpace($mapsApiKey) -or $mapsApiKey -eq 'USER_REAL_GOOGLE_MAPS_ANDROID_API_KEY' -or -not $mapsApiKey.StartsWith('AIza')) {
    throw @"
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is missing.

Run this once with your real Google Maps API key:
  npm run setup:maps -- -ApiKey "YOUR_GOOGLE_MAPS_API_KEY"

Then rebuild:
  npm run build:dev-client
"@
  }
  if ($env:EXPO_PUBLIC_USE_NATIVE_MAPS -ne "true") {
    Write-Host "WARNING: EXPO_PUBLIC_USE_NATIVE_MAPS is not true. Set it in .env for satellite farm mapping." -ForegroundColor Yellow
  }
  if ($manifest -notmatch 'com\.google\.android\.geo\.API_KEY') {
    throw "Google Maps API metadata is missing from AndroidManifest.xml after prebuild. Ensure react-native-maps plugin is configured and EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is set."
  }

  Write-Host "Google Maps metadata verified in AndroidManifest.xml" -ForegroundColor Green

  Push-Location $androidDir
  .\gradlew --stop 2>$null
  Start-Sleep -Seconds 2
  .\gradlew assembleDebug -x lint -x lintVitalAnalyzeDebug --no-daemon
  Pop-Location

  $apk = Join-Path $androidDir "app\build\outputs\apk\debug\app-debug.apk"
  if (-not (Test-Path $apk)) {
    throw "Debug APK not found at $apk"
  }

  New-Item -ItemType Directory -Force -Path $releasesDir | Out-Null
  $version = (Get-Content (Join-Path $repoRoot "app.json") | ConvertFrom-Json).expo.version
  $dest = Join-Path $releasesDir "Bhuguard-v$version-dev-client.apk"
  Copy-Item -Force $apk $dest

  Write-Host ""
  Write-Host "Development client APK ready:" -ForegroundColor Green
  Write-Host $dest
  Write-Host ""
  Write-Host "Deep link schemes: bhuguard:// and exp+bhuguard-mobile://" -ForegroundColor Cyan
  Write-Host "Start Metro: npx expo start --dev-client --host lan --port 8085" -ForegroundColor Cyan

  $adb = Join-Path $env:ANDROID_HOME "platform-tools\adb.exe"
  if (Test-Path $adb) {
    $devices = & $adb devices | Select-Object -Skip 1 | Where-Object { $_ -match '\tdevice$' }
    if ($devices.Count -gt 0) {
      Write-Host ""
      Write-Host "Installing on connected device..." -ForegroundColor Yellow
      & $adb install -r $dest
      Write-Host "Installed. Open the Bhuguard app, then connect to Metro from Expo CLI." -ForegroundColor Green
    } else {
      Write-Host ""
      Write-Host "No Android device detected. Connect USB debugging, then run:" -ForegroundColor Yellow
      Write-Host "  & `"$adb`" install -r `"$dest`""
    }
  }
}
finally {
  Pop-Location
}
