#!/bin/bash

# 🔧 Node.js Version Fix for Ubuntu Server
# This script upgrades Node.js to version 20 LTS to support Discord.js v14

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${RED}🔧 Node.js Version Fix${NC}"
echo "=============================="
echo -e "${YELLOW}Your server has Node.js v12.22.9, but Discord.js v14 requires Node.js 18+${NC}"
echo ""

# Check current Node.js version
echo -e "${BLUE}📊 Current versions:${NC}"
echo "   Node.js: $(node --version)"
echo "   npm: $(npm --version)"
echo ""

# Remove old Node.js and npm
echo -e "${YELLOW}🗑️ Removing old Node.js...${NC}"
sudo apt-get remove -y nodejs npm
sudo apt-get autoremove -y

# Clean up any remaining Node.js traces
echo -e "${YELLOW}🧹 Cleaning up old installations...${NC}"
sudo rm -rf /usr/local/bin/npm /usr/local/share/man/man1/node* ~/.npm
sudo rm -rf /usr/local/lib/node*
sudo rm -rf /usr/local/bin/node*
sudo rm -rf /usr/local/include/node*

# Install Node.js 20 LTS from NodeSource
echo -e "${YELLOW}📥 Installing Node.js 20 LTS...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
echo -e "\n${BLUE}✅ New versions installed:${NC}"
echo "   Node.js: $(node --version)"
echo "   npm: $(npm --version)"

# Check if versions are correct
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 18 ]; then
    echo -e "${GREEN}✅ Node.js version is compatible with Discord.js v14!${NC}"
else
    echo -e "${RED}❌ Node.js version is still too old. Manual intervention required.${NC}"
    exit 1
fi

# Clean npm cache
echo -e "\n${YELLOW}🧹 Cleaning npm cache...${NC}"
npm cache clean --force

# Remove old node_modules if exists
if [ -d "node_modules" ]; then
    echo -e "${YELLOW}🗑️ Removing old node_modules...${NC}"
    rm -rf node_modules package-lock.json
fi

# Install dependencies with new Node.js
echo -e "\n${YELLOW}📦 Installing dependencies with Node.js 20...${NC}"
npm install --only=production

echo -e "\n${GREEN}🎉 Node.js upgrade complete!${NC}"
echo -e "${BLUE}📋 Summary:${NC}"
echo "   ✅ Node.js upgraded to version $(node --version)"
echo "   ✅ npm upgraded to version $(npm --version)"
echo "   ✅ Dependencies installed successfully"
echo ""
echo -e "${BLUE}🚀 Now you can run the ultimate fix:${NC}"
echo -e "${YELLOW}   ./ultimate-fix-v2.sh${NC}"
