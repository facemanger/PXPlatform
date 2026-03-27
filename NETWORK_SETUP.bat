@echo off
title Network Access Setup
color 0B
echo.
echo ========================================
echo      Network Access Configuration
echo ========================================
echo.

echo [1/4] Detecting network configuration...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set LOCAL_IP=%%a
    goto :found
)
:found
set LOCAL_IP=%LOCAL_IP: =%

echo ✅ Local IP detected: %LOCAL_IP%

echo.
echo [2/4] Checking firewall configuration...
netsh advfirewall firewall show rule name="Hospital Platform" >nul 2>&1
if %errorlevel% neq 0 (
    echo 🔧 Adding firewall rule for port 80...
    netsh advfirewall firewall add rule name="Hospital Platform" dir=in action=allow protocol=TCP localport=80 >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ Firewall rule added successfully
    ) else (
        echo ⚠️  Could not add firewall rule (run as Administrator)
    )
) else (
    echo ✅ Firewall rule already exists
)

echo.
echo [3/4] Testing network accessibility...
echo 🌐 Testing local access...
curl -k -s -o nul -w "%%{http_code}" https://localhost:80 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Local access working
) else (
    echo ❌ Local access failed
)

echo.
echo 🌐 Testing network access...
curl -k -s -o nul -w "%%{http_code}" https://%LOCAL_IP%:80 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Network access working
) else (
    echo ❌ Network access failed
)

echo.
echo [4/4] Generating access URLs...
echo.
echo ========================================
echo           PLATFORM ACCESS URLS
echo ========================================
echo.
echo 🏠 Local Access:
echo    https://localhost
echo.
echo 🌐 Network Access:
echo    https://%LOCAL_IP%
echo.
echo 📱 Mobile Access:
echo    Use the network URL on your phone
echo    (make sure you're on the same WiFi network)
echo.
echo 🌍 External Access Options:
echo.
echo    Option 1 - Port Forwarding (Recommended):
echo    • Configure your router to forward port 80
echo    • Then access via: https://YOUR_PUBLIC_IP
echo.
echo    Option 2 - Domain Name:
echo    • Buy a domain and point it to your IP
echo    • Then access via: https://yourdomain.com
echo.
echo    Option 3 - Dynamic DNS:
echo    • Use services like No-IP or Dynu
echo    • Get a fixed domain for your changing IP
echo.
echo ========================================
echo.

echo Press any key to start the platform...
pause >nul
call START_PLATFORM.bat
