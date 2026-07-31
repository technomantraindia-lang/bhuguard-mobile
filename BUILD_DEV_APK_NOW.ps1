$ErrorActionPreference = "Stop"

Write-Host "=== Bhuguard Full Dev APK Build ===" -ForegroundColor Green

$ProjectRoot = "C:\Users\Admin\Desktop\bhuguard-mobile"
if (-not (Test-Path $ProjectRoot)) {
    throw "Project folder not found: $ProjectRoot"
}

Set-Location $ProjectRoot

# Use writable user folders to avoid Metro/Gradle permission problems.
$env:TEMP = "$env:LOCALAPPDATA\Temp"
$env:TMP = "$env:LOCALAPPDATA\Temp"
$env:GRADLE_USER_HOME = "$env:USERPROFILE\.gradle-bhuguard"

# Android Studio bundled Java 17.
$DefaultJavaHome = "C:\Program Files\Android\Android Studio\jbr"
if (Test-Path $DefaultJavaHome) {
    $env:JAVA_HOME = $DefaultJavaHome
}

$DefaultAndroidHome = "$env:LOCALAPPDATA\Android\Sdk"
if (Test-Path $DefaultAndroidHome) {
    $env:ANDROID_HOME = $DefaultAndroidHome
    $env:ANDROID_SDK_ROOT = $DefaultAndroidHome
    $env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:Path"
}

Write-Host "`n[1/8] Environment check" -ForegroundColor Cyan
java -version
node --version
npm --version

if (-not (Test-Path ".\package.json")) {
    throw "package.json was not found in $ProjectRoot"
}

Write-Host "`n[2/8] Installing project dependencies" -ForegroundColor Cyan
npm install

Write-Host "`n[3/8] Verifying MapLibre dependency" -ForegroundColor Cyan
npm ls @maplibre/maplibre-react-native
if ($LASTEXITCODE -ne 0) {
    throw "MapLibre dependency is missing or invalid. Fix package.json before building."
}

Write-Host "`n[4/8] Resolving Expo configuration" -ForegroundColor Cyan
npx expo config --type public | Out-Host
if ($LASTEXITCODE -ne 0) {
    throw "Expo configuration failed."
}

Write-Host "`n[5/8] Generating fresh Android native project" -ForegroundColor Cyan
npx expo prebuild --platform android --clean --non-interactive
if ($LASTEXITCODE -ne 0) {
    throw "Expo prebuild failed."
}

Write-Host "`n[6/8] Building debug APK" -ForegroundColor Cyan
Set-Location "$ProjectRoot\android"
.\gradlew.bat --stop
.\gradlew.bat :app:assembleDebug --no-daemon --stacktrace
if ($LASTEXITCODE -ne 0) {
    throw "Gradle debug APK build failed."
}

Write-Host "`n[7/8] Copying APK" -ForegroundColor Cyan
$SourceApk = "$ProjectRoot\android\app\build\outputs\apk\debug\app-debug.apk"
if (-not (Test-Path $SourceApk)) {
    throw "APK was not produced at: $SourceApk"
}

$DistDir = "$ProjectRoot\dist"
New-Item -ItemType Directory -Force -Path $DistDir | Out-Null
$FinalApk = "$DistDir\Bhuguard-Full-Dev-Client.apk"
Copy-Item $SourceApk $FinalApk -Force

Write-Host "`n[8/8] Build complete" -ForegroundColor Green
Get-Item $FinalApk | Select-Object FullName, Length, LastWriteTime | Format-List

$Adb = "$env:ANDROID_HOME\platform-tools\adb.exe"
if (Test-Path $Adb) {
    Write-Host "Connected devices:" -ForegroundColor Cyan
    & $Adb devices

    $deviceLines = (& $Adb devices) | Select-String "`tdevice$"
    if ($deviceLines) {
        Write-Host "Installing APK on connected Android device..." -ForegroundColor Cyan
        & $Adb install -r $FinalApk
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Automatic installation failed. Install the APK manually from: $FinalApk"
        }
    } else {
        Write-Host "No authorized Android device detected. Install manually from:" -ForegroundColor Yellow
        Write-Host $FinalApk -ForegroundColor Yellow
    }
} else {
    Write-Host "ADB not found. Install manually from:" -ForegroundColor Yellow
    Write-Host $FinalApk -ForegroundColor Yellow
}

Write-Host "`nIMPORTANT: This is a development APK. Keep Metro and the Laravel backend running during the demo." -ForegroundColor Yellow
