@echo off
title Hospital Platform Launcher
color 0A
echo.
echo ========================================
echo    Hospital Patient Experience Platform
echo ========================================
echo.

echo [1/3] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)
echo ✅ Node.js is installed

echo.
echo [2/3] Installing dependencies...
if not exist node_modules (
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed
) else (
    echo ✅ Dependencies already installed
)

echo.
echo [3/3] Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build frontend
    pause
    exit /b 1
)
echo ✅ Frontend built successfully

echo.
echo ========================================
echo           Starting Platform...
echo ========================================
echo.
echo 🌐 Platform will be available at:
echo    • Local: https://localhost
echo    • Network: https://YOUR_IP_ADDRESS
echo.
echo 📋 Default Login:
echo    • Username: admin
echo    • Password: admin123
echo.
echo 🔄 Server is starting...
echo    Press Ctrl+C to stop the server
echo.

node server.js

pause
