#!/bin/bash

# 🔍 Debug backend container issue

echo "🔍 Debugging backend container..."

# Check backend container logs
echo "📋 Backend container logs:"
docker logs memex-backend

echo -e "\n🌐 Testing direct backend connection:"
docker exec memex-backend curl -f http://localhost:3001/api/health || echo "Health check failed inside container"

echo -e "\n🔗 Testing backend from host:"
curl -f http://localhost:3001/api/health || echo "Health check failed from host"

echo -e "\n📊 Container status:"
docker ps | grep memex

echo -e "\n🏥 Container health status:"
docker inspect memex-backend --format='{{.State.Health.Status}}'

echo -e "\n🔍 Environment variables in container:"
docker exec memex-backend env | grep -E "(NODE_ENV|PORT|BACKEND_URL)" || echo "No relevant env vars found"

echo -e "\n📁 Container filesystem check:"
docker exec memex-backend ls -la /app
