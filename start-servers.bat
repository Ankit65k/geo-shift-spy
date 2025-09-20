@echo off
echo ===============================================
echo      GEO SHIFT SPY - STARTUP SCRIPT
echo ===============================================
echo.

:: Kill any existing node processes
echo Cleaning up existing processes...
taskkill /F /IM node.exe >nul 2>&1
echo Done.
echo.

:: Start backend server in a new window
echo Starting Backend Server (Port 3001)...
start "Geo Shift Spy - Backend" cmd /k "echo Backend Server Starting... && node backend/enhanced_server.js"

:: Wait for backend to initialize
echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

:: Start frontend server in a new window
echo Starting Frontend Server...
start "Geo Shift Spy - Frontend" cmd /k "echo Frontend Server Starting... && npm run dev"

:: Wait for frontend to initialize
echo Waiting for servers to start...
timeout /t 3 /nobreak >nul

echo.
echo ===============================================
echo           SERVERS STARTED!
echo ===============================================
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:8080 (or 8081)
echo.
echo The application should now be accessible!
echo Check the server windows for any errors.
echo.
echo To stop servers: Close the server windows
echo.
pause
