# Clear Duplicate Discord Commands (PowerShell)
# This script clears all Discord commands and re-registers them cleanly

Write-Host "Clearing duplicate Discord commands..." -ForegroundColor Yellow

# Check if we can run deploy-commands.js to clear and refresh commands
if (Test-Path "deploy-commands.js") {
    Write-Host "Clearing all existing Discord commands..." -ForegroundColor Red
    
    # Clear all commands first
    $env:CLEAR_COMMANDS = "true"
    node deploy-commands.js --clear
    
    Write-Host "Waiting 3 seconds..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    
    Write-Host "Re-registering fresh commands..." -ForegroundColor Green
    $env:CLEAR_COMMANDS = $null
    node deploy-commands.js
    
    Write-Host "Discord commands cleared and re-registered!" -ForegroundColor Green
    Write-Host "Check your Discord server - commands should now be clean without duplicates." -ForegroundColor Cyan
} else {
    Write-Host "deploy-commands.js not found!" -ForegroundColor Red
    Write-Host "Please make sure you are in the correct directory." -ForegroundColor Red
}

Write-Host ""
Write-Host "Command cleanup complete!" -ForegroundColor Magenta
