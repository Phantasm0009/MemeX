# 🔒 SSL Certificate Setup with Docker Nginx

## 🚨 Issue Identified

Certbot is trying to restart system nginx, but port 80 is already used by our Docker nginx container. This causes a port conflict.

## 🎯 Solution: Certbot Webroot Mode with Docker

Instead of letting certbot manage nginx directly, we'll use **webroot mode** to generate certificates and then configure our Docker nginx to use them.

### Step 1: Stop Current Docker nginx
```bash
docker stop memex-nginx
docker rm memex-nginx
```

### Step 2: Generate SSL Certificate (No nginx restart)
```bash
# Create webroot directory
sudo mkdir -p /var/www/certbot

# Generate certificate using webroot mode (doesn't touch nginx)
sudo certbot certonly --webroot \
  -w /var/www/certbot \
  -d api.memexbot.xyz \
  --email atiwar0414@gmail.com \
  --agree-tos \
  --no-eff-email
```

### Step 3: Create SSL-Enabled nginx Configuration

Create the SSL nginx config with certificates:

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

    # Upstream backend
    upstream backend {
        server backend:3001;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name api.memexbot.xyz;
        
        # Certbot webroot location
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        
        # Redirect all other traffic to HTTPS
        location / {
            return 301 https://$server_name$request_uri;
        }
    }

    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name api.memexbot.xyz;

        # SSL Configuration
        ssl_certificate /etc/letsencrypt/live/api.memexbot.xyz/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/api.memexbot.xyz/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # CORS headers
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always;
        add_header Access-Control-Expose-Headers "Content-Length,Content-Range" always;

        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "*";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type "text/plain; charset=utf-8";
            add_header Content-Length 0;
            return 204;
        }

        # Rate limiting
        limit_req zone=api_limit burst=20 nodelay;

        # Proxy to backend
        location / {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

### Step 4: Start nginx with SSL Configuration
```bash
# Start nginx with SSL config and certificate volumes
docker run -d \
  --name memex-nginx \
  --network memexbot_memex-network \
  -p 80:80 \
  -p 443:443 \
  -v $(pwd)/docker/nginx-ssl.conf:/etc/nginx/nginx.conf:ro \
  -v /etc/letsencrypt:/etc/letsencrypt:ro \
  -v /var/www/certbot:/var/www/certbot:ro \
  nginx:alpine
```

### Step 5: Test SSL Certificate
```bash
# Test HTTPS
curl -I https://api.memexbot.xyz/api/health

# Test certificate details
openssl s_client -connect api.memexbot.xyz:443 -servername api.memexbot.xyz
```

## 🔄 Alternative: Temporary System nginx Approach

If webroot mode doesn't work, we can temporarily use system nginx:

```bash
# 1. Stop Docker nginx
docker stop memex-nginx
docker rm memex-nginx

# 2. Install and start system nginx
sudo apt update && sudo apt install nginx
sudo systemctl start nginx

# 3. Run certbot normally
sudo certbot --nginx -d api.memexbot.xyz

# 4. Copy generated certificates and switch back to Docker nginx
# (Certificates will be in /etc/letsencrypt/live/api.memexbot.xyz/)
```

## 📋 Commands to Run on Server

Execute these on your DigitalOcean droplet:

```bash
# Stop current Docker nginx
docker stop memex-nginx
docker rm memex-nginx

# Create webroot directory
sudo mkdir -p /var/www/certbot

# Generate certificate without nginx management
sudo certbot certonly --webroot \
  -w /var/www/certbot \
  -d api.memexbot.xyz \
  --email atiwar0414@gmail.com \
  --agree-tos \
  --no-eff-email

# Check if certificate was generated
sudo ls -la /etc/letsencrypt/live/api.memexbot.xyz/
```

Once this is complete, I'll provide the SSL nginx configuration and restart commands.

## 🎯 Expected Result

After this process:
- ✅ SSL certificate generated for `api.memexbot.xyz`
- ✅ Docker nginx running with HTTPS on port 443
- ✅ HTTP automatically redirects to HTTPS
- ✅ API accessible at `https://api.memexbot.xyz`
