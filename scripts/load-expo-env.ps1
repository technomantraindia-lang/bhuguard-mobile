param(
  [string] $Root
)

if (-not $Root) {
  $Root = Split-Path -Parent $PSScriptRoot
}

$placeholderApiKeys = @(
  'USER_REAL_GOOGLE_MAPS_ANDROID_API_KEY',
  'your_google_maps_api_key',
  'YOUR_GOOGLE_MAPS_API_KEY',
  'PASTE_YOUR_REAL_KEY_HERE',
  'PASTE_REAL_GOOGLE_MAPS_API_KEY_HERE'
)

function Import-ExpoEnvFile {
  param([string] $Path)

  if (-not (Test-Path $Path)) {
    return
  }

  Get-Content $Path | ForEach-Object {
    if ($_ -match '^\s*#') {
      return
    }

    if ($_ -match '^\s*EXPO_PUBLIC_(\w+)=(.*)$') {
      $name = "EXPO_PUBLIC_$($Matches[1])"
      $value = $Matches[2].Trim()

      if ($name -eq 'EXPO_PUBLIC_GOOGLE_MAPS_API_KEY') {
        if ([string]::IsNullOrWhiteSpace($value) -or $placeholderApiKeys -contains $value) {
          return
        }
      }

      Set-Item -Path "env:$name" -Value $value
    }
  }
}

$files = @(
  (Join-Path $Root '.env'),
  (Join-Path $Root '.env.development'),
  (Join-Path $Root '.env.local')
)

foreach ($file in $files) {
  Import-ExpoEnvFile -Path $file
}

if (-not $env:EXPO_PUBLIC_USE_NATIVE_MAPS) {
  # MapTiler is the default map provider in app.config.js. Native Google Maps
  # is optional and must not block a development build without a Google key.
  $env:EXPO_PUBLIC_USE_NATIVE_MAPS = 'false'
}

function Test-RealGoogleMapsApiKey([string] $value) {
  return (-not [string]::IsNullOrWhiteSpace($value))
    -and $value.StartsWith('AIza')
    -and ($value.Length -ge 20)
    -and ($placeholderApiKeys -notcontains $value)
}

$hasRealApiKey = Test-RealGoogleMapsApiKey $env:EXPO_PUBLIC_GOOGLE_MAPS_API_KEY

# Do not make a Google key a hard requirement for development. The app uses
# MapTiler when native Google Maps is unavailable.
if (-not $hasRealApiKey -and $env:EXPO_PUBLIC_USE_NATIVE_MAPS -eq 'true') {
  $env:EXPO_PUBLIC_USE_NATIVE_MAPS = 'false'
  Write-Host 'No Google Maps key found; falling back to MapTiler for this build.' -ForegroundColor Yellow
}

Write-Host "Expo env: USE_NATIVE_MAPS=$($env:EXPO_PUBLIC_USE_NATIVE_MAPS), API key present=$hasRealApiKey"

if ($env:EXPO_PUBLIC_USE_NATIVE_MAPS -ne 'true') {
  Write-Host 'WARNING: EXPO_PUBLIC_USE_NATIVE_MAPS is not true. Satellite maps will stay disabled.' -ForegroundColor Yellow
}

if (-not $hasRealApiKey) {
  Write-Host 'WARNING: No Google Maps API key loaded; continuing with MapLibre/MapTiler.' -ForegroundColor Yellow
}
