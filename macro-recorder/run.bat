@echo off
cd /d "%~dp0"
pip install pynput >nul 2>&1
python recorder.py
pause
