# 🚀 Backend Deployment Guide - Render

## ⭐ **Render Deployment (5 minutes)**

**Why Render is perfect for your FastAPI backend:**
- ✅ **Free tier** with generous limits
- ✅ **Perfect GitHub integration**
- ✅ **Auto-detects Python** (no configuration issues)
- ✅ **Automatic HTTPS** and custom domain
- ✅ **Great uptime** and reliability
- ✅ **Simple setup** - just connect GitHub repo

**Cost:** Free for hobby projects, $7/month for production

## 🎯 **Quick Start: Render Deployment**

### Step 1: Go to Render
1. Visit [render.com](https://render.com)
2. Click "Login with GitHub"
3. Sign up (it's free!)

### Step 2: Deploy Your Backend
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select **Legal-AI-Simplifier** repository
4. Choose **backend** folder as root directory
5. Click "Create Web Service"

### Step 3: Configuration (Auto-detected)
Render automatically uses the `render.yaml` configuration:
```yaml
Runtime: Python
Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
Root Directory: backend
```

### Step 4: Environment Variables
These are automatically set from `render.yaml`:
```bash
ENVIRONMENT=production
DEBUG=false
ALLOWED_ORIGINS=https://harshad2321.github.io
LOG_LEVEL=info
```

### Step 5: Get Your URL
- Render provides a URL like: `https://legal-ai-backend.onrender.com`
- Test it by visiting: `YOUR_URL/health`
- You should see: `{"status": "healthy", ...}`

## 🔄 **Update Frontend**

After successful deployment:
1. **Copy your Render URL**
2. **Update `frontend/.env.production`:**
```bash
REACT_APP_API_BASE_URL=https://your-actual-render-url.onrender.com
```
3. **Commit and push** to GitHub
4. **Your frontend automatically switches** from demo mode to real API

## 🎉 **What Happens After Deployment**

1. **Your backend goes live** at the Render URL
2. **Frontend automatically switches** from demo mode to real API  
3. **Users can upload real documents** and get AI analysis
4. **No more "demo mode"** messages
5. **Full functionality** ready for Google Cloud integration

## 💡 **Pro Tips**

1. **Monitor builds** in Render dashboard
2. **Check logs** if anything goes wrong
3. **Health endpoint** `/health` for testing
4. **Auto-redeploys** on every GitHub push
5. **Scale up** easily as your user base grows

## 🚀 **Ready to Deploy?**

Just go to [render.com](https://render.com) and connect your GitHub repo!
Your Legal AI Simplifier will be live in 5 minutes! 🎯