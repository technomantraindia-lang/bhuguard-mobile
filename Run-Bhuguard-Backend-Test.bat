@echo off
setlocal
cd /d "%~dp0"
call npm run qa:backend
set EXITCODE=%ERRORLEVEL%
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0qa\scripts\generate-report.ps1"
exit /b %EXITCODE%
