#!/bin/bash

# 🧹 Docker Network Cleanup Script
# Run this to fix the network endpoint issue before final SSL fix

set -e

echo "🧹 Cleaning up Docker environment..."
echo "===================================="

# Force remove all containers (including the problematic one)
echo "🗑️  Force removing all containers..."
docker container rm -f $(docker container ls -aq) 2>/dev/null || true

# Remove all networks
echo "🌐 Removing all networks..."
docker network rm $(docker network ls -q) 2>/dev/null || true

# Clean up system
echo "🧽 Running system cleanup..."
docker system prune -f

# Remove any orphaned volumes
echo "💾 Cleaning up volumes..."
docker volume prune -f

echo "✅ Docker environment cleaned up!"
echo ""
echo "🚀 Now run the final SSL fix:"
echo "   ./final-ssl-fix.sh"
