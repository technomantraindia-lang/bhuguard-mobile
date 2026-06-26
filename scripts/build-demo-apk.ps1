$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$androidDir = Join-Path $repoRoot "android"
$releasesDir = Join-Path $repoRoot "releases"
$envFile = Join-Path $repoRoot ".env.demo"

$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"
$env:EXPO_PUBLIC_APP_VARIANT = "demo"
$env:EXPO_PUBLIC_API_URL = "https://demo.bhuguard.com/api"
$env:NODE_ENV = "production"

Write-Host "Building Bhuguard demo APK (API: $env:EXPO_PUBLIC_API_URL)" -ForegroundColor Cyan

Push-Location $repoRoot
try {
  if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
      if ($_ -match '^\s*EXPO_PUBLIC_(\w+)=(.*)$') {
        Set-Item -Path "env:EXPO_PUBLIC_$($Matches[1])" -Value $Matches[2].Trim()
      }
    }
  }

  $needsPrebuild = -not (Test-Path (Join-Path $androidDir "gradlew.bat"))
  if ($needsPrebuild) {
    if (Test-Path $androidDir) {
      Write-Host "Incomplete android/ folder — regenerating..." -ForegroundColor Yellow
      Remove-Item -Recurse -Force $androidDir -ErrorAction SilentlyContinue
    }
    npx expo prebuild --platform android --no-install
  } elseif (-not (Test-Path $androidDir)) {
    npx expo prebuild --platform android --no-install
  } else {
    Write-Host "Using existing android/ project." -ForegroundColor DarkGray
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
  $dest = Join-Path $releasesDir "Bhuguard-v$version-demo.apk"
  Copy-Item -Force $apk $dest

  Write-Host ""
  Write-Host "Demo APK ready:" -ForegroundColor Green
  Write-Host $dest
  Write-Host ""
  Write-Host "API URL baked in: $env:EXPO_PUBLIC_API_URL" -ForegroundColor Cyan
}
finally {
  Pop-Location
}
