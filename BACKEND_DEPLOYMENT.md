# 🚀 Backend Deployment Guide

## Best Options for Your FastAPI Backend

### 1. Railway ⭐ (RECOMMENDED)
**Perfect for your project because:**
- ✅ **Free tier** with generous limits
- ✅ **5-minute setup** from GitHub
- ✅ **Automatic HTTPS** and custom domain
- ✅ **Perfect for FastAPI** 
- ✅ **Auto-scales** based on traffic
- ✅ **Great uptime** and reliability

**Cost:** Free for hobby projects, $5/month for more resources

### 2. Render ⭐
**Great alternative:**
- ✅ **Free tier** (limited but sufficient for demos)
- ✅ **Easy deployment** from GitHub
- ✅ **Good documentation**
- ✅ **SSL certificates** included

**Cost:** Free tier available, $7/month for production

### 3. Google Cloud Run
**Enterprise option:**
- ✅ **Pay per use** (very cheap for demos)
- ✅ **Scales to zero** when not used
- ✅ **Perfect integration** with Google Cloud AI
- ✅ **Container-based** deployment

**Cost:** ~$0-2/month for demo usage

### 4. Vercel (Serverless)
**Pros:** Same platform as potential frontend
**Cons:** Requires restructuring FastAPI as serverless functions

## 🎯 Quick Start: Railway Deployment (5 minutes)

### Step 1: Go to Railway
1. Visit [railway.app](https://railway.app)
2. Click "Login with GitHub"
3. Sign up (it's free!)

### Step 2: Deploy Your Backend
1. Click "Deploy from GitHub repo"
2. Select **Legal-AI-Simplifier** repository
3. Choose **backend** folder
4. Railway auto-detects FastAPI and deploys!

### Step 3: Get Your URL
- Railway gives you a URL like: `https://legal-ai-backend-production.railway.app`
- Click on your deployment to see the URL

### Step 4: Update Your Frontend
1. Edit `frontend/.env.production`:
```bash
REACT_APP_API_BASE_URL=https://your-railway-url.railway.app
```

2. Commit and push:
```bash
git add .
git commit -m "🔗 Connect to Railway backend"
git push origin main
```

### Step 5: Configure Environment Variables
In Railway dashboard > Variables tab, add:
```bash
ENVIRONMENT=production
ALLOWED_ORIGINS=https://harshad2321.github.io
DEBUG=false
```

## 🔄 Alternative: Render Deployment

### Step 1: Go to Render
1. Visit [render.com](https://render.com)
2. Sign up with GitHub

### Step 2: Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select **backend** folder

### Step 3: Configure
```yaml
Name: legal-ai-backend
Runtime: Python 3
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Step 4: Environment Variables
Add the same variables as Railway above.

## 📋 Files Already Created for You

✅ **Procfile** - Railway/Heroku startup command
✅ **railway.toml** - Railway configuration
✅ **requirements.txt** - Python dependencies
✅ **CORS settings** - Already configured in main.py

## 🎉 What Happens After Deployment

1. **Your backend goes live** at the provided URL
2. **Frontend automatically switches** from demo mode to real API
3. **Users can upload real documents** and get AI analysis
4. **No more "demo mode"** messages
5. **Full functionality** with Google Cloud integration ready

## 💡 Pro Tips

1. **Start with Railway** - easiest and most reliable
2. **Test the `/health` endpoint** after deployment
3. **Monitor logs** in Railway/Render dashboard
4. **Add Google Cloud credentials** later for real AI processing
5. **Scale up** as your user base grows

## 🚀 Ready to Deploy?

**Railway (recommended):**
- Takes 5 minutes
- Free forever for demos
- Perfect uptime
- Easy scaling

Just go to [railway.app](https://railway.app) and deploy from your GitHub repo!

Your Legal AI Simplifier will go from demo to production in minutes! 🎯