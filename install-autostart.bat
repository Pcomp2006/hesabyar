@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"
title CluDari Autostart

echo Installing fully-hidden autostart...

if not exist "%~dp0start_hidden_server.py" (
  echo [ERROR] start_hidden_server.py missing
  pause
  exit /b 1
)

set "EXE=pythonw"
where pythonw >nul 2>&1
if errorlevel 1 set "EXE=python"

set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "STARTER=%STARTUP%\CluDariServer.bat"
set "DIR=%~dp0"

(
echo @echo off
echo cd /d "%DIR%"
echo for /f "tokens=5" %%%%a in ^('netstat -ano 2^>nul ^| findstr ":8000" ^| findstr "LISTENING"'^) do taskkill /F /PID %%%%a ^>nul 2^>^&1
echo start "" /B powershell -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -Command "Start-Process -FilePath ((Get-Command %EXE%).Source) -ArgumentList 'start_hidden_server.py' -WorkingDirectory '%DIR%' -WindowStyle Hidden"
) > "%STARTER%"

echo [OK] %STARTER%
echo.
echo Starting once now...
call "%~dp0run-server-hidden.bat"
echo Done.
pause
