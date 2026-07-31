$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\Users\Admin\Desktop\bhuguard-mobile"
if (-not (Test-Path $ProjectRoot)) {
    throw "Project folder not found: $ProjectRoot"
}

Set-Location $ProjectRoot

$env:TEMP = "$env:LOCALAPPDATA\Temp"
$env:TMP = "$env:LOCALAPPDATA\Temp"

cmd.exe /c "taskkill /F /IM node.exe" 2>$null

Write-Host "Starting Bhuguard Metro development server..." -ForegroundColor Green
npx expo start --dev-client --clear --host lan
