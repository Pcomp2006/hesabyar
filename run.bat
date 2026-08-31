@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1
title CluDari Setup and Run
cd /d "%~dp0"

echo.
echo ========================================
echo   CluDari - Personal Accounting
echo   Auto install dependencies
echo ========================================
echo.

set "PY="
where python >nul 2>&1
if %errorlevel%==0 set "PY=python"
if not defined PY (
  where py >nul 2>&1
  if !errorlevel!==0 (
    py -3 -c "import sys" >nul 2>&1
    if !errorlevel!==0 set "PY=py -3"
  )
)
if not defined PY (
  where python3 >nul 2>&1
  if !errorlevel!==0 set "PY=python3"
)

if not defined PY (
  echo [!] Python not found. Trying winget install...
  where winget >nul 2>&1
  if !errorlevel!==0 (
    winget install -e --id Python.Python.3.12 --accept-package-agreements --accept-source-agreements
    set "PATH=%LocalAppData%\Programs\Python\Python312;%LocalAppData%\Programs\Python\Python312\Scripts;%PATH%"
    where python >nul 2>&1
    if !errorlevel!==0 set "PY=python"
    if not defined PY (
      where py >nul 2>&1
      if !errorlevel!==0 set "PY=py -3"
    )
  )
)

if not defined PY (
  echo.
  echo [ERROR] Python is not installed.
  echo Download from: https://www.python.org/downloads/
  echo Enable "Add python.exe to PATH" during install.
  echo.
  start https://www.python.org/downloads/
  echo.
  pause
  exit /b 1
)

echo [*] Python:
%PY% --version
if errorlevel 1 (
  echo [ERROR] Cannot run Python.
  pause
  exit /b 1
)

echo [*] Checking pip...
%PY% -m pip --version >nul 2>&1
if errorlevel 1 (
  echo [*] Installing pip...
  %PY% -m ensurepip --upgrade
)

echo [*] Upgrading pip...
%PY% -m pip install --upgrade pip -q

echo [*] Installing app packages...
if exist requirements.txt (
  %PY% -m pip install -r requirements.txt
  if errorlevel 1 (
    echo [!] Retry with --user ...
    %PY% -m pip install --user -r requirements.txt
  )
) else (
  %PY% -m pip install "fastapi>=0.100.0" "uvicorn>=0.23.0" "python-multipart>=0.0.6" "jdatetime>=4.0.0" "pywebview>=5.0" "a2wsgi>=1.10.0"
)

echo [*] Verifying packages...
%PY% -c "import fastapi,uvicorn,jdatetime,a2wsgi"
if errorlevel 1 (
  echo [ERROR] Required packages missing. Check internet connection.
  pause
  exit /b 1
)

%PY% -c "import webview" >nul 2>&1
if errorlevel 1 (
  echo [!] pywebview not available - will open in browser.
) else (
  echo [*] pywebview OK - desktop window enabled.
)

echo.
echo ========================================
echo   Starting CluDari...
echo   Login: root / root
echo   Network: see LAN URL after server starts
echo   Config: cludari_server.ini
echo ========================================
echo.

%PY% main.py
set "EXITCODE=!errorlevel!"

echo.
if not "!EXITCODE!"=="0" (
  echo [ERROR] App exited with code !EXITCODE!
) else (
  echo [*] App closed.
)
echo.
echo Press any key to close this window...
pause >nul
exit /b !EXITCODE!
