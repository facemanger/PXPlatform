# 🌐 Unified Domain Setup Guide

## Quick Start - Run Platform Now

### Option 1: Easy Launch (Recommended)
```bash
# Double-click this file
START_PLATFORM.bat
```

### Option 2: Network Setup
```bash
# Double-click this file for network configuration
NETWORK_SETUP.bat
```

## 🌍 External Access Solutions

### Method 1: Port Forwarding (Easiest)

1. **Find your public IP:**
   - Go to: https://whatismyipaddress.com
   - Note your public IP address

2. **Configure your router:**
   - Login to your router (usually 192.168.1.1 or 192.168.0.1)
   - Find "Port Forwarding" or "Virtual Server"
   - Forward port 80 to your computer's local IP
   - Save and restart router

3. **Access your platform:**
   - URL: `https://YOUR_PUBLIC_IP`
   - Example: `https://123.45.67.89`

### Method 2: Domain Name (Professional)

1. **Buy a domain:**
   - GoDaddy, Namecheap, or local registrar
   - Cost: ~$10-15 per year

2. **Configure DNS:**
   - Login to your domain provider
   - Add A record: `@` → `YOUR_PUBLIC_IP`
   - Add A record: `www` → `YOUR_PUBLIC_IP`

3. **Access your platform:**
   - URL: `https://yourdomain.com`
   - URL: `https://www.yourdomain.com`

### Method 3: Dynamic DNS (Free)

1. **Sign up for free DNS:**
   - No-IP: https://www.noip.com
   - Dynu: https://www.dynu.com

2. **Create hostname:**
   - Example: `hospital.hopto.org`
   - Point it to your public IP

3. **Install update client:**
   - Download their software
   - It keeps your domain updated

4. **Access your platform:**
   - URL: `https://hospital.hopto.org`

## 🔧 Advanced Configuration

### SSL Certificate for Custom Domain

If you use a custom domain, you'll need an SSL certificate:

```bash
# Generate self-signed certificate (for testing)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Or use Let's Encrypt (for production)
certbot --apache -d yourdomain.com
```

### Router Configuration Examples

**TP-Link Router:**
1. Login: 192.168.1.1
2. Forwarding → Virtual Servers
3. Add: Port 80 → Your Local IP

**Netgear Router:**
1. Login: 192.168.1.1
2. Advanced → Port Forwarding/Port Triggering
3. Add: Port 80 → Your Local IP

**D-Link Router:**
1. Login: 192.168.0.1
2. Advanced → Port Forwarding
3. Add: Port 80 → Your Local IP

## 📱 Mobile Access

### From Phone/Tablet
1. Connect to same WiFi network
2. Use network URL: `https://YOUR_LOCAL_IP`
3. Bookmark for easy access

### From Anywhere
1. Setup port forwarding or domain
2. Use your public URL
3. Works on any device with internet

## 🔒 Security Considerations

### Basic Security
- ✅ HTTPS enabled (SSL certificate)
- ✅ Router firewall configured
- ✅ Strong passwords for admin accounts
- ⚠️  Change default admin password

### Advanced Security
- 🛡️  VPN access instead of public IP
- 🛡️  Cloudflare proxy (free)
- 🛡️  Fail2Ban for brute force protection
- 🛡️  Regular backups

## 🚀 Production Deployment

### For Hospital Use
1. **Dedicated server** (recommended)
2. **Static IP address**
3. **Professional domain name**
4. **Backup power supply**
5. **Regular backups**

### Cloud Options
- **AWS EC2**: Full control, scalable
- **DigitalOcean**: Simple, affordable
- **Azure**: Enterprise features
- **Google Cloud**: Advanced networking

## 📞 Troubleshooting

### Common Issues

**"Can't access from network"**
- Check Windows Firewall
- Verify router port forwarding
- Test with: `telnet YOUR_IP 80`

**"SSL Certificate Error"**
- Use `https://` not `http://`
- Accept certificate warning for self-signed
- Buy proper certificate for production

**"Router Configuration"**
- Search YouTube: "Port forwarding [Your Router Model]"
- Contact your IT department
- Hire network technician

### Getting Help

1. **Check logs:** Look at server console output
2. **Test locally:** https://localhost should work
3. **Test network:** https://YOUR_LOCAL_IP should work
4. **Check firewall:** Windows Defender + Router

## 🎯 Quick URL Summary

| Access Type | URL Example | Setup Time |
|-------------|-------------|------------|
| Local Only | https://localhost | 0 minutes |
| Same Network | https://192.168.1.100 | 0 minutes |
| Port Forwarding | https://123.45.67.89 | 10 minutes |
| Domain Name | https://hospital.com | 1 hour |
| Dynamic DNS | https://hospital.hopto.org | 30 minutes |

---

**Need Help?** Start with `NETWORK_SETUP.bat` for automatic configuration!
