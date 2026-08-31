@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"
title Stop CluDari
echo Stopping all CluDari / port 8000 processes...

if exist server.pid (
  set /p PID=<server.pid
  if defined PID taskkill /F /PID %PID% >nul 2>&1
  del server.pid >nul 2>&1
)
if exist .cludari.pid (
  set /p PID2=<.cludari.pid
  if defined PID2 taskkill /F /PID %PID2% >nul 2>&1
  del .cludari.pid >nul 2>&1
)

REM Kill anything listening on 8000
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":8000" ^| findstr "LISTENING"') do (
  echo Killing PID %%a
  taskkill /F /PID %%a >nul 2>&1
)

REM Kill python running main.py / start_hidden from this folder (best-effort)
wmic process where "CommandLine like '%%main.py%%' and Name='python.exe'" call terminate >nul 2>&1
wmic process where "CommandLine like '%%main.py%%' and Name='pythonw.exe'" call terminate >nul 2>&1
wmic process where "CommandLine like '%%start_hidden_server.py%%'" call terminate >nul 2>&1

echo Done. Port 8000 should be free.
timeout /t 2 >nul
