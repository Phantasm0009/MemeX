#!/bin/bash

# 🔧 Fix Docker Backend URL - Quick Server Update
# This script updates the Docker Compose file to use the correct backend URL

echo "🔧 Fixing Docker Compose backend URL..."

# Update the Discord bot backend URL in docker-compose.yml
sed -i 's|BACKEND_URL=http://backend:3001|BACKEND_URL=https://api.memexbot.xyz|g' docker-compose.yml

echo "✅ Updated docker-compose.yml"
echo "📝 Verifying the change..."
grep -n "BACKEND_URL" docker-compose.yml

echo ""
echo "🔄 Rebuilding Discord bot container with new backend URL..."
docker-compose build discord-bot

echo "🚀 Restarting Discord bot with fixed backend URL..."
docker-compose up -d discord-bot

echo ""
echo "✅ Fix complete! The Discord bot should now connect to https://api.memexbot.xyz"
echo "🧪 Test the /market command in Discord to verify the fix."
