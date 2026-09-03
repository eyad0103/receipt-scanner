@echo off
setlocal enabledelayedexpansion
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4" ^| findstr "192.168."') do (
  for /f "tokens=1" %%b in ("%%a") do set LAN_IP=%%b
)
if not defined LAN_IP set LAN_IP=192.168.1.3
echo ==================================================
echo  Share Android App - Receipt Scanner
echo ==================================================
echo Your WiFi IP: %LAN_IP%  (was hardcoded .4 — FIXED, your IP is .3)
echo.
echo OPTION 1 - Install as App (RECOMMENDED, no cable):
echo   1. Phone + PC on SAME WiFi
echo   2. On phone Chrome open: http://%LAN_IP%:5173
echo   3. Chrome menu (3 dots) -^> "Install app" or "Add to Home screen"
echo   4. Now it works like a native app, even offline!
echo.
echo OPTION 2 - USB Cable:
echo   1. Plug phone via charger cable -^> Allow File Transfer
echo   2. On PC, open This PC ^> Phone ^> Download
echo   3. Drag any QR PNG from PC Downloads to phone
echo.
echo OPTION 3 - Show QR on PC screen:
echo   In app, go to Download tab -^> "Show fullscreen" -^> scan with phone camera
echo.
echo Starting LAN servers...
netsh advfirewall firewall show rule name="Receipt 3000" >nul 2>&1 || netsh advfirewall firewall add rule name="Receipt 3000" dir=in action=allow protocol=TCP localport=3000 >nul
netsh advfirewall firewall show rule name="Receipt 5173" >nul 2>&1 || netsh advfirewall firewall add rule name="Receipt 5173" dir=in action=allow protocol=TCP localport=5173 >nul
start "Backend :3000" cmd /k "node dist/server.js"
timeout /t 2 /nobreak >nul
start "Frontend :5173 LAN+PWA" cmd /k "cd frontend && npm run dev -- --host"
echo Done! Open http://%LAN_IP%:5173 on phone (NOT .4)
pause
