Write-Host "🚀 Starting Geo Shift Spy Application..." -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

# Kill any existing node processes to avoid conflicts
Write-Host "📋 Cleaning up existing processes..." -ForegroundColor Yellow
try {
    Get-Process node -ErrorAction Stop | Stop-Process -Force
    Write-Host "✅ Existing processes cleaned up" -ForegroundColor Green
} catch {
    Write-Host "ℹ️ No existing processes to clean up" -ForegroundColor Gray
}

# Start backend server
Write-Host "🔧 Starting Backend Server (Port 3001)..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    Set-Location "D:\geo-shift-spy\geo-shift-spy"
    node backend/enhanced_server.js
}

# Wait for backend to initialize
Start-Sleep -Seconds 3

# Start frontend server
Write-Host "🌐 Starting Frontend Server..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    Set-Location "D:\geo-shift-spy\geo-shift-spy"
    npm run dev
}

# Wait for both to start
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "✅ APPLICATION STARTED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Green
Write-Host "🔧 Backend Server: http://localhost:3001" -ForegroundColor Cyan
Write-Host "🌐 Frontend Server: http://localhost:8080 or http://localhost:8081" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Server Status:" -ForegroundColor Yellow

# Check backend status
try {
    $backendResponse = Invoke-RestMethod -Uri "http://localhost:3001/health" -TimeoutSec 10
    Write-Host "✅ Backend: Running (Version $($backendResponse.version))" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend: Not responding" -ForegroundColor Red
}

# Check frontend status
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:8080" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Frontend: Running on port 8080" -ForegroundColor Green
} catch {
    try {
        $frontendResponse = Invoke-WebRequest -Uri "http://localhost:8081" -TimeoutSec 5 -ErrorAction Stop
        Write-Host "✅ Frontend: Running on port 8081" -ForegroundColor Green
    } catch {
        Write-Host "❌ Frontend: Not responding on either port" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎯 Ready to use! Upload satellite images at the frontend URL above." -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 To stop servers: Close the terminal or press Ctrl+C" -ForegroundColor Gray

# Keep the script running to monitor jobs
try {
    while ($true) {
        Start-Sleep -Seconds 30
        
        # Check if jobs are still running
        if ($backendJob.State -eq "Failed") {
            Write-Host "❌ Backend job failed. Restarting..." -ForegroundColor Red
            $backendJob = Start-Job -ScriptBlock {
                Set-Location "D:\geo-shift-spy\geo-shift-spy"
                node backend/enhanced_server.js
            }
        }
        
        if ($frontendJob.State -eq "Failed") {
            Write-Host "❌ Frontend job failed. Restarting..." -ForegroundColor Red
            $frontendJob = Start-Job -ScriptBlock {
                Set-Location "D:\geo-shift-spy\geo-shift-spy"
                npm run dev
            }
        }
    }
} catch {
    Write-Host "🛑 Stopping servers..." -ForegroundColor Yellow
    Stop-Job $backendJob, $frontendJob
    Remove-Job $backendJob, $frontendJob
}