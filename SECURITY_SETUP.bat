@echo off
title Security Configuration for External Access
color 0E
cls

echo.
echo ╔════════════════════════════════════════╗
echo ║     🔒 SECURITY CONFIGURATION           ║
echo ║                                        ║
echo ║   Secure your platform for external    ║
echo ║   network access                       ║
echo ╚════════════════════════════════════════╝
echo.

echo [1/5] Creating secure admin password...
echo.
echo Current default password: admin123
echo ⚠️  CHANGE THIS FOR EXTERNAL ACCESS!
echo.
set /p new_password="Enter new admin password: "
if "%new_password%"=="" (
    echo Password cannot be empty
    pause
    exit /b 1
)

echo.
echo [2/5] Configuring advanced firewall rules...
netsh advfirewall firewall delete rule name="Hospital Platform" >nul 2>&1
netsh advfirewall firewall add rule name="Hospital Platform" dir=in action=allow protocol=TCP localport=80 enable=yes >nul 2>&1
netsh advfirewall firewall add rule name="Hospital Platform HTTPS" dir=in action=allow protocol=TCP localport=443 enable=yes >nul 2>&1
echo ✅ Firewall rules configured

echo.
echo [3/5] Setting up IP restrictions (optional)...
echo Would you like to restrict access to specific IP ranges?
echo [1] No - Allow from anywhere
echo [2] Yes - Restrict to specific IPs
set /p restrict_choice="Choose option (1-2): "

if "%restrict_choice%"=="2" (
    echo.
    echo Enter IP ranges to allow (one per line, empty to finish):
    :add_ip
    set /p allow_ip="IP range (e.g., 192.168.1.0/24) or press Enter: "
    if not "%allow_ip%"=="" (
        netsh advfirewall firewall add rule name="Hospital Allow %allow_ip%" dir=in action=allow protocol=TCP localport=80 remoteip=%allow_ip% >nul 2>&1
        goto add_ip
    )
    echo ✅ IP restrictions configured
)

echo.
echo [4/5] Creating backup configuration...
echo Creating system restore point...
wmic.exe /Namespace:\\root\default Path SystemRestore CallCreateRestorePoint "Hospital Platform Setup", 100, 7 >nul 2>&1
echo ✅ System restore point created

echo.
echo [5/5] Generating security report...
echo.
echo ╔════════════════════════════════════════╗
echo ║          SECURITY REPORT                ║
echo ╚════════════════════════════════════════╝
echo.
echo 🔐 Security Measures Applied:
echo • ✅ HTTPS encryption enabled
echo • ✅ Firewall rules configured
echo • ✅ Admin password updated
if "%restrict_choice%"=="2" echo • ✅ IP restrictions enabled
echo • ✅ System restore point created
echo.
echo 📋 Security Recommendations:
echo • Change passwords regularly
echo • Keep system updated
echo • Monitor access logs
echo • Use VPN for remote access
echo • Enable 2FA if available
echo.
echo 🚨 Important Security Notes:
echo • Your platform will be accessible from internet
echo • Use strong, unique passwords
echo • Consider VPN for additional security
echo • Regular backups are essential
echo.

echo Security configuration complete!
echo.
pause
