@echo off
title Quick Ngrok Test
color 0E

echo.
echo 🚀 QUICK NGROK TEST
echo ==================
echo.

REM Check if ngrok exists
if not exist "ngrok.exe" (
    echo ❌ Ngrok not found! Downloading...
    powershell -Command "Invoke-WebRequest -Uri 'https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip' -OutFile 'ngrok.zip'"
    powershell -Command "Expand-Archive -Path 'ngrok.zip' -DestinationPath '.' -Force"
    del ngrok.zip
    echo ✅ Ngrok downloaded and extracted
)

REM Check if server is running
echo 🔍 Checking if server is running...
curl -k -s -o nul -w "%%{http_code}" https://localhost:80 >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Server not running! Starting server...
    start /B node server.js
    echo ⏳ Waiting for server to start...
    timeout /t 10 >nul
)

REM Start ngrok
echo 🌐 Starting Ngrok tunnel...
taskkill /F /IM ngrok.exe >nul 2>&1
start /B ngrok.exe http 443 --log=stdout

echo ⏳ Waiting for tunnel...
timeout /t 8 >nul

REM Get URL
echo 🔍 Getting Ngrok URL...
powershell -Command "(Invoke-RestMethod -Uri 'http://127.0.0.1:4040/api/tunnels').tunnels[0].public_url" > ngrok_url.txt 2>nul

if exist ngrok_url.txt (
    set /p NGROK_URL=<ngrok_url.txt
    del ngrok_url.txt
    
    echo.
    echo ✅ SUCCESS! Your platform is accessible from anywhere!
    echo.
    echo 🌍 EXTERNAL URL: %NGROK_URL%
    echo.
    echo 📱 Use this URL on any device:
    echo    • Phone: %NGROK_URL%
    echo    • Computer: %NGROK_URL%
    echo    • Tablet: %NGROK_URL%
    echo.
    echo 🔧 Ngrok Dashboard: http://127.0.0.1:4040
    echo.
    echo 📧 Share this URL with users: %NGROK_URL%
    
    REM Open the URL in browser
    start %NGROK_URL%
    
) else (
    echo.
    echo ⚠️  Could not get URL automatically
    echo Please check: http://127.0.0.1:4040
    echo.
    echo Or run: NGROK_ACCESS.bat for detailed setup
)

echo.
echo Press any key to stop...
pause >nul

taskkill /F /IM ngrok.exe >nul 2>&1
echo 🛑 Ngrok stopped
