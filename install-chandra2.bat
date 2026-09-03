@echo off
setlocal enabledelayedexpansion
title Chandra OCR 2 v0.2.0 Installer ^(4B ^| 85.9%% olmOCR^)
color 0B
echo ==================================================
echo   Chandra OCR 2 v0.2.0 ^(datalab-to/chandra-ocr-2^)
echo   4B params ^| 85.9%% olmOCR ^| 77.8%% multilingual
echo   Install: chandra-ocr + HF ^+ vLLM server
echo ==================================================
echo.
python --version >nul 2>&1
if errorlevel 1 (
  echo [ERROR] python not found. Install Python 3.10+ from python.org
  pause
  exit /b 1
)
echo [1/6] Python: 
python --version
pip --version
echo.
echo [2/6] Upgrading pip...
python -m pip install --upgrade pip
echo.
echo [3/6] Installing Chandra OCR 2...
python -m pip install --upgrade chandra-ocr
if errorlevel 1 (
  echo [WARN] chandra-ocr install failed, retrying...
  python -m pip install --upgrade chandra-ocr --no-cache-dir
)
echo.
echo [4/6] Installing HF deps ^(transformers accelerate torch^)...
python -m pip install --upgrade "transformers>=4.40" accelerate safetensors Pillow huggingface_hub
if errorlevel 1 echo [WARN] HF deps install had errors, continuing...
echo.
echo [5/6] Installing vLLM ^(recommended server, needs CUDA 12+ and 8GB+ VRAM^)...
echo        Your GPU: 
nvidia-smi --query-gpu=name,memory.total --format=csv 2>nul || echo        ^(nvidia-smi not found - CPU mode only^)
echo        Note: GTX 1660 Ti 6GB will run HF with CPU offload, NOT vLLM ^(needs 8GB+^). Will try anyway.
python -m pip install --upgrade vllm 2>&1 | findstr /i "error failed" >nul
if errorlevel 1 (
  echo [INFO] vLLM not installed ^(expected on 1660 Ti / CPU torch^). HF mode will be used.
  echo        To force vLLM later: pip install vllm --extra-index-url https://download.pytorch.org/whl/cu121
) else (
  echo [OK] vLLM installed.
)
echo.
echo [6/6] Verifying + warming model ^(~3GB download on first run^)...
python -c "import chandra; print('chandra', chandra.__file__)" 2>&1
if errorlevel 1 echo [WARN] chandra import failed
for %%X in (chandra.exe chandra_vllm.exe) do (
  if exist "%LOCALAPPDATA%\Python\pythoncore-3.14-64\Scripts\%%X" echo [OK] %%X found
)
echo.
echo   Testing HF import ^(no download yet^)...
python -c "from chandra.model.hf import generate_hf; from chandra.model.schema import BatchInputItem; print('HF api OK')" 2>&1
echo.
echo ==================================================
echo   DONE. How to use:
echo ==================================================
echo   HF local ^(fits 6GB with offload, ~2s/page after download^):
echo     chandra input.jpg output.md --method hf
echo     python -c "from transformers import AutoModelForImageTextToText, AutoProcessor; ..."
echo.
echo   vLLM server ^(needs 8GB+ VRAM, 2 pages/sec on H100^):
echo     chandra_vllm --gpu h100
echo     chandra input.pdf output --method vllm
echo.
echo   In this receipt-scanner app:
echo     Set OCR_PROVIDER=chandra in .env, then npm run dev
echo     Provider uses: datalab-to/chandra-ocr-2 bfloat16 device_map=auto
echo     First scan downloads ~3GB to HF cache ^(F: has 872GB free^)
echo.
echo   Verify: python -m chandra --help
echo ==================================================
pause
