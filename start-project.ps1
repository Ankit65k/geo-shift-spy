# Geo Shift Spy Project Startup Script
# Starts both frontend (Vite React) and backend (Node.js) services

Write-Host "🚀 Starting Geo Shift Spy Project..." -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Check if mapbox-gl is installed for the new interactive map feature
$mapboxInstalled = npm list mapbox-gl 2>$null
if (-not $mapboxInstalled) {
    Write-Host "🗺️ Installing interactive map dependencies..." -ForegroundColor Yellow
    npm install mapbox-gl @types/mapbox-gl
}

Write-Host ""
Write-Host "🌐 Available Services:" -ForegroundColor Cyan
Write-Host "  • Frontend (React + Vite): http://localhost:5173" -ForegroundColor White
Write-Host "  • Backend (Node.js): http://localhost:5000" -ForegroundColor White
Write-Host "  • ML Backend (FastAPI): http://localhost:8001" -ForegroundColor White
Write-Host ""

Write-Host "✨ New Features Available:" -ForegroundColor Magenta
Write-Host "  • Interactive Map Overlays" -ForegroundColor White
Write-Host "  • GeoJSON/KML Export" -ForegroundColor White
Write-Host "  • Multi-class Change Detection" -ForegroundColor White
Write-Host "  • Disaster Assessment" -ForegroundColor White
Write-Host ""

Write-Host "🔧 Starting services..." -ForegroundColor Yellow

# Start the React frontend development server
Write-Host "Starting frontend server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev" -WindowStyle Normal

# Wait a moment for the frontend to initialize
Start-Sleep -Seconds 3

# Start the backend server
Write-Host "Starting backend server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; node backend/server.js" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Project started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📖 Quick Start Guide:" -ForegroundColor Cyan
Write-Host "  1. Open http://localhost:5173 in your browser" -ForegroundColor White
Write-Host "  2. Upload before/after satellite images" -ForegroundColor White
Write-Host "  3. Select analysis type (change detection, disaster assessment)" -ForegroundColor White
Write-Host "  4. View results on interactive map with geographic overlays" -ForegroundColor White
Write-Host "  5. Export data as GeoJSON/KML for GIS applications" -ForegroundColor White
Write-Host ""
Write-Host "🗺️ Map Features:" -ForegroundColor Magenta
Write-Host "  • Click features for detailed information" -ForegroundColor White
Write-Host "  • Export map overlays to GeoJSON/KML formats" -ForegroundColor White
Write-Host "  • Interactive clustering for large datasets" -ForegroundColor White
Write-Host "  • Satellite imagery background" -ForegroundColor White
Write-Host ""
Write-Host "📋 Environment Notes:" -ForegroundColor Yellow
Write-Host "  • Add REACT_APP_MAPBOX_ACCESS_TOKEN to .env for maps" -ForegroundColor White
Write-Host "  • ML Backend requires Python dependencies (see ml_backend/requirements.txt)" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")