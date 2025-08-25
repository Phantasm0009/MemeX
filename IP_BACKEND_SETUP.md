# 🎯 IP-Based Backend Configuration for memexbot.xyz

## Current Setup

### What This Configuration Does:
- **`memexbot.xyz`** → Your DigitalOcean App Platform Dashboard ✅
- **Backend API** → Direct IP access at `http://157.245.190.204:3001` ✅
- **No nginx proxy needed** → Simpler architecture ✅

### Benefits:
1. **Clean domain separation** - Dashboard gets the main domain
2. **Simpler architecture** - No nginx proxy complexity  
3. **Direct API access** - Lower latency for App Platform
4. **Easier debugging** - Direct connection to backend

## Setup Instructions

### 1. Configure Backend (Run on your server):
```bash
# Upload and run the setup script
scp setup-ip-backend.sh root@157.245.190.204:/var/www/memexbot/
ssh root@157.245.190.204
cd /var/www/memexbot
bash setup-ip-backend.sh
```

### 2. Configure App Platform Dashboard:
In your DigitalOcean App Platform environment variables:
```
BACKEND_URL=http://157.245.190.204:3001
```

### 3. Test the Setup:
```bash
# Test backend API directly
curl http://157.245.190.204:3001/api/health
curl http://157.245.190.204:3001/api/market
curl http://157.245.190.204:3001/api/leaderboard

# Your dashboard should be accessible at
# https://your-app-name.ondigitalocean.app
# Or if you've configured a custom domain: https://memexbot.xyz
```

## Architecture Summary

```
┌─────────────────────────────────────────────┐
│                memexbot.xyz                 │
│          (App Platform Dashboard)           │
└─────────────────┬───────────────────────────┘
                  │
                  │ BACKEND_URL=http://157.245.190.204:3001
                  │
┌─────────────────▼───────────────────────────┐
│         157.245.190.204:3001               │
│            (Backend API)                    │
│                                             │
│  • /api/health                             │
│  • /api/market                             │  
│  • /api/leaderboard                        │
│  • /api/transactions                       │
│  • /api/user                               │
│  • /api/portfolio                          │
└─────────────────────────────────────────────┘
```

## Custom Domain Setup (Optional)

If you want to use `memexbot.xyz` for your App Platform dashboard:

1. **In App Platform:**
   - Go to Settings → Domains
   - Add custom domain: `memexbot.xyz`
   - Follow DNS configuration instructions

2. **Update DNS:**
   - Add CNAME record: `memexbot.xyz` → `your-app-name.ondigitalocean.app`

## Security Notes

- Backend is exposed on port 3001 with CORS enabled
- Consider adding rate limiting if needed
- App Platform provides HTTPS automatically
- Backend uses HTTP (sufficient for internal API calls)

## Troubleshooting

### If dashboard can't connect to backend:
1. Check backend is running: `curl http://157.245.190.204:3001/api/health`
2. Verify environment variable in App Platform: `BACKEND_URL=http://157.245.190.204:3001`
3. Check CORS headers in backend response

### If memexbot.xyz shows API response:
1. Ensure nginx container is stopped: `docker stop memex-nginx-ultimate`
2. Configure custom domain in App Platform for memexbot.xyz
