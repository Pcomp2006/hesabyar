@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title CluDari hidden start

echo ========================================
echo  CluDari - start HIDDEN server
echo ========================================
echo.

where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] python not found
  pause
  exit /b 1
)

echo [*] Stopping whatever is on port 8000...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":8000" ^| findstr "LISTENING"') do (
  echo     kill PID %%a
  taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul

if exist server-hidden.log del server-hidden.log >nul 2>&1

set "EXE=pythonw"
where pythonw >nul 2>&1
if %ERRORLEVEL% NEQ 0 set "EXE=python"

echo [*] Launching %EXE% start_hidden_server.py ...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$dir='%~dp0';" ^
  "$exe=(Get-Command '%EXE%').Source;" ^
  "$p=Start-Process -FilePath $exe -ArgumentList 'start_hidden_server.py' -WorkingDirectory $dir -WindowStyle Hidden -PassThru;" ^
  "Set-Content -Path ($dir+'server.pid') -Value $p.Id;" ^
  "Write-Host ('PID=' + $p.Id)"

echo [*] Waiting for port 8000 (up to 40s)...
set /a N=0
:loop
set /a N+=1
if %N% GTR 40 goto fail
timeout /t 1 /nobreak >nul 2>&1
powershell -NoProfile -Command "try{$c=New-Object Net.Sockets.TcpClient;$c.Connect('192.168.100.16',8000);$c.Close();exit 0}catch{exit 1}" >nul 2>&1
if %ERRORLEVEL% EQU 0 goto ok
goto loop

:ok
echo [OK] Hidden server is up.
echo     Open: http://192.168.100.16:8000
start http://192.168.100.16:8000/
echo.
echo This launcher will close. Server stays in background.
echo Stop later with: stop-server.bat
timeout /t 3 /nobreak >nul
exit /b 0

:fail
echo [FAIL] Port 8000 never opened.
echo.
echo --- last lines of server-hidden.log ---
if exist server-hidden.log (
  powershell -NoProfile -Command "Get-Content -Path 'server-hidden.log' -Tail 30"
) else (
  echo (no log file - process may have been blocked by antivirus)
)
echo.
echo Tip: use run-server.bat if hidden mode is blocked.
pause
exit /b 1
