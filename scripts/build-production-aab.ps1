# Local production AAB (Play Store) - does NOT use EAS cloud build quota.
$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$androidDir = Join-Path $repoRoot "android"
$releasesDir = Join-Path $repoRoot "releases"
$envFile = Join-Path $repoRoot ".env"

$env:JAVA_HOME = if ($env:JAVA_HOME) { $env:JAVA_HOME } else { "C:\Program Files\Android\Android Studio\jbr" }
$env:ANDROID_HOME = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { "$env:LOCALAPPDATA\Android\Sdk" }
$env:GRADLE_USER_HOME = if ($env:GRADLE_USER_HOME) { $env:GRADLE_USER_HOME } else { Join-Path $env:USERPROFILE ".gradle" }
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"
$env:EXPO_PUBLIC_APP_VARIANT = "production"
$env:EXPO_PUBLIC_APP_URL = if ($env:EXPO_PUBLIC_APP_URL) { $env:EXPO_PUBLIC_APP_URL } else { "https://erp.bhuguard.com" }
$env:EXPO_PUBLIC_API_URL = if ($env:EXPO_PUBLIC_API_URL) { $env:EXPO_PUBLIC_API_URL } else { "https://erp.bhuguard.com/api" }
$env:NODE_ENV = "production"

Write-Host "Building Bhuguard production AAB locally (API: $env:EXPO_PUBLIC_API_URL)" -ForegroundColor Cyan

Push-Location $repoRoot
try {
  if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
      if ($_ -match '^\s*EXPO_PUBLIC_(\w+)=(.*)$') {
        Set-Item -Path "env:EXPO_PUBLIC_$($Matches[1])" -Value $Matches[2].Trim()
      }
    }
  }

  if (-not (Test-Path (Join-Path $androidDir "gradlew.bat"))) {
    npx expo prebuild --platform android --no-install
  }

  Push-Location $androidDir
  .\gradlew --stop 2>$null
  Start-Sleep -Seconds 2
  .\gradlew bundleRelease -x lint -x lintVitalAnalyzeRelease --no-daemon
  Pop-Location

  $aab = Join-Path $androidDir "app\build\outputs\bundle\release\app-release.aab"
  if (-not (Test-Path $aab)) {
    throw "AAB not found at $aab"
  }

  New-Item -ItemType Directory -Force -Path $releasesDir | Out-Null
  $version = (Get-Content (Join-Path $repoRoot "app.json") | ConvertFrom-Json).expo.version
  $dest = Join-Path $releasesDir "Bhuguard-v$version-production.aab"
  Copy-Item -Force $aab $dest

  Write-Host "Production AAB ready:" -ForegroundColor Green
  Write-Host $dest
}
finally {
  Pop-Location
}
