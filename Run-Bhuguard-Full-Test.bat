@echo off
setlocal
cd /d "%~dp0"
echo === Bhuguard Full QA Test Center ===
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0qa\scripts\archive-report.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Test-Path '.env.qa') { Get-Content '.env.qa' | ForEach-Object { if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }; $p=$_.Split('=',2); if($p.Length -eq 2){ Set-Item -Path ('Env:'+$p[0].Trim()) -Value ($p[1].Trim().Trim([char]34).Trim([char]39)) } } }"
call npm run qa:full
set EXITCODE=%ERRORLEVEL%
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0qa\scripts\generate-report.ps1"
echo.
echo HTML report: %~dp0test-results\latest\reports\index.html
exit /b %EXITCODE%
