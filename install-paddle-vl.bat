@echo off
setlocal enabledelayedexpansion
title PaddleOCR-VL 1.6 0.9B Installer (110 langs, 96.3%% OmniDocBench)
color 0A
echo ==================================================
echo   PaddleOCR-VL 1.6 — 0.9B  (My first choice for you)
echo   109 languages, skew/warp/illumination, handwriting + Arabic
echo   Structured Markdown/JSON, 96.3%% OmniDocBench v1.6
echo ==================================================
echo.
python --version || (echo [ERROR] python not found & pause & exit /b 1)
pip --version
echo.
echo [1/4] Installing PaddlePaddle 3.2.1 CPU (for GTX 1660 Ti / CPU)...
python -m pip install paddlepaddle==3.2.1 -i https://www.paddlepaddle.org.cn/packages/stable/cpu/
if errorlevel 1 echo [WARN] paddlepaddle cpu install failed — try GPU: paddlepaddle-gpu==3.2.1 -i https://www.paddlepaddle.org.cn/packages/stable/cu126/
echo.
echo [2/4] Installing PaddleOCR doc-parser ^>=3.6.0 ...
python -m pip install -U "paddleocr[doc-parser]>=3.6.0" paddlex
if errorlevel 1 python -m pip install -U "paddleocr[doc-parser]"
echo.
echo [3/4] Installing transformers ^>=5.0.0 + safetensors ...
python -m pip install -U "transformers>=5.0.0" safetensors Pillow
echo.
echo [4/4] Verifying...
python -c "import paddle; print('paddle', paddle.__version__)" 2>&1
python -c "import paddleocr; print('paddleocr', paddleocr.__version__)" 2>&1
python -c "from paddleocr import PaddleOCRVL; print('PaddleOCRVL OK', PaddleOCRVL)" 2>&1
if errorlevel 1 echo [WARN] PaddleOCRVL import failed — will fallback to tesseract until fixed
echo.
echo ==================================================
echo   DONE. Test:
echo     python -c "from paddleocr import PaddleOCRVL; vl=PaddleOCRVL(pipeline_version='v1.6'); print(vl.predict('F:/receipt-scanner/uploads/rcpt_f5af5755.png'))"
echo   In app: Settings -> OCR Engine -> PaddleOCR-VL 1.6 (set as default)
echo   First run downloads ~1.8GB to F:/hf-cache
echo ==================================================
pause
