@echo off
title External Network Access Setup
color 0C
cls

echo.
echo ╔════════════════════════════════════════╗
echo ║   🌍 EXTERNAL NETWORK ACCESS SETUP     ║
echo ║                                        ║
echo ║   Make your platform accessible from   ║
echo ║   anywhere in the world!               ║
echo ╚════════════════════════════════════════╝
echo.

echo [1/6] Getting your network information...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set LOCAL_IP=%%a
    goto :found_ip
)
:found_ip
set LOCAL_IP=%LOCAL_IP: =%

echo ✅ Local IP: %LOCAL_IP%

echo.
echo [2/6] Getting your public IP address...
curl -s https://api.ipify.org > public_ip.txt
set /p PUBLIC_IP=<public_ip.txt
del public_ip.txt
echo ✅ Public IP: %PUBLIC_IP%

echo.
echo [3/6] Configuring Windows Firewall...
netsh advfirewall firewall delete rule name="Hospital Platform" >nul 2>&1
netsh advfirewall firewall add rule name="Hospital Platform" dir=in action=allow protocol=TCP localport=88 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Firewall configured
) else (
    echo ⚠️  Run as Administrator to configure firewall
)

echo.
echo [4/6] Testing local server...
curl -k -s -o nul -w "%%{http_code}" https://localhost:88 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Local server is running
) else (
    echo ❌ Local server is not running
    echo    Please start the server first
    pause
    exit /b 1
)

echo.
echo [5/6] Router Configuration Instructions...
echo.
echo ╔════════════════════════════════════════╗
echo ║     ROUTER PORT FORWARDING SETUP       ║
echo ╚════════════════════════════════════════╝
echo.
echo You need to configure your router to forward port 88
echo to your computer (%LOCAL_IP%).
echo.
echo Common router addresses:
echo • 192.168.1.1    (TP-Link, Netgear)
echo • 192.168.0.1    (D-Link, ASUS)
echo • 10.0.0.1       (Apple Airport)
echo.
echo Steps:
echo 1. Open browser and go to your router address
echo 2. Login with router username/password
echo 3. Find "Port Forwarding" or "Virtual Server"
echo 4. Add rule: Port 88 → %LOCAL_IP%
echo 5. Save and restart router
echo.

echo [6/6] Testing External Access...
echo.
echo After configuring port forwarding, your platform will be
echo accessible at: https://%PUBLIC_IP%
echo.
echo Let's test if port forwarding is working...
curl -k -s -o nul -w "%%{http_code}" --connect-timeout 5 https://%PUBLIC_IP%:88 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ EXTERNAL ACCESS IS WORKING!
    echo    Your platform is accessible at: https://%PUBLIC_IP%
) else (
    echo ❌ External access not yet configured
    echo    Please complete router port forwarding first
    echo    Then test again
)

echo.
echo ╔════════════════════════════════════════╗
echo ║           ACCESS URLS                   ║
echo ╚════════════════════════════════════════╝
echo.
echo 🏠 Local:    https://localhost
echo 🌐 Network:  https://%LOCAL_IP%
echo 🌍 External: https://%PUBLIC_IP%
echo.
echo 📱 Mobile:   Use https://%PUBLIC_IP% on your phone
echo 🖥️  Anywhere: Use https://%PUBLIC_IP% from any device
echo.

echo Press any key to continue...
pause >nul

echo.
echo Would you like to:
echo [1] Test external access again
echo [2] Get router-specific instructions
echo [3] Setup dynamic DNS (free)
echo [4] Exit
echo.
set /p choice="Choose option (1-4): "

if "%choice%"=="1" goto test_again
if "%choice%"=="2" goto router_help
if "%choice%"=="3" goto dynamic_dns
if "%choice%"=="4" goto exit

:test_again
echo.
echo Testing external access...
curl -k -s -o nul -w "%%{http_code}" --connect-timeout 5 https://%PUBLIC_IP%:88 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ SUCCESS! External access is working!
    echo    URL: https://%PUBLIC_IP%
) else (
    echo ❌ Still not working. Check router configuration.
)
pause
goto exit

:router_help
echo.
echo ╔════════════════════════════════════════╗
echo ║        ROUTER-SPECIFIC HELP            ║
echo ╚════════════════════════════════════════╝
echo.
echo Opening router setup guides...
start https://www.google.com/search?q="port+forwarding+router+model"
echo.
echo Common router login credentials:
echo • TP-Link: admin/admin or admin/password
echo • Netgear: admin/password
echo • D-Link: admin/(blank)
echo • ASUS: admin/admin
echo.
pause
goto exit

:dynamic_dns
echo.
echo ╔════════════════════════════════════════╗
echo ║          DYNAMIC DNS SETUP             ║
echo ╚════════════════════════════════════════╝
echo.
echo Dynamic DNS gives you a fixed domain name
echo even if your IP changes.
echo.
echo Free options:
echo • No-IP: https://www.noip.com
echo • Dynu: https://www.dynu.com
echo • DuckDNS: https://www.duckdns.org
echo.
echo Steps:
echo 1. Sign up for free account
echo 2. Create hostname (e.g., hospital.hopto.org)
echo 3. Point it to your IP: %PUBLIC_IP%
echo 4. Install their update client
echo 5. Access via: https://yourhostname
echo.
echo Opening No-IP signup page...
start https://www.noip.com
pause
goto exit

:exit
echo.
echo 👋 Setup complete! Your platform URL:
echo 🔗 https://%PUBLIC_IP%
echo.
timeout /t 3 >nul
