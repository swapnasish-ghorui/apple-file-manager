@echo off
title Apple File Manager
cd /d "%~dp0"

echo ========================================================
echo               Apple File Manager for Windows
echo ========================================================
echo.

:: 1. Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please download and install Node.js from https://nodejs.org/
    echo Once installed, double-click this file again.
    echo.
    pause
    exit /b
)

:: 2. Check if node_modules exists, install if missing
if not exist "node_modules\" (
    echo [INFO] First time setup: Installing dependencies...
    echo This may take a minute. Please wait...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Failed to install dependencies. Please check your internet connection.
        pause
        exit /b
    )
    echo.
    echo [SUCCESS] Dependencies installed successfully!
    echo.
)

:: 3. Open browser automatically after a short 2-second delay
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:5173"

:: 4. Start the app
echo Starting Apple File Manager...
echo Web UI will open at: http://localhost:5173
echo Press Ctrl+C in this window anytime to stop.
echo.
call npm run dev
pause
