@echo off
echo 🚀 Legal AI Simplifier - Frontend Setup Script
echo ================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js version: %NODE_VERSION%

REM Navigate to frontend directory
cd /d "%~dp0"

REM Install dependencies
echo 📦 Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

REM Create environment file
if not exist .env (
    echo 📝 Creating .env file...
    echo REACT_APP_API_BASE_URL=http://localhost:8080 > .env
    echo REACT_APP_DEMO_MODE=false >> .env
    echo ✅ Created .env file
) else (
    echo ✅ .env file already exists
)

REM Create public directory and favicon if not exists
if not exist public mkdir public
if not exist public\index.html (
    echo 📄 Creating index.html...
    (
        echo ^<!DOCTYPE html^>
        echo ^<html lang="en"^>
        echo ^<head^>
        echo   ^<meta charset="utf-8" /^>
        echo   ^<link rel="icon" href="%%PUBLIC_URL%%/favicon.ico" /^>
        echo   ^<meta name="viewport" content="width=device-width, initial-scale=1" /^>
        echo   ^<meta name="theme-color" content="#000000" /^>
        echo   ^<meta name="description" content="Legal AI Simplifier - Transform complex legal documents into plain English" /^>
        echo   ^<title^>Legal AI Simplifier^</title^>
        echo ^</head^>
        echo ^<body^>
        echo   ^<noscript^>You need to enable JavaScript to run this app.^</noscript^>
        echo   ^<div id="root"^>^</div^>
        echo ^</body^>
        echo ^</html^>
    ) > public\index.html
)

REM Create src/index.tsx if not exists
if not exist src\index.tsx (
    echo 📄 Creating index.tsx...
    (
        echo import React from 'react';
        echo import ReactDOM from 'react-dom/client';
        echo import './index.css';
        echo import App from './App';
        echo.
        echo const root = ReactDOM.createRoot^(
        echo   document.getElementById^('root'^) as HTMLElement
        echo ^);
        echo.
        echo root.render^(
        echo   ^<React.StrictMode^>
        echo     ^<App /^>
        echo   ^</React.StrictMode^>
        echo ^);
    ) > src\index.tsx
)

echo.
echo 🎉 Frontend setup complete!
echo.
echo Next steps:
echo 1. Make sure the backend is running on http://localhost:8080
echo 2. Run: npm start
echo 3. Open: http://localhost:3000
echo.
echo API Documentation: http://localhost:8080/docs
echo Health Check: http://localhost:8080/health
echo.

REM Ask if user wants to start the development server
set /p "start_dev=Start development server now? (y/n): "
if /i "%start_dev%"=="y" (
    echo 🚀 Starting development server...
    npm start
) else (
    echo 💡 To start later, run: npm start
)

pause