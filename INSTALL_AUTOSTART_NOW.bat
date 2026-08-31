@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"
title CluDari Autostart

echo ========================================
echo  Install CluDari hidden autostart
echo ========================================
echo.

if not exist "%~dp0start_hidden_server.py" (
  echo [ERROR] start_hidden_server.py not found
  pause
  exit /b 1
)
if not exist "%~dp0main.py" (
  echo [ERROR] main.py not found
  pause
  exit /b 1
)

where python >nul 2>&1
if errorlevel 1 (
  echo [ERROR] python not in PATH
  pause
  exit /b 1
)

set "EXE=pythonw"
where pythonw >nul 2>&1
if errorlevel 1 set "EXE=python"

set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "STARTER=%STARTUP%\CluDariServer.bat"
set "DIR=%~dp0"

REM Remove trailing backslash issues by using short form in file
echo Writing: %STARTER%

(
echo @echo off
echo cd /d "%DIR%"
echo set CLU_SERVER_ONLY=1
echo set CLU_NO_WINDOW=1
echo set CLU_HOST=0.0.0.0
echo start "" /B %EXE% start_hidden_server.py
) > "%STARTER%"

if not exist "%STARTER%" (
  echo [ERROR] Could not write Startup bat
  pause
  exit /b 1
)

echo [OK] Autostart installed:
echo     %STARTER%
echo.
echo Starting server once now (hidden)...
call "%~dp0run-server-hidden.bat"
echo.
echo ========================================
echo  Done. After Windows login, server starts
echo  with no window.
echo  Open: http://127.0.0.1:8000
echo  Stop: stop-server.bat
echo  Remove: uninstall-autostart.bat
echo ========================================
pause
