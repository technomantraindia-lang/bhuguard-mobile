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

Set-Location $root

. (Join-Path $PSScriptRoot 'load-expo-env.ps1') -Root $root

# Prefer the adapter that owns the default route. This avoids advertising a
# Hyper-V/VPN address that the phone cannot reach from the same Wi-Fi network.
$ip = $null
$defaultRoute = Get-NetRoute -AddressFamily IPv4 -DestinationPrefix '0.0.0.0/0' -ErrorAction SilentlyContinue |
    Where-Object { $_.NextHop -and $_.RouteMetric -ge 0 } |
    Sort-Object RouteMetric |
    Select-Object -First 1

if ($defaultRoute) {
    $ip = Get-NetIPAddress -AddressFamily IPv4 -InterfaceIndex $defaultRoute.InterfaceIndex -ErrorAction SilentlyContinue |
        Where-Object { $_.IPAddress -notlike '127.*' -and $_.PrefixOrigin -ne 'WellKnown' } |
        Select-Object -First 1 -ExpandProperty IPAddress
}

if (-not $ip) {
    $ip = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object { $_.IPAddress -notlike '127.*' -and $_.PrefixOrigin -ne 'WellKnown' } |
        Select-Object -First 1 -ExpandProperty IPAddress
}

if ($ip) {
    $env:REACT_NATIVE_PACKAGER_HOSTNAME = $ip
}

Write-Host ''
Write-Host "Metro (JavaScript only): http://localhost:$port"
if ($ip) {
    Write-Host "Phone URL : http://${ip}:$port  (same Wi-Fi as this PC)"
    Write-Host "Manual connect in Bhuguard dev app:"
    Write-Host "  exp://${ip}:$port"
}
Write-Host ''
Write-Host 'On phone: open the Bhuguard DEV BUILD app (not Chrome and not Expo Go).'
Write-Host 'If it stays on "Connecting...", type the exp:// URL above inside the dev build.'
Write-Host 'Turn OFF mobile data; use the same Wi-Fi network as this PC.'
Write-Host ''

$env:EXPO_NO_INTERACTIVE = '1'
npx expo start --dev-client --clear --lan --port $port
