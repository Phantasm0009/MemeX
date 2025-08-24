# 🌐 Updated Architecture: Dashboard at memexbot.xyz

## 🎯 New Domain Setup

```
┌─────────────────────────────────────────────────┐
│  📊 Dashboard: memexbot.xyz (App Platform)      │
│  ├── Main website for users                     │
│  ├── Trading interface                          │
│  └── Connects to: api.memexbot.xyz              │
├─────────────────────────────────────────────────┤
│  🔧 API: api.memexbot.xyz (Droplet)            │
│  ├── Backend API endpoints                      │
│  ├── Discord bot (internal)                     │
│  └── Serves: /market, /leaderboard, etc.        │
└─────────────────────────────────────────────────┘
```

## 📋 Updated DNS Configuration

You'll need to set up these DNS records in your domain registrar:

### A Records
```
memexbot.xyz        → App Platform IP (DigitalOcean provides this)
api.memexbot.xyz    → Your droplet IP (157.245.190.204)
```

### CNAME Records (Alternative)
```
www.memexbot.xyz    → memexbot.xyz
```

## 🚀 Deployment Steps

### 1. Update Your Droplet Configuration

```bash
cd /var/www/memexbot

# Pull latest changes
git pull origin main

# Use the new nginx config for API subdomain
docker cp docker/nginx-api-subdomain-http.conf memex-nginx:/etc/nginx/nginx.conf
docker compose restart nginx

# Test API access
curl http://api.memexbot.xyz/health
```

### 2. Generate SSL Certificate for API Subdomain

```bash
# Generate SSL for api.memexbot.xyz
docker compose exec certbot certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email atiwar0414@gmail.com \
  --agree-tos \
  --no-eff-email \
  -d api.memexbot.xyz

# Switch to HTTPS config
docker cp docker/nginx-api-subdomain.conf memex-nginx:/etc/nginx/nginx.conf
docker compose restart nginx
```

### 3. Deploy Dashboard to App Platform

When creating your App Platform app, use these settings:

#### Environment Variables
```
NODE_ENV=production
PORT=3002
DASHBOARD_PORT=3002
BACKEND_URL=https://api.memexbot.xyz
```

#### Custom Domain
- In App Platform dashboard, go to Settings → Domains
- Add custom domain: `memexbot.xyz`
- Follow DNS instructions provided by DigitalOcean

## 🔧 Updated API Endpoints

Your API will now be available at:

```
https://api.memexbot.xyz/market
https://api.memexbot.xyz/leaderboard  
https://api.memexbot.xyz/transactions
https://api.memexbot.xyz/health
```

Dashboard will be at:
```
https://memexbot.xyz
```

## 🎯 Benefits of This Setup

✅ **User-Friendly**: Main site at clean domain  
✅ **API Separation**: Clear API subdomain  
✅ **Scalability**: Dashboard can scale independently  
✅ **Professional**: Proper subdomain structure  
✅ **SEO-Friendly**: Main domain for the interface  

## 📱 Mobile & Social Sharing

With `memexbot.xyz` as the main dashboard:
- Better social media previews
- Cleaner URLs for sharing
- More professional appearance
- Better mobile experience

## 🔄 Migration Steps

1. **Update DNS**: Point `api.memexbot.xyz` to your droplet
2. **Update Droplet**: Use new nginx config for API subdomain  
3. **Update App Platform**: Set `BACKEND_URL=https://api.memexbot.xyz`
4. **Set Custom Domain**: Point `memexbot.xyz` to App Platform

This is much better UX - users visit `memexbot.xyz` for the trading interface! 🎉
