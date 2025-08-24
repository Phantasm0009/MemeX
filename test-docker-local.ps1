# 🚀 Deploy Script for Local Testing

# Quick deployment script for testing Docker setup locally before production

Write-Host "🐳 Setting up Docker environment for memexbot.xyz testing..." -ForegroundColor Blue

# Check if Docker is installed
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker not found. Please install Docker Desktop first." -ForegroundColor Red
    Write-Host "   Download from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Check if docker-compose is available
try {
    $composeVersion = docker compose version
    Write-Host "✅ Docker Compose found: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose not found. Please update Docker Desktop." -ForegroundColor Red
    exit 1
}

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item ".env.production" ".env"
    Write-Host "⚠️  IMPORTANT: Please edit .env file with your Discord bot tokens!" -ForegroundColor Red
    Write-Host "   You can edit with: notepad .env" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Required values to update:" -ForegroundColor Yellow
    Write-Host "   - BOT_TOKEN=your_discord_bot_token" -ForegroundColor Cyan
    Write-Host "   - CLIENT_ID=your_discord_client_id" -ForegroundColor Cyan
    Write-Host ""
    
    $continue = Read-Host "Have you updated the .env file? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "❌ Please update .env file first, then run this script again." -ForegroundColor Red
        exit 1
    }
}

# Create necessary directories
Write-Host "📁 Creating required directories..." -ForegroundColor Yellow
$directories = @("data", "logs", "docker/ssl")
foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "   Created: $dir" -ForegroundColor Green
    }
}

# Build Docker images
Write-Host "🔨 Building Docker images..." -ForegroundColor Blue
Write-Host "   This may take a few minutes on first run..." -ForegroundColor Yellow
docker compose build --no-cache

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed!" -ForegroundColor Red
    exit 1
}

# Start services
Write-Host "🚀 Starting all services..." -ForegroundColor Blue
docker compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start services!" -ForegroundColor Red
    exit 1
}

# Wait for services to initialize
Write-Host "⏳ Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check service status
Write-Host "📊 Checking service status..." -ForegroundColor Blue
docker compose ps

# Test API endpoints
Write-Host "🧪 Testing local endpoints..." -ForegroundColor Blue

try {
    $backendHealth = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Backend API: $($backendHealth.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend API not responding" -ForegroundColor Red
}

try {
    $dashboardHealth = Invoke-WebRequest -Uri "http://localhost:3002" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Dashboard: $($dashboardHealth.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Dashboard not responding" -ForegroundColor Red
}

# Deploy Discord commands
Write-Host "🤖 Deploying Discord commands..." -ForegroundColor Blue
docker compose exec memex-discord-bot npm run deploy-commands

Write-Host ""
Write-Host "🎉 Local deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Local URLs:" -ForegroundColor Cyan
Write-Host "   Dashboard: http://localhost:3002" -ForegroundColor White
Write-Host "   API: http://localhost:3001/health" -ForegroundColor White
Write-Host "   Nginx: http://localhost" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Useful commands:" -ForegroundColor Cyan
Write-Host "   View logs: docker compose logs -f" -ForegroundColor White
Write-Host "   Stop services: docker compose down" -ForegroundColor White
Write-Host "   Restart: docker compose restart" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Ready for production deployment to memexbot.xyz!" -ForegroundColor Green
