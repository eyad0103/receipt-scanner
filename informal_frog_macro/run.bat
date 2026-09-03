@echo off
setlocal

set "PROJECT_ROOT=%~dp0informal_frog_macro"
set "PROJECT_ROOT=%PROJECT_ROOT:~0,-1%"

echo Starting Informal Frog Macro (Development Mode)
echo.

cd /d "%PROJECT_ROOT%"
flutter run -d windows

pause
