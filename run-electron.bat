@echo off
setlocal
chcp 65001 >nul 2>&1
title CluDari Electron
cd /d "%~dp0"

echo.
echo ========================================
echo   CluDari Electron
echo ========================================
echo.

set "PY="
where python >nul 2>&1 && set "PY=python"
if not defined PY where py >nul 2>&1 && set "PY=py -3"
if not defined PY (
  echo [ERROR] Python not found. Run run.bat first.
  pause
  exit /b 1
)

echo [*] Installing Python packages...
%PY% -m pip install -r requirements.txt -q

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js not found.
  echo Install from: https://nodejs.org
  start https://nodejs.org
  pause
  exit /b 1
)

cd electron
if not exist node_modules (
  echo [*] npm install...
  call npm install
)
echo [*] Starting Electron...
call npm start
pause
