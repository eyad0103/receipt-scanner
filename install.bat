@echo off
title Receipt Scanner - Install (one click)
color 0A
echo ==================================================
echo   Receipt Scanner - One-click Install
echo   Installs: backend + frontend + OCR (tesseract)
echo   Demo included: F:\receipt-scanner-demo\run-demo.bat
echo ==================================================
echo.
where node >nul 2>&1 || (echo [ERROR] Node.js missing - install from nodejs.org & pause & exit /b 1)
where python >nul 2>&1 || echo [WARN] Python missing - only needed for Paddle/Chandra, tesseract works without it
node --version
echo.
echo [1/4] Backend deps...
call npm install
if errorlevel 1 (echo [ERROR] npm install failed & pause & exit /b 1)
echo.
echo [2/4] Frontend deps...
cd frontend
call npm install
if errorlevel 1 (echo [ERROR] frontend install failed & pause & exit /b 1)
cd ..
echo.
echo [3/4] Building backend + frontend...
call npx tsc
if errorlevel 1 (echo [ERROR] backend build failed & pause & exit /b 1)
cd frontend
call npm run build
if errorlevel 1 (echo [ERROR] frontend build failed & pause & exit /b 1)
cd ..
echo.
echo [4/4] Testing OCR (tesseract) on latest upload...
for /f "delims=" %%f in ('dir /b /o-d uploads\*.png 2^>nul') do set PIC=uploads\%%f & goto test
echo [WARN] no png in uploads\ - skipping OCR test
goto done
:test
node --input-type=module -e "import fs from 'fs';import{ OcrService }from'./dist/ocr/ocrService.js';const b=fs.readFileSync('%PIC%');const r=await OcrService.create('tesseract').processImage(b);console.log('OCR OK:',r.provider,'|',r.rawText.slice(0,120).replace(/\n/g,' '))" 2>&1 | findstr /v "injected tip"
if errorlevel 1 echo [WARN] OCR test had issues - tesseract.js downloads lang data on first run
:done
echo.
echo ==================================================
echo   INSTALLED. Now run:
echo     run.bat       = backend :3000 + frontend :5173
echo     run-lan.bat   = same + phone on WiFi (.3)
echo     demo: F:\receipt-scanner-demo\run-demo.bat
echo ==================================================
pause
