#!/bin/bash

# Development setup script for Legal AI Simplifier Backend
set -e

echo "🚀 Setting up Legal AI Simplifier Backend for Development"
echo "========================================================="

# Check Python version
python_version=$(python3 --version 2>&1 | grep -o "3\.[0-9]*" | head -1)
required_version="3.11"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "❌ Python 3.11+ required. Found: $python_version"
    exit 1
fi

echo "✅ Python version: $python_version"

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Upgrade pip
echo "⬆️ Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your Google Cloud project settings!"
else
    echo "✅ .env file already exists"
fi

# Create data directory
echo "📁 Creating data directory..."
mkdir -p data

# Check Google Cloud CLI
if command -v gcloud &> /dev/null; then
    echo "✅ Google Cloud CLI found"
    
    # Check authentication
    if gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
        echo "✅ Google Cloud authenticated"
    else
        echo "⚠️  Please run: gcloud auth application-default login"
    fi
else
    echo "⚠️  Google Cloud CLI not found. Please install: https://cloud.google.com/sdk/docs/install"
fi

# Check Docker
if command -v docker &> /dev/null; then
    echo "✅ Docker found"
else
    echo "⚠️  Docker not found (optional for local development)"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your Google Cloud project settings"
echo "2. Set up Google Cloud services:"
echo "   - Create a project: https://console.cloud.google.com/"
echo "   - Enable APIs: Cloud Storage, Firestore, Vertex AI"
echo "   - Create a service account and download the key"
echo "3. Run the development server:"
echo "   source venv/bin/activate"
echo "   uvicorn app.main:app --reload --host 0.0.0.0 --port 8080"
echo "4. Test the API:"
echo "   python test_api.py"
echo ""
echo "Documentation: http://localhost:8080/docs"
echo "Health check: http://localhost:8080/health"