#!/bin/bash

# 🔍 Quick Status Check for memexbot.xyz

echo "🔍 Quick Status Check for memexbot.xyz"
echo "======================================"

echo ""
echo "📊 Current Docker containers:"
docker ps

echo ""
echo "🤖 Discord bot status:"
if docker ps | grep -q "memex-discord-bot"; then
    echo "✅ Discord bot container is running"
    echo "📋 Last 5 log lines:"
    docker logs memex-discord-bot 2>/dev/null | tail -5 || echo "❌ Could not get logs"
else
    echo "❌ Discord bot container not found"
fi

echo ""
echo "🔗 Backend API status:"
if docker ps | grep -q "memex-backend"; then
    echo "✅ Backend container is running"
    if docker exec memex-backend curl -f -s http://localhost:3001/api/health > /dev/null 2>&1; then
        echo "✅ Backend API responding"
    else
        echo "❌ Backend API not responding"
    fi
else
    echo "❌ Backend container not found"
fi

echo ""
echo "🌐 External API access:"
if curl -f -s http://localhost/api/health > /dev/null 2>&1; then
    echo "✅ External API accessible via nginx"
else
    echo "❌ External API not accessible"
fi

if curl -f -s http://api.memexbot.xyz/api/health > /dev/null 2>&1; then
    echo "✅ External API accessible via domain"
else
    echo "❌ External API not accessible via domain"
fi

echo ""
echo "🚀 Recommendation:"
if docker ps | grep -q "memex-discord-bot"; then
    echo "Your Discord bot is still running. You can:"
    echo "1. Leave it as-is if Discord commands are working"
    echo "2. Run nuclear-docker-reset.sh to fix external API access"
else
    echo "Your Discord bot is down. Run nuclear-docker-reset.sh immediately."
fi
