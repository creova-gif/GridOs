# 🔌 GridOS Backend Integration Guide

**Problem:** Figma Make cannot run your Node.js/Express backend  
**Solution:** Hybrid architecture - Deploy backend separately, connect frontend via API

---

## 🏗️ **ARCHITECTURE**

```
┌─────────────────────────────────────────────────────────────┐
│ FIGMA MAKE (Frontend Only)                                 │
│ ─────────────────────────────────────────────────────────  │
│ • React Dashboard (9 pages)                                 │
│ • Design System                                             │
│ • Multilingual (EN/SW/FR)                                   │
│ • API Client (/src/app/services/api.ts)                     │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS
                    [CORS Enabled]
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ EXPRESS BACKEND (Deployed Separately)                      │
│ ─────────────────────────────────────────────────────────  │
│ • Node.js + Express                                         │
│ • 21 API features                                           │
│ • MQTT bridge                                               │
│ • Supabase PostgreSQL                                       │
│ • TimescaleDB (time-series)                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ DATA LAYER                                                  │
│ ─────────────────────────────────────────────────────────  │
│ • Supabase PostgreSQL (shared)                              │
│ • MQTT Broker (meters)                                      │
│ • Mobile Money APIs (M-Pesa, Airtel, Tigo)                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 **DEPLOYMENT OPTIONS**

### **Option 1: Render.com (Recommended - Free Tier)**

**Why Render:**
- ✅ Free tier available
- ✅ Easy Node.js deployment
- ✅ Auto-deploys from GitHub
- ✅ Custom domains
- ✅ SSL certificates (free)
- ✅ Environment variables
- ✅ Health checks

**Steps:**

1. **Push your Express backend to GitHub**
   ```bash
   # In your Express backend directory
   git init
   git add .
   git commit -m "Initial commit - GridOS Express API"
   git remote add origin https://github.com/yourusername/gridos-api.git
   git push -u origin main
   ```

2. **Create Render account**
   - Go to https://render.com
   - Sign up with GitHub
   - Authorize Render to access your repositories

3. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your `gridos-api` repository
   - Configure:
     - **Name:** `gridos-api`
     - **Environment:** Node
     - **Build Command:** `npm install`
     - **Start Command:** `node src/server.js`
     - **Plan:** Free

4. **Add Environment Variables**
   ```
   PORT=4000
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_service_role_key
   FRONTEND_URL=https://your-figma-make-app.makeproxy-c.figma.site
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait 3-5 minutes for deployment
   - Copy your service URL: `https://gridos-api.onrender.com`

---

### **Option 2: Railway.app**

**Why Railway:**
- ✅ $5/month free credit
- ✅ Easy Node.js deployment
- ✅ Auto-scaling
- ✅ Persistent storage

**Steps:**
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your Express backend repo
5. Add environment variables
6. Deploy

---

### **Option 3: Fly.io**

**Why Fly:**
- ✅ Free tier (3 shared-cpu-1x 256MB VMs)
- ✅ Global edge deployment
- ✅ Fast cold starts

**Steps:**
1. Install Fly CLI:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. Login and launch:
   ```bash
   fly auth login
   cd your-express-backend
   fly launch
   ```

3. Deploy:
   ```bash
   fly deploy
   ```

---

## 🔧 **FRONTEND CONFIGURATION**

### **1. Install Dependencies**

In your Figma Make project:

```bash
npm install axios @tanstack/react-query
```

### **2. Create `.env.local`**

Create a file at the root of your project:

```bash
# .env.local
VITE_API_URL=https://gridos-api.onrender.com
VITE_USE_LOCAL_SIMULATOR=false
```

### **3. Update App.tsx to Use Real API**

<function_calls>
<invoke name="read">
<parameter name="path">/src/app/contexts/LiveDataContext.tsx