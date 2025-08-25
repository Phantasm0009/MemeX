# 🚀 DigitalOcean App Platform Environment Variables for Dashboard

## For your DigitalOcean App Platform dashboard, use these environment variables:

### Production Environment Variables:
```bash
NODE_ENV=production
PORT=3002
DASHBOARD_PORT=3002
BACKEND_URL=http://api.memexbot.xyz
```

### Alternative (if HTTP doesn't work):
```bash
NODE_ENV=production
PORT=3002
DASHBOARD_PORT=3002
BACKEND_URL=http://157.245.190.204:3001
```

## 🔧 How to Set Environment Variables in DigitalOcean App Platform:

1. **Go to your App Platform dashboard**
2. **Click on your dashboard app**
3. **Go to Settings → Environment Variables**
4. **Add these variables:**
   - `NODE_ENV` = `production`
   - `PORT` = `3002`
   - `BACKEND_URL` = `http://api.memexbot.xyz`

## 🧪 Testing the Backend Connection:

After setting up the external API, test these endpoints:
- **Health Check:** `http://api.memexbot.xyz/api/health`
- **Market Data:** `http://api.memexbot.xyz/api/market`
- **Leaderboard:** `http://api.memexbot.xyz/api/leaderboard`

## 🔍 Troubleshooting:

If the dashboard can't connect to the API:
1. **Check if the external API is working:** `curl http://api.memexbot.xyz/api/health`
2. **Use the server IP directly:** `BACKEND_URL=http://157.245.190.204:3001`
3. **Check CORS headers** are enabled in nginx

## ✅ Expected Result:

Your dashboard should be able to:
- ✅ Fetch market data from the backend
- ✅ Display stock prices and charts
- ✅ Show user leaderboards
- ✅ Display transaction history
