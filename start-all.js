#!/usr/bin/env node

// Startup script to run both frontend and backend together
// This script starts the backend server and then the frontend Vite dev server

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Satellite Image Change Detector...');
console.log('📡 Starting backend server on port 5000...');

// Start backend server
const backend = spawn('node', ['backend/server.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: { ...process.env }
});

backend.on('error', (err) => {
  console.error('❌ Backend server failed to start:', err);
  process.exit(1);
});

backend.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Backend server exited with code ${code}`);
    process.exit(1);
  }
});

// Give backend time to start, then start frontend
setTimeout(() => {
  console.log('🖥️  Starting frontend Vite server on port 8080...');
  
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  frontend.on('error', (err) => {
    console.error('❌ Frontend server failed to start:', err);
    backend.kill();
    process.exit(1);
  });
  
  frontend.on('exit', (code) => {
    console.log('🖥️  Frontend server stopped');
    backend.kill();
    process.exit(code);
  });
  
}, 2000); // Wait 2 seconds for backend to start

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down servers...');
  backend.kill();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down servers...');
  backend.kill();
  process.exit(0);
});

console.log('✅ Both servers starting...');
console.log('📡 Backend API: http://localhost:5000');
console.log('🖥️  Frontend: http://localhost:8080');