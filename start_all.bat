@echo off
title SENTINEL AI - Launcher
echo ========================================================
echo   Launching SENTINEL AI Full-Stack Guardian
echo   "Your Room. Your Safety. Your AI Guardian."
echo ========================================================
start "SENTINEL Backend" cmd /c "%~dp0start_backend.bat"
timeout /t 3 /nobreak >nul
start "SENTINEL Frontend" cmd /c "%~dp0start_frontend.bat"
echo System starting...
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://localhost:5173
echo ========================================================
