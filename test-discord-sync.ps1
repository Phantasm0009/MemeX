# Test Discord Info Sync
$body = @{
    username = 'phantasm0009'
    globalName = 'Phantasm'
    displayName = 'Phantasm'
    discriminator = $null
} | ConvertTo-Json

Write-Host "📝 Sending Discord user info..."
Write-Host "Body: $body"

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/user/1225485426349969518/discord-info" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "✅ Success! Response:"
    $response | ConvertTo-Json -Depth 10
}
catch {
    Write-Host "❌ Failed:"
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)"
    }
}

Write-Host "`n🧪 Testing leaderboard after sync..."
try {
    $leaderboard = Invoke-RestMethod -Uri "http://localhost:3001/api/leaderboard?limit=1" -ErrorAction Stop
    $user = $leaderboard.leaderboard[0]
    Write-Host "📊 User info:"
    Write-Host "   Username: $($user.username)"
    Write-Host "   Display Name: $($user.displayName)"
    Write-Host "   Global Name: $($user.globalName)"
}
catch {
    Write-Host "❌ Failed to get leaderboard: $($_.Exception.Message)"
}
