@echo off
REM This script installs and starts both front-end and back-end servers for the Montreal Consultoria project

REM Change to this script's directory (workspace root)
cd /d "%~dp0montreal-consultoria\montreal-consultoria"

echo Installing front-end dependencies...
npm install || (echo Front-end install failed & pause & exit /b)

echo Installing back-end dependencies...
cd backend
npm install || (echo Back-end install failed & pause & exit /b)

echo Starting development servers...
cd ..
npm run dev || (echo Failed to start dev servers & pause & exit /b)

echo All servers started successfully!
pause 