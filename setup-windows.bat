@echo off
echo 🚀 Italian Meme Stock Exchange - Local Setup for DigitalOcean Deployment
echo ================================================================

echo.
echo 📋 This script will help you prepare for DigitalOcean deployment
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    echo 📥 Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js version: 
node --version

REM Check if npm is working
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not working properly
    pause
    exit /b 1
)

echo ✅ npm version: 
npm --version

echo.
echo 📦 Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

echo.
echo 🔧 Creating production environment file...

REM Create .env.production if it doesn't exist
if not exist .env.production (
    copy .env.example .env.production >nul 2>&1
    echo ✅ Created .env.production from template
) else (
    echo ℹ️  .env.production already exists
)

echo.
echo 📝 Please edit .env.production with your actual values:
echo    - BOT_TOKEN (Required)
echo    - CLIENT_ID (Required) 
echo    - SUPABASE_URL (Recommended)
echo    - SUPABASE_ANON_KEY (Recommended)

echo.
echo 🌐 Next Steps:
echo    1. Edit .env.production with your actual Discord bot tokens
echo    2. Create a DigitalOcean account (get $200 credit!)
echo    3. Create a Droplet (Ubuntu 22.04, $6/month Basic plan)
echo    4. SSH into your droplet and run the deployment script:
echo.
echo       ssh root@YOUR_DROPLET_IP
echo       curl -sSL https://raw.githubusercontent.com/Phantasm0009/MemeX/main/deploy-digitalocean-optimized.sh ^| sudo bash
echo.
echo    5. Copy your .env.production values to the droplet's .env file
echo    6. Deploy dashboard on DigitalOcean App Platform
echo.
echo 📖 Full guide: DEPLOYMENT_GUIDE.md
echo.
echo 💰 Total estimated cost: $11/month ($6 Droplet + $5 App Platform)
echo 🎉 Your $200 credits = 18+ months free!

echo.
pause
