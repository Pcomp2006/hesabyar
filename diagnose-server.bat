@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"
echo === Port 8000 ===
netstat -ano | findstr :8000
echo === Python processes ===
tasklist | findstr /I "python"
echo === Test import server ===
python -c "import time; t=time.time(); import server; print('import ok in', round(time.time()-t,1), 's')"
echo === Done ===
pause
