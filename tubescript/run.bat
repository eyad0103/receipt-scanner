@echo off
setlocal enabledelayedexpansion

cd /d "C:\Users\Eyad\.opencode\bin\tubescript"

echo Killing any existing node processes...
taskkill /f /im node.exe /t 2>nul >nul
timeout /t 1 /nobreak >nul

echo Starting TubeScript proxy server...
start "Proxy Server" /min cmd /c "cd /d C:\Users\Eyad\.opencode\bin\tubescript\server && node proxy.js"

echo Waiting for proxy to start...
timeout /t 3 /nobreak >nul

echo Starting TubeScript dev server...
start "Dev Server" /min cmd /c "cd /d C:\Users\Eyad\.opencode\bin\tubescript && npm run dev"

echo.
echo Waiting for dev server...
timeout /t 5 /nobreak >nul

echo.
echo TubeScript is starting up!
echo Proxy: http://localhost:4000
echo App:   http://localhost:5173
echo.
echo Opening browser...
start http://localhost:5173