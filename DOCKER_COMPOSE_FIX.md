# 🔧 Quick Fix for Docker Compose Issue on memexbot-server

## Problem
Docker Compose can't find the configuration file on your server.

## Solution
Run these commands on your DigitalOcean server:

```bash
# 1. Check if you're in the right directory
pwd
ls -la

# 2. If docker-compose.yml is missing, check if files were cloned properly
ls -la docker-compose.yml

# 3. If repository wasn't cloned properly, clone it again
cd /var/www/memexbot
git clone https://github.com/Phantasm0009/MemeX.git .

# 4. If files exist but Docker Compose still fails, try with full file path
docker compose -f docker-compose.yml ps

# 5. Check Docker Compose version
docker compose version

# 6. Alternative: Use docker-compose (with hyphen) if the plugin version doesn't work
docker-compose --version
docker-compose ps

# 7. If still having issues, verify the file content
head -10 docker-compose.yml
```

## Quick Recovery Commands

```bash
# Full reset if needed
cd /var/www/memexbot
rm -rf *
git clone https://github.com/Phantasm0009/MemeX.git .
cp .env.production .env
nano .env  # Edit with your Discord tokens
docker compose build
docker compose up -d
```

## Expected Output
When working correctly, you should see:
```bash
root@memexbot-server:/var/www/memexbot# docker compose ps
NAME                IMAGE                    COMMAND                  SERVICE        CREATED          STATUS          PORTS
memex-backend       stock-bot_backend        "docker-entrypoint.s…"   backend        2 minutes ago    Up 2 minutes    0.0.0.0:3001->3001/tcp
memex-dashboard     stock-bot_dashboard      "docker-entrypoint.s…"   dashboard      2 minutes ago    Up 2 minutes    0.0.0.0:3002->3002/tcp
memex-discord-bot   stock-bot_discord-bot    "docker-entrypoint.s…"   discord-bot    2 minutes ago    Up 2 minutes    
memex-nginx         nginx:alpine             "/docker-entrypoint.…"   nginx          2 minutes ago    Up 2 minutes    0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```
