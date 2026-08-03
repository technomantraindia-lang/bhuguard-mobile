@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0qa\scripts\generate-report.ps1"
exit /b %ERRORLEVEL%
