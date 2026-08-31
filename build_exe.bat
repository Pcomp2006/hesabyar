@echo off
setlocal
cd /d "%~dp0"
echo Building CluDari.exe with PyInstaller...
python -m pip install --upgrade pyinstaller pywebview fastapi uvicorn a2wsgi jdatetime python-multipart pygame -q
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
  --hidden-import jdatetime --hidden-import a2wsgi ^
  main.py
echo.
if exist dist\CluDari\CluDari.exe (
  echo OK: dist\CluDari\CluDari.exe
) else if exist dist\CluDari.exe (
  echo OK: dist\CluDari.exe
) else (
  echo Build finished - check dist folder
)
echo Tip: run build_setup.bat for a Windows Setup installer.
pause
