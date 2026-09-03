@echo off
setlocal EnableDelayedExpansion

set "PROJECT_ROOT=%~dp0informal_frog_macro"
set "PROJECT_ROOT=%PROJECT_ROOT:~0,-1%"

echo ====================================================
echo Informal Frog Macro - Launcher
echo ====================================================
echo.

:: Check if project directory exists
if not exist "%PROJECT_ROOT%\pubspec.yaml" (
    echo ERROR: Project directory not found at %PROJECT_ROOT%
    echo.
    pause
    exit /b 1
)

:: Verify and create required directories
echo Verifying project folders...
set "REQUIRED_DIRS=config logs cache profiles captures assets\images assets\icons assets\templates assets\fonts lib\app lib\core lib\ui lib\services lib\models lib\widgets scripts"
for %%D in (%REQUIRED_DIRS%) do (
    if not exist "%PROJECT_ROOT%\%%D" (
        echo   Creating: %%D
        mkdir "%PROJECT_ROOT%\%%D" >nul 2>&1
    )
)
echo   All folders verified.
echo.

:: Verify configuration exists
echo Checking configuration...
if not exist "%PROJECT_ROOT%\config\config.json" (
    echo   config.json does not exist - it will be generated on first launch.
) else (
    echo   config.json found.
)
echo.

:: Verify write permissions on project directory
echo Verifying write permissions...
( > "%PROJECT_ROOT%\.write_test" echo. ) 2>nul && (
    del "%PROJECT_ROOT%\.write_test" >nul 2>&1
    echo   Write permissions OK.
) || (
    echo ERROR: Cannot write to %PROJECT_ROOT%
    echo.
    pause
    exit /b 1
)
echo.

:: Create today's log via the application itself
echo Starting Informal Frog Macro...
echo.

cd /d "%PROJECT_ROOT%"

:: Launch the Flutter application
call flutter run -d windows --release

:: Capture exit code
set "EXIT_CODE=%ERRORLEVEL%"

echo.
echo ====================================================
echo Application exited with code: %EXIT_CODE%
if %EXIT_CODE% NEQ 0 (
    echo.
    echo ERROR: Application exited unexpectedly.
    echo Exit Code: %EXIT_CODE%
    echo Error Message: Review logs/logs directory for the last log file.
    echo.
    echo Press any key to close this window.
    pause >nul
)
echo ====================================================
echo.
echo Press any key to close this window.
pause >nul
exit /b %EXIT_CODE%