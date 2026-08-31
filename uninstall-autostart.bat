@echo off
chcp 65001 >nul 2>&1
set "BAT=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\CluDariServer.bat"
set "LNK=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\CluDariServer.lnk"
if exist "%BAT%" (del "%BAT%" & echo Removed: %BAT%) else echo No Startup bat found.
if exist "%LNK%" (del "%LNK%" & echo Removed: %LNK%)
echo.
echo To stop server now: Task Manager - end pythonw.exe / python.exe
pause
