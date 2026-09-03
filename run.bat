@echo off
title Receipt Scanner - Launcher
color 0A
echo ==================================================
echo   Receipt Scanner - Running Both Ends
echo ==================================================
echo.
echo [1/2] Building backend...
call npx tsc
if errorlevel 1 (
  echo Backend build failed!
  pause
  exit /b 1
)
echo Backend built.
echo.
echo [2/2] Starting servers...
echo   Backend  -> http://localhost:3000  (health: /health, api: /api/receipts)
echo   Frontend -> http://localhost:5173
echo.
start "Receipt Backend :3000" cmd /k "echo Backend running on http://localhost:3000 && node dist/server.js"
timeout /t 2 /nobreak >nul
start "Receipt Frontend :5173" cmd /k "cd frontend && echo Frontend running on http://localhost:5173 && npm run dev"
echo.
echo ==================================================
echo   Both started in separate windows!
echo   Close those windows to stop.
echo   Double-click run.bat anytime to start again.
echo ==================================================
pause
