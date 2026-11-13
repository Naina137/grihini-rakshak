@echo off
title SENTINEL AI - Backend Server
echo ===================================================
echo   SENTINEL AI: Starting FastAPI Backend Server
echo   "Your Room. Your Safety. Your AI Guardian."
echo ===================================================
cd /d "%~dp0backend"
python run_backend.py
pause
