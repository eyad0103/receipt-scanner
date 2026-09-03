@echo off
setlocal enabledelayedexpansion
echo ==================================================
echo  Receipt Scanner - LAN Mode (phone on same WiFi)
echo ==================================================
echo.
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4" ^| findstr "192.168."') do (
  for /f "tokens=1" %%b in ("%%a") do set LAN_IP=%%b
)
if not defined LAN_IP set LAN_IP=192.168.1.3
echo Your LAN IP: %LAN_IP%
ipconfig | findstr "IPv4"
echo.
echo Backend: http://%LAN_IP%:3000  (also localhost:3000)
echo Frontend: http://%LAN_IP%:5173
echo.
echo 1. Connect phone + PC to SAME WiFi
echo 2. On phone Chrome, open: http://%LAN_IP%:5173
echo 3. If blocked, allow firewall when prompted
echo.
echo Adding firewall rules if needed...
netsh advfirewall firewall show rule name="Receipt 3000" >nul 2>&1 || netsh advfirewall firewall add rule name="Receipt 3000" dir=in action=allow protocol=TCP localport=3000 >nul
netsh advfirewall firewall show rule name="Receipt 5173" >nul 2>&1 || netsh advfirewall firewall add rule name="Receipt 5173" dir=in action=allow protocol=TCP localport=5173 >nul
echo.
echo Starting...
start "Backend :3000" cmd /k "node dist/server.js"
timeout /t 2 /nobreak >nul
start "Frontend :5173 LAN" cmd /k "cd frontend && npm run dev -- --host"
echo.
echo If phone still can't connect:
echo  - Try http://%LAN_IP%:5173 on PC first
echo  - Check phone + PC same WiFi (your IP is %LAN_IP%, old .4 is wrong)
echo  - Or run share-android.bat
pause
