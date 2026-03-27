@echo off
title Hospital Platform - One Click Setup
color 0E
cls

echo.
echo ╔════════════════════════════════════════╗
echo ║     🏥 HOSPITAL PLATFORM LAUNCHER      ║
echo ║                                        ║
echo ║   Easy • Network • Professional         ║
echo ╚════════════════════════════════════════╝
echo.

:menu
echo Choose launch option:
echo.
echo [1] 🏠 Local Only (Fastest)
echo [2] 🌐 Network + Setup (Recommended)
echo [3] 📱 Mobile Access Test
echo [4] 🔧 Network Diagnostics
echo [5] 📖 Setup Guide
echo [6] ❌ Exit
echo.
set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" goto local
if "%choice%"=="2" goto network
if "%choice%"=="3" goto mobile
if "%choice%"=="4" goto diagnostics
if "%choice%"=="5" goto guide
if "%choice%"=="6" goto exit
goto menu

:local
echo.
echo 🏠 Starting Local Platform...
call START_PLATFORM.bat
goto menu

:network
echo.
echo 🌐 Configuring Network Access...
call NETWORK_SETUP.bat
goto menu

:mobile
echo.
echo 📱 Mobile Access Test
echo ===================
echo.
echo Testing network connectivity...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set LOCAL_IP=%%a
    goto :found_ip
)
:found_ip
set LOCAL_IP=%LOCAL_IP: =%

echo Your network URL: https://%LOCAL_IP%
echo.
echo 1. Connect your phone to this WiFi network
echo 2. Open browser and go to: https://%LOCAL_IP%
echo 3. You should see the login page
echo.
echo Press any key to continue...
pause >nul
goto menu

:diagnostics
echo.
echo 🔧 Network Diagnostics
echo =====================
echo.
echo [1/4] Checking Node.js...
node --version
if %errorlevel% neq 0 (
    echo ❌ Node.js not found
) else (
    echo ✅ Node.js installed
)

echo.
echo [2/4] Checking network interfaces...
ipconfig | findstr /i "IPv4"
echo.

echo [3/4] Checking port 80 availability...
netstat -an | findstr ":80 "
if %errorlevel% equ 0 (
    echo ⚠️  Port 80 is in use
) else (
    echo ✅ Port 80 is available
)

echo.
echo [4/4] Checking firewall...
netsh advfirewall firewall show rule name="Hospital Platform" 2>nul
if %errorlevel% neq 0 (
    echo ❌ Firewall rule not found
    echo 🔧 Creating firewall rule...
    netsh advfirewall firewall add rule name="Hospital Platform" dir=in action=allow protocol=TCP localport=80 >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ Firewall rule created
    ) else (
        echo ⚠️  Run as Administrator to create firewall rule
    )
) else (
    echo ✅ Firewall rule exists
)

echo.
echo Press any key to continue...
pause >nul
goto menu

:guide
echo.
echo 📖 Opening Setup Guide...
start DOMAIN_SETUP.md
echo Guide opened in your default browser
echo.
echo Press any key to continue...
pause >nul
goto menu

:exit
echo.
echo 👋 Thank you for using Hospital Platform!
echo.
timeout /t 2 >nul
exit

:server_error
echo.
echo ❌ Server failed to start
echo.
echo Troubleshooting:
echo 1. Make sure port 80 is not in use
echo 2. Run as Administrator
echo 3. Check Windows Firewall
echo 4. Verify SSL certificate exists
echo.
echo Press any key to return to menu...
pause >nul
goto menu
