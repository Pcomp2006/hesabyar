@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul 2>&1
title CluDari - Central Server
set CLU_SERVER_ONLY=1
set CLU_NO_WINDOW=

echo ========================================
echo   CluDari - CENTRAL SERVER
echo ========================================
echo  Keep this window open while others work.
echo ========================================
echo.

REM Free port 8000 first (old hidden servers)
echo [*] Stopping old server if any...
if exist server.pid (
  set /p _OPID=<server.pid
  if defined _OPID taskkill /F /PID %_OPID% >nul 2>&1
  del server.pid >nul 2>&1
)
if exist .cludari.pid (
  set /p _OPID2=<.cludari.pid
  if defined _OPID2 taskkill /F /PID %_OPID2% >nul 2>&1
  del .cludari.pid >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":8000" ^| findstr "LISTENING"') do (
  echo [*] Freeing port 8000 PID %%a
  taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul

where python >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Python not found
  pause
  exit /b 1
)

python -m pip install -q -r requirements.txt 2>nul
echo [*] Starting...
python main.py
echo.
echo Server stopped.
pause
