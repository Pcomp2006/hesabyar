@echo off
chcp 65001 >nul 2>&1
title CluDari - Firewall port 8000
echo Adding Windows Firewall rule for CluDari port 8000...
netsh advfirewall firewall delete rule name="CluDari 8000" >nul 2>&1
netsh advfirewall firewall add rule name="CluDari 8000" dir=in action=allow protocol=TCP localport=8000
if errorlevel 1 (
  echo [!] Failed - right-click this file - Run as administrator
  pause
  exit /b 1
)
echo [OK] Port 8000 allowed inbound.
echo On phone same Wi-Fi open: http://YOUR-PC-IP:8000
pause
