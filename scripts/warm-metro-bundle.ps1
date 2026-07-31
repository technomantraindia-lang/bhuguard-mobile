# Pre-builds the Android JS bundle so the phone connects faster over Wi-Fi.
$ErrorActionPreference = 'Stop'
$port = 8081
$ip = (
    Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.IPAddress -notlike '127.*' -and $_.PrefixOrigin -ne 'WellKnown' } |
    Select-Object -First 1 -ExpandProperty IPAddress
)

if (-not $ip) {
    Write-Host 'No LAN IP found; skipping bundle warm-up.'
    exit 0
}

$url = "http://${ip}:$port/index.bundle?platform=android&dev=true&minify=false"
Write-Host "Warming Metro bundle: $url"

try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 180
    $mb = [math]::Round($response.Content.Length / 1MB, 1)
    Write-Host "Bundle ready ($mb MB). Phone can connect now."
} catch {
    Write-Host "Bundle warm-up failed: $($_.Exception.Message)"
    exit 1
}
