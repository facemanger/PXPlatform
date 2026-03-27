@echo off
title Hospital Platform - Ngrok External Access
color 0A
cls

echo.
echo ╔════════════════════════════════════════╗
echo ║   🌍 HOSPITAL PLATFORM NGROK SETUP     ║
echo ║                                        ║
echo ║   Instant external access with Ngrok   ║
echo ╚════════════════════════════════════════╝
echo.

echo [1/4] Checking if server is running...
curl -k -s -o nul -w "%%{http_code}" https://localhost:80 >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Server is not running!
    echo Please start the server first:
    echo    1. Double-click: START_PLATFORM.bat
    echo    2. Or run: node server.js
    echo.
    pause
    exit /b 1
)
echo ✅ Server is running on https://localhost:80

echo.
echo [2/4] Starting Ngrok tunnel...
echo This will create a secure tunnel to your server
echo.

REM Kill any existing ngrok processes
taskkill /F /IM ngrok.exe >nul 2>&1

REM Start ngrok tunnel
echo 🌐 Creating secure tunnel...
start /B ngrok.exe http 443 --log=stdout --log-format=json > ngrok_output.log 2>&1

REM Wait for ngrok to start
echo ⏳ Waiting for tunnel to be ready...
timeout /t 5 >nul

echo.
echo [3/4] Getting Ngrok URL...
REM Wait a bit more for ngrok to fully start
timeout /t 3 >nul

REM Try to get the ngrok URL
curl -s http://127.0.0.1:4040/api/tunnels > ngrok_info.json 2>nul
if %errorlevel% equ 0 (
    REM Parse the JSON to extract the public URL
    for /f "tokens=2 delims=:," %%a in ('findstr "public_url" ngrok_info.json') do (
        set NGROK_URL=%%a
        set NGROK_URL=!NGROK_URL: =!
        set NGROK_URL=!NGROK_URL:"=!
        goto :url_found
    )
    :url_found
    echo ✅ Ngrok tunnel created successfully!
) else (
    echo ⚠️  Could not retrieve Ngrok URL automatically
    echo Please check the Ngrok window for the URL
    set NGROK_URL=CHECK_NGROK_WINDOW
)

echo.
echo [4/4] Access Information...
echo ╔════════════════════════════════════════╗
echo ║           🌐 ACCESS URLS               ║
echo ╚════════════════════════════════════════╝
echo.
echo 🏠 Local Access:
echo    https://localhost
echo.
echo 🌍 Ngrok External Access:
echo    %NGROK_URL%
echo.
echo 📱 Mobile Access:
echo    Use the Ngrok URL on your phone
echo.
echo 🖥️  Any Computer:
echo    Share the Ngrok URL with anyone
echo.

if not "%NGROK_URL%"=="CHECK_NGROK_WINDOW" (
    echo ✅ SUCCESS! Your platform is accessible from anywhere!
    echo    🌍 URL: %NGROK_URL%
    echo.
    echo 📧 Share this URL with users:
    echo    %NGROK_URL%
    echo.
    echo 📱 Test on mobile:
    echo    Open %NGROK_URL% on your phone
) else (
    echo 🔍 Check the Ngrok window for your URL
    echo It should look like: https://random-string.ngrok.io
)

echo.
echo ╔════════════════════════════════════════╗
echo ║           📋 IMPORTANT                ║
echo ╚════════════════════════════════════════╝
echo.
echo • Ngrok window must remain open
echo • URL changes each time you restart
echo • Free Ngrok URLs expire after 8 hours
echo • For permanent URL, upgrade Ngrok plan
echo.
echo 🔧 Ngrok Control Panel:
echo    http://127.0.0.1:4040
echo.

echo Press any key to open Ngrok dashboard...
pause >nul
start http://127.0.0.1:4040

echo.
echo Press any key to stop Ngrok...
pause >nul

echo.
echo 🛑 Stopping Ngrok...
taskkill /F /IM ngrok.exe >nul 2>&1
del ngrok_output.log 2>nul
del ngrok_info.json 2>nul

echo ✅ Ngrok stopped
echo.
timeout /t 2 >nul
