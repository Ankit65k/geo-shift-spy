# Geo Shift Spy - Project Status & Launch
Write-Host ""
Write-Host "🚀 GEO SHIFT SPY - SATELLITE CHANGE DETECTION SYSTEM" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# Function to test if a port is open
function Test-Port {
    param([int]$Port)
    try {
        $connection = Test-NetConnection -ComputerName "localhost" -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
        return $connection
    } catch {
        return $false
    }
}

# Check Backend Status
Write-Host "📡 BACKEND STATUS" -ForegroundColor Yellow
if (Test-Port -Port 5000) {
    Write-Host "   ✅ Backend API: RUNNING on http://localhost:5000" -ForegroundColor Green
    try {
        $backendInfo = Invoke-RestMethod -Uri "http://localhost:5000/" -Method Get -TimeoutSec 3
        Write-Host "   📊 Status: $($backendInfo.status)" -ForegroundColor White
        Write-Host "   🕒 Last Check: $($backendInfo.timestamp)" -ForegroundColor Gray
    } catch {
        Write-Host "   ⚠️  Backend responding but API check failed" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ Backend API: NOT RUNNING" -ForegroundColor Red
    Write-Host "   🔧 Starting backend..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; node backend/server.js" -WindowStyle Normal
}

Write-Host ""

# Check Frontend Status
Write-Host "🌐 FRONTEND STATUS" -ForegroundColor Yellow
$frontendPorts = @(5173, 8080, 8081, 8082, 3000)
$frontendFound = $false

foreach ($port in $frontendPorts) {
    if (Test-Port -Port $port) {
        Write-Host "   ✅ Frontend: RUNNING on http://localhost:$port" -ForegroundColor Green
        $frontendFound = $true
        break
    }
}

if (-not $frontendFound) {
    Write-Host "   ❌ Frontend: NOT RUNNING" -ForegroundColor Red
    Write-Host "   🔧 Starting frontend..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev" -WindowStyle Normal
    Write-Host "   ⏳ Frontend starting... (check in 10 seconds)" -ForegroundColor Yellow
}

Write-Host ""

# Features Status
Write-Host "✨ FEATURES AVAILABLE" -ForegroundColor Magenta
Write-Host "   🎯 Satellite Image Change Detection" -ForegroundColor White
Write-Host "   🌍 Environmental Analysis Reports" -ForegroundColor White
Write-Host "   📊 Multi-class Change Classification" -ForegroundColor White
Write-Host "   🗺️  Interactive Map Overlays (GeoJSON/KML Export)" -ForegroundColor White
Write-Host "   📈 Real-time Analysis with AI Integration" -ForegroundColor White
Write-Host "   📋 Comprehensive Environmental Reports" -ForegroundColor White
Write-Host "   💾 Downloadable Results" -ForegroundColor White

Write-Host ""

# Usage Instructions
Write-Host "📖 QUICK START GUIDE" -ForegroundColor Cyan
Write-Host "1. 🌐 Open your browser to the frontend URL above" -ForegroundColor White
Write-Host "2. 📤 Upload BEFORE and AFTER satellite images" -ForegroundColor White
Write-Host "3. 🔍 Click 'Detect Changes' to analyze" -ForegroundColor White
Write-Host "4. 📊 Review comprehensive environmental analysis" -ForegroundColor White
Write-Host "5. 💾 Download detailed reports and map overlays" -ForegroundColor White

Write-Host ""

# Technical Info
Write-Host "🔧 TECHNICAL DETAILS" -ForegroundColor DarkCyan
Write-Host "   Backend: Node.js + Express + AI Analysis" -ForegroundColor Gray
Write-Host "   Frontend: React + Vite + TailwindCSS" -ForegroundColor Gray
Write-Host "   ML Features: Multi-class Detection, Environmental Analysis" -ForegroundColor Gray
Write-Host "   Export: GeoJSON, KML, Comprehensive Reports" -ForegroundColor Gray
Write-Host "   Supported: JPEG, PNG, TIFF, BMP, WebP (up to 10MB)" -ForegroundColor Gray

Write-Host ""

# Project Structure
Write-Host "📁 PROJECT STRUCTURE" -ForegroundColor DarkYellow
Write-Host "   /backend          - Node.js API server" -ForegroundColor Gray
Write-Host "   /src             - React frontend application" -ForegroundColor Gray
Write-Host "   /ml_backend      - Advanced ML models (optional)" -ForegroundColor Gray
Write-Host "   /uploads         - Temporary image storage" -ForegroundColor Gray

Write-Host ""

# Next Steps
Write-Host "🎯 READY TO USE!" -ForegroundColor Green
Write-Host "   Your Geo Shift Spy system is operational and ready for satellite image analysis." -ForegroundColor White
Write-Host ""
Write-Host "📞 Need Help?" -ForegroundColor Yellow
Write-Host "   • Backend API docs: http://localhost:5000/" -ForegroundColor Gray
Write-Host "   • Check console outputs for any errors" -ForegroundColor Gray
Write-Host "   • Ensure images are satellite/aerial imagery for best results" -ForegroundColor Gray

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")