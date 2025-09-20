#!/bin/bash
# Emergency build script to force correct API URL

echo "🚀 EMERGENCY BUILD - Forcing production API URL"

cd frontend

# Force the correct API URL
echo "NODE_ENV=production" > .env
echo "REACT_APP_API_BASE_URL=https://legal-ai-backend-58fv.onrender.com" >> .env

echo "📦 Building with forced environment:"
cat .env

npm run build

echo "✅ Build complete with correct API URL!"