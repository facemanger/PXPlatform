@echo off
title Hospital Platform - External Access
color 0B
cls

echo.
echo ╔════════════════════════════════════════╗
echo ║   🌍 HOSPITAL PLATFORM EXTERNAL        ║
echo ║          ACCESS SETUP                  ║
echo ╚════════════════════════════════════════╝
echo.

echo This setup will make your platform accessible from
echo anywhere in the world using your IP address.
echo.

:main_menu
echo Choose setup option:
echo.
echo [1] 🔧 Quick External Access Setup
echo [2] 🛡️ Security Configuration
echo [3] 🌐 Test External Access
echo [4] 📱 Mobile Access Guide
echo [5] 🔍 Router-Specific Instructions
echo [6] 🌐 Dynamic DNS Setup (Free Domain)
echo [7] ❌ Exit
echo.
set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto quick_setup
if "%choice%"=="2" goto security_setup
if "%choice%"=="3" goto test_access
if "%choice%"=="4" goto mobile_guide
if "%choice%"=="5" goto router_help
if "%choice%"=="6" goto dynamic_dns
if "%choice%"=="7" goto exit
goto main_menu

:quick_setup
echo.
echo 🔧 QUICK EXTERNAL ACCESS SETUP
echo ==============================
echo.
call EXTERNAL_ACCESS.bat
goto main_menu

:security_setup
echo.
echo 🛡️ SECURITY CONFIGURATION
echo ========================
echo.
call SECURITY_SETUP.bat
goto main_menu

:test_access
echo.
echo 🌐 TESTING EXTERNAL ACCESS
echo ========================
echo.
echo Getting your public IP...
curl -s https://api.ipify.org > public_ip.txt
set /p PUBLIC_IP=<public_ip.txt
del public_ip.txt

echo Your public IP: %PUBLIC_IP%
echo Testing external access...
echo.

curl -k -s -o nul -w "HTTP Status: %%{http_code}\n" --connect-timeout 10 https://%PUBLIC_IP%:80
if %errorlevel% equ 0 (
    echo.
    echo ✅ SUCCESS! External access is working!
    echo    Your platform is accessible at: https://%PUBLIC_IP%
    echo.
    echo 📱 You can now access from:
    echo    • Any computer: https://%PUBLIC_IP%
    echo    • Your phone: https://%PUBLIC_IP%
    echo    • Tablet: https://%PUBLIC_IP%
) else (
    echo.
    echo ❌ External access is not working yet
    echo.
    echo 🔧 To fix this:
    echo    1. Configure port forwarding on your router
    echo    2. Forward port 80 to your computer
    echo    3. Test again
    echo.
    echo 💡 Run option [1] Quick Setup for detailed instructions
)

echo.
pause
goto main_menu

:mobile_guide
echo.
echo 📱 MOBILE ACCESS GUIDE
echo =====================
echo.
echo To access your platform from mobile devices:
echo.
echo 📋 Steps:
echo 1. Ensure external access is working (test with option 3)
echo 2. On your phone, open browser
echo 3. Go to: https://YOUR_PUBLIC_IP
echo 4. Accept SSL certificate warning
echo 5. Login with admin credentials
echo 6. Bookmark for easy access
echo.
echo 🌐 From anywhere:
echo • Works on WiFi and mobile data
echo • No VPN required
echo • Full functionality available
echo.
echo 📧 Share the URL with others:
echo • Send: https://YOUR_PUBLIC_IP
echo • They can access from any device
echo • Perfect for remote management
echo.
pause
goto main_menu

:router_help
echo.
echo 🔍 ROUTER-SPECIFIC INSTRUCTIONS
echo ===============================
echo.
echo Detecting your router configuration...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "Gateway"') do (
    set GATEWAY=%%a
    goto :found_gateway
)
:found_gateway
set GATEWAY=%GATEWAY: =%

echo Your router gateway: %GATEWAY%
echo.

if "%GATEWAY%"=="192.168.1.1" (
    echo 🔧 TP-LINK / NETGEAR SETUP:
    echo ========================
    echo 1. Go to: http://192.168.1.1
    echo 2. Login: admin/admin or admin/password
    echo 3. Click: Forwarding → Virtual Servers
    echo 4. Add:
    echo    • Service Name: Hospital Platform
    echo    • External Port: 80
    echo    • Internal Port: 80
    echo    • Internal IP: Your computer IP
    echo    • Protocol: TCP
    echo    • Status: Enabled
    echo 5. Click Save
) else if "%GATEWAY%"=="192.168.0.1" (
    echo 🔧 D-LINK / ASUS SETUP:
    echo =====================
    echo 1. Go to: http://192.168.0.1
    echo 2. Login: admin/admin or admin/(blank)
    echo 3. Click: Advanced → Port Forwarding
    echo 4. Add rule:
    echo    • Name: Hospital Platform
    echo    • Public Port: 80
    echo    • Private Port: 80
    echo    • Private IP: Your computer IP
    echo    • Protocol: TCP
    echo 5. Click Apply
) else (
    echo 🔧 GENERIC ROUTER SETUP:
    echo ========================
    echo 1. Go to: http://%GATEWAY%
    echo 2. Login with router credentials
    echo 3. Find Port Forwarding section
    echo 4. Add rule to forward port 80
    echo 5. Point to your computer's IP
    echo 6. Save and restart router
)

echo.
echo 💡 Need more help?
echo • Search YouTube: "port forwarding %GATEWAY%"
echo • Visit: portforward.com
echo • Contact your ISP
echo.

echo Opening router setup guide...
start https://www.google.com/search?q="port+forwarding+%GATEWAY%"

pause
goto main_menu

:dynamic_dns
echo.
echo 🌐 DYNAMIC DNS SETUP (FREE DOMAIN)
echo ================================
echo.
echo Dynamic DNS gives you a fixed domain name
echo even if your IP address changes.
echo.
echo 🆓 Free Dynamic DNS Providers:
echo • No-IP: https://www.noip.com
echo • Dynu: https://www.dynu.com
echo • DuckDNS: https://www.duckdns.org
echo.
echo 📋 Setup Steps:
echo 1. Sign up for free account
echo 2. Create hostname (e.g., hospital.hopto.org)
echo 3. Choose hostname type: DNS Host A
echo 4. Point it to your current IP
echo 5. Install their update client
echo 6. Access via: https://yourhostname
echo.
echo 🚀 Benefits:
echo • Fixed domain name
echo • Professional appearance
echo • Easy to remember
echo • Works even if IP changes
echo.

echo Would you like to open No-IP signup? (y/n)
set /p open_noip="Choice: "
if /i "%open_noip%"=="y" (
    start https://www.noip.com
)

pause
goto main_menu

:exit
echo.
echo 🌍 External Access Setup Complete!
echo.
echo Your platform URLs:
echo • Local: https://localhost
echo • Network: https://YOUR_LOCAL_IP
echo • External: https://YOUR_PUBLIC_IP
echo.
echo Thank you for using Hospital Platform!
timeout /t 3 >nul
exit
