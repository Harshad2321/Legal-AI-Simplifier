#!/bin/bash

# Legal AI Simplifier - Frontend Setup Script
set -e

echo "🚀 Legal AI Simplifier - Frontend Setup Script"
echo "================================================"

# Check Node.js version
if command -v node &> /dev/null; then
    node_version=$(node --version)
    echo "✅ Node.js version: $node_version"
    
    # Check if version is 18 or higher
    major_version=$(echo $node_version | cut -d'.' -f1 | sed 's/v//')
    if [ "$major_version" -lt 18 ]; then
        echo "⚠️  Node.js 18+ recommended. Current: $node_version"
    fi
else
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    echo "Download from: https://nodejs.org/"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    npm_version=$(npm --version)
    echo "✅ npm version: $npm_version"
else
    echo "❌ npm is not available"
    exit 1
fi

# Navigate to frontend directory
cd "$(dirname "$0")"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOL
REACT_APP_API_BASE_URL=http://localhost:8080
REACT_APP_DEMO_MODE=false
EOL
    echo "✅ Created .env file"
else
    echo "✅ .env file already exists"
fi

# Create public directory and index.html if not exists
mkdir -p public

if [ ! -f public/index.html ]; then
    echo "📄 Creating index.html..."
    cat > public/index.html << EOL
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#000000" />
  <meta name="description" content="Legal AI Simplifier - Transform complex legal documents into plain English" />
  <title>Legal AI Simplifier</title>
</head>
<body>
  <noscript>You need to enable JavaScript to run this app.</noscript>
  <div id="root"></div>
</body>
</html>
EOL
fi

# Create src/index.tsx if not exists
mkdir -p src

if [ ! -f src/index.tsx ]; then
    echo "📄 Creating index.tsx..."
    cat > src/index.tsx << EOL
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOL
fi

echo ""
echo "🎉 Frontend setup complete!"
echo ""
echo "Next steps:"
echo "1. Make sure the backend is running on http://localhost:8080"
echo "2. Run: npm start"
echo "3. Open: http://localhost:3000"
echo ""
echo "API Documentation: http://localhost:8080/docs"
echo "Health Check: http://localhost:8080/health"
echo ""

# Ask if user wants to start the development server
read -p "Start development server now? (y/n): " start_dev
if [[ $start_dev =~ ^[Yy]$ ]]; then
    echo "🚀 Starting development server..."
    npm start
else
    echo "💡 To start later, run: npm start"
fi