$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$androidDir = Join-Path $repoRoot "android"
$releasesDir = Join-Path $repoRoot "releases"

$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"
$env:NODE_ENV = "production"

Push-Location $repoRoot
try {
  if (-not (Test-Path $androidDir)) {
    npx expo prebuild --platform android --no-install
  }

  Push-Location $androidDir
  .\gradlew assembleRelease -x lint -x lintVitalAnalyzeRelease --no-daemon
  Pop-Location

  $apk = Join-Path $androidDir "app\build\outputs\apk\release\app-release.apk"
  if (-not (Test-Path $apk)) {
    throw "APK not found at $apk"
  }

  New-Item -ItemType Directory -Force -Path $releasesDir | Out-Null
  $version = (Get-Content (Join-Path $repoRoot "app.json") | ConvertFrom-Json).expo.version
  $dest = Join-Path $releasesDir "Bhuguard-v$version-client.apk"
  Copy-Item -Force $apk $dest
  Write-Host ""
  Write-Host "Client APK ready:" -ForegroundColor Green
  Write-Host $dest
}
finally {
  Pop-Location
}
