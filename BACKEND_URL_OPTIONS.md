# Alternative Backend URLs for DigitalOcean App Platform Dashboard

## Option 1: Domain-based (Recommended after running setup-api-domain.sh)
BACKEND_URL=http://api.memexbot.xyz

## Option 2: Direct IP access (if nginx not configured)
BACKEND_URL=http://157.245.190.204:3001

## Option 3: Internal container networking (only works if dashboard runs on same server)
BACKEND_URL=http://memex-backend-ultimate-v3:3001

---

## Setup Instructions:

### For Domain Access (api.memexbot.xyz):
1. Copy setup-api-domain.sh and nginx-api-domain.conf to your server
2. Run: bash setup-api-domain.sh  
3. Use: BACKEND_URL=http://api.memexbot.xyz

### For Direct IP Access:
1. Expose backend port on your server: docker port memex-backend-ultimate-v3
2. If not exposed, run: docker stop memex-backend-ultimate-v3 && docker run -d --name memex-backend-ultimate-v3 --network memex-network-ultimate-v3 -p 3001:3001 --env-file .env --restart unless-stopped node:20-alpine sh -c "cd /app && npm start"  
3. Use: BACKEND_URL=http://157.245.190.204:3001

### Testing:
After setup, test with: curl http://api.memexbot.xyz/api/health
