# Stops stale Metro/Expo processes, clears cache, starts one dev server on port 8081.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$port = 8081

function Stop-PortListeners([int[]] $ports) {
    foreach ($p in $ports) {
        $lines = netstat -ano | Select-String ":$p\s" | Select-String "LISTENING"
        foreach ($line in $lines) {
            if ($line -match '\s+(\d+)\s*$') {
                $procId = [int] $Matches[1]
                if ($procId -le 4) {
                    continue
                }

                try {
                    $name = (Get-Process -Id $procId -ErrorAction Stop).ProcessName
                    Write-Host "Stopping $name (PID $procId) on port $p"
                    Stop-Process -Id $procId -Force -ErrorAction Stop
                } catch {
                    Write-Host "Could not stop PID $procId on port $p"
                }
            }
        }
    }

    Start-Sleep -Seconds 1
}

Write-Host '=== Bhuguard dev server ==='
Write-Host "Project: $root"
Write-Host ''

Stop-PortListeners -ports @(8081, 8082, 8083, 8084)

& (Join-Path $PSScriptRoot 'reset-metro.ps1')

Set-Location $root

$ip = (
    Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.IPAddress -notlike '127.*' -and $_.PrefixOrigin -ne 'WellKnown' } |
    Select-Object -First 1 -ExpandProperty IPAddress
)

Write-Host ''
Write-Host "Metro URL : http://localhost:$port"
if ($ip) {
    Write-Host "Phone URL : http://${ip}:$port  (same Wi-Fi as this PC)"
}
Write-Host ''
Write-Host 'On phone: open the Bhuguard DEV BUILD app (not Expo Go), then scan the QR code.'
Write-Host 'Laravel API: http://192.168.1.18:8000/api (from .env.development)'
Write-Host ''

$env:EXPO_NO_INTERACTIVE = '1'
npx expo start --dev-client --lan --clear --port $port
