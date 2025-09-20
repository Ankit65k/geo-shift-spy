# Service Status Checker for Geo Shift Spy
Write-Host "🔍 Checking Geo Shift Spy Services..." -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

function Test-Port {
    param([int]$Port)
    $connection = Test-NetConnection -ComputerName "localhost" -Port $Port -InformationLevel Quiet
    return $connection
}

Write-Host ""

# Check Frontend (Vite React)
Write-Host "Frontend (Vite): " -NoNewline -ForegroundColor Yellow
if (Test-Port -Port 5173) {
    Write-Host "✅ Running on http://localhost:5173" -ForegroundColor Green
} else {
    Write-Host "❌ Not running" -ForegroundColor Red
}

# Check Backend (Node.js)
Write-Host "Backend (Node): " -NoNewline -ForegroundColor Yellow
if (Test-Port -Port 5000) {
    Write-Host "✅ Running on http://localhost:5000" -ForegroundColor Green
} else {
    Write-Host "❌ Not running" -ForegroundColor Red
}

# Check ML Backend (FastAPI)
Write-Host "ML Backend (FastAPI): " -NoNewline -ForegroundColor Yellow
if (Test-Port -Port 8001) {
    Write-Host "✅ Running on http://localhost:8001" -ForegroundColor Green
} else {
    Write-Host "⏳ Not running (optional for basic features)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🌐 Quick Links:" -ForegroundColor Magenta
Write-Host "  • Main Application: http://localhost:5173" -ForegroundColor White
Write-Host "  • API Documentation: http://localhost:5000/api-docs" -ForegroundColor White
Write-Host "  • ML API Docs: http://localhost:8001/docs" -ForegroundColor White

Write-Host ""
Write-Host "📝 Notes:" -ForegroundColor Cyan
Write-Host "  • If services aren't running, use: .\start-project.ps1" -ForegroundColor White
Write-Host "  • For map features, add MAPBOX_ACCESS_TOKEN to .env" -ForegroundColor White
Write-Host "  • ML Backend is optional for basic change detection" -ForegroundColor White