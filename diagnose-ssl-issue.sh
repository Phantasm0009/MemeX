#!/bin/bash

# 🔍 Diagnose SSL nginx container issue

echo "🔍 Diagnosing SSL nginx container issue..."

# Check container status
echo "📊 Container status:"
docker ps -a | grep memex-nginx

echo -e "\n📋 Container logs:"
docker logs memex-nginx

echo -e "\n🔧 Testing nginx configuration:"
docker exec memex-nginx nginx -t

echo -e "\n📁 SSL certificates check:"
docker exec memex-nginx ls -la /etc/letsencrypt/live/api.memexbot.xyz/

echo -e "\n🌐 Network connectivity:"
docker exec memex-nginx ping -c 2 memex-backend || echo "Backend not reachable"

echo -e "\n🔍 Port bindings:"
docker port memex-nginx

echo -e "\n🏥 Backend health check:"
curl -f http://localhost:3001/api/health || echo "Backend not responding"
