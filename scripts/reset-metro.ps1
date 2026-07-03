# Clears Metro / Expo caches that cause "Reloading..." hangs on Windows.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

$dirs = @(
    (Join-Path $root '.metro-tmp'),
    (Join-Path $root 'node_modules\.cache\metro'),
    (Join-Path $root '.expo')
)

foreach ($dir in $dirs) {
    if (Test-Path $dir) {
        Write-Host "Removing $dir"
        Remove-Item -Recurse -Force $dir
    }
}

# Metro expects this folder immediately after cache reset (ENOENT otherwise).
$metroTmp = Join-Path $root '.metro-tmp'
New-Item -ItemType Directory -Force -Path $metroTmp | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $root 'node_modules\.cache\metro') | Out-Null

Write-Host 'Metro cache cleared. Run: npm run start:dev-client:clear'
