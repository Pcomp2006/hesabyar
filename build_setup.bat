@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"
chcp 65001 >nul 2>&1
title CluDari - Build Windows Setup

echo ========================================
echo   CluDari Setup Builder
echo ========================================
echo.

where python >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Python not found. Install Python 3.10+ and retry.
  pause
  exit /b 1
)

echo [*] Installing build dependencies...
python -m pip install --upgrade pip pyinstaller pywebview fastapi uvicorn a2wsgi jdatetime python-multipart pygame -q

echo [*] Building CluDari.exe (PyInstaller)...
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist

python -m PyInstaller --noconfirm --clean --windowed --name CluDari ^
  --icon icon.ico ^
  --add-data "static;static" ^
  --add-data "cludari.db;." ^
  --add-data "auth.db;." ^
  --add-data "icon.ico;." ^
  --add-data "icon.png;." ^
  --add-data "VERSION;." ^
  --add-data "cludari_server.ini;." ^
  --hidden-import uvicorn.logging --hidden-import uvicorn.loops --hidden-import uvicorn.loops.auto ^
  --hidden-import uvicorn.protocols --hidden-import uvicorn.protocols.http --hidden-import uvicorn.protocols.http.auto ^
  --hidden-import uvicorn.protocols.websockets.auto --hidden-import uvicorn.lifespan --hidden-import uvicorn.lifespan.on ^
  --hidden-import jdatetime --hidden-import a2wsgi --hidden-import multipart ^
  main.py

if not exist "dist\CluDari\CluDari.exe" (
  if exist "dist\CluDari.exe" (
    echo [!] Single-file EXE found - onedir preferred. Continuing...
  ) else (
    echo [ERROR] PyInstaller failed. See output above.
    pause
    exit /b 1
  )
)
echo [OK] EXE built.

echo.
echo [*] Looking for Inno Setup compiler...
set "ISCC="
if exist "%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe" set "ISCC=%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe"
if not defined ISCC if exist "%ProgramFiles%\Inno Setup 6\ISCC.exe" set "ISCC=%ProgramFiles%\Inno Setup 6\ISCC.exe"
if not defined ISCC if exist "%LocalAppData%\Programs\Inno Setup 6\ISCC.exe" set "ISCC=%LocalAppData%\Programs\Inno Setup 6\ISCC.exe"

if not defined ISCC (
  echo.
  echo [!] Inno Setup 6 not installed.
  echo     EXE is ready in: dist\CluDari\
  echo     Download Inno Setup: https://jrsoftware.org/isinfo.php
  echo     Then run build_setup.bat again.
  echo.
  pause
  exit /b 0
)

echo [*] Compiling installer with Inno Setup...
if not exist installer_output mkdir installer_output
"%ISCC%" "%~dp0setup.iss"
if errorlevel 1 (
  echo [ERROR] Inno Setup compile failed.
  pause
  exit /b 1
)

if exist "installer_output\CluDari_Setup_2.1.0.exe" (
  echo.
  echo ========================================
  echo  SETUP READY:
  echo  installer_output\CluDari_Setup_2.1.0.exe
  echo ========================================
) else (
  echo [!] Check installer_output folder for the setup file.
)

echo.
pause
