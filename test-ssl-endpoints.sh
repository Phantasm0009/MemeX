#!/bin/bash

# 🔍 SSL Endpoint Testing and Debugging Script
# This script tests the SSL endpoints and provides detailed diagnostics

set -e

echo "🔍 SSL Endpoint Testing and Diagnostics"
echo "======================================"

echo "📊 Container Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🔍 Backend Health Diagnostics:"
echo "=============================="

# Check backend logs
echo "📝 Backend container logs (last 20 lines):"
docker logs backend --tail 20

echo ""
echo "🔍 Backend Health Test (internal):"
# Try to access backend directly from host
if curl -f http://localhost:3001/api/health 2>/dev/null; then
    echo "✅ Backend health endpoint accessible from host"
else
    echo "❌ Backend health endpoint not accessible from host"
    
    # Check if backend is actually listening
    echo "🔍 Checking if backend is listening on port 3001..."
    if netstat -tuln | grep -q ":3001 "; then
        echo "✅ Port 3001 is being listened on"
    else
        echo "❌ Port 3001 is not being listened on"
    fi
fi

echo ""
echo "🔍 Nginx Diagnostics:"
echo "===================="

# Check nginx logs
echo "📝 Nginx container logs (last 10 lines):"
docker logs nginx --tail 10

echo ""
echo "🔍 SSL Certificate Check:"
# Check if SSL certificates are properly mounted
echo "📜 SSL certificate file check:"
if docker exec nginx ls -la /etc/letsencrypt/live/api.memexbot.xyz/ 2>/dev/null; then
    echo "✅ SSL certificates are mounted"
else
    echo "❌ SSL certificates not found or not mounted"
fi

echo ""
echo "🔍 Network Connectivity Test:"
echo "============================="

# Test nginx to backend connectivity
echo "🌐 Testing nginx -> backend connectivity:"
if docker exec nginx wget -qO- http://backend:3001/api/health 2>/dev/null; then
    echo "✅ Nginx can reach backend"
else
    echo "❌ Nginx cannot reach backend"
    
    # Check if backend container is reachable by name
    echo "🔍 Testing backend container name resolution:"
    if docker exec nginx nslookup backend 2>/dev/null; then
        echo "✅ Backend hostname resolves"
    else
        echo "❌ Backend hostname does not resolve"
    fi
fi

echo ""
echo "🔍 SSL Endpoint Tests:"
echo "====================="

# Test local SSL endpoints
echo "🔒 Testing local SSL endpoints:"

# Test with various methods
echo "1. Testing https://localhost/api/health"
if curl -k -f https://localhost/api/health 2>/dev/null; then
    echo "✅ Local HTTPS endpoint working"
else
    echo "❌ Local HTTPS endpoint failed"
fi

echo "2. Testing https://api.memexbot.xyz/api/health"
if curl -k -f https://api.memexbot.xyz/api/health 2>/dev/null; then
    echo "✅ Domain HTTPS endpoint working"
else
    echo "❌ Domain HTTPS endpoint failed"
fi

echo "3. Testing HTTP endpoint (should redirect):"
if curl -I http://api.memexbot.xyz/api/health 2>/dev/null | grep -q "301\|302"; then
    echo "✅ HTTP to HTTPS redirect working"
else
    echo "❌ HTTP to HTTPS redirect not working"
fi

echo ""
echo "🎯 Recommendations:"
echo "=================="

# Check container health status and provide recommendations
backend_status=$(docker inspect backend --format='{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
nginx_status=$(docker ps --filter name=nginx --format '{{.Status}}')

if [[ "$backend_status" == "unhealthy" ]]; then
    echo "🔧 Backend is unhealthy - check backend logs and ensure app is starting properly"
fi

if [[ "$nginx_status" == *"restarting"* ]]; then
    echo "🔧 Nginx is restarting - check nginx configuration and SSL certificates"
fi

echo ""
echo "📋 Next Steps:"
echo "============="
echo "1. If backend is unhealthy: docker logs backend"
echo "2. If nginx issues: docker logs nginx"
echo "3. Check SSL certificates: docker exec nginx ls -la /etc/letsencrypt/live/api.memexbot.xyz/"
echo "4. Test direct backend: curl http://localhost:3001/api/health"
echo "5. Test nginx proxy: curl -k https://localhost/api/health"
