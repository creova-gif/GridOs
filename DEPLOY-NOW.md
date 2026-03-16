# 🚀 DEPLOY NOW - Step-by-Step Guide

Let's get your GridOS Dashboard live in the next 15 minutes!

---

## 📋 Pre-Deployment Checklist

Before you deploy, make sure you have:

- [x] Dashboard code ready (you have this!)
- [ ] Supabase account and project created
- [ ] Vercel account (sign up at [vercel.com](https://vercel.com))
- [ ] GitHub account (for connecting to Vercel)
- [ ] 15 minutes of time

---

## 🎯 Deployment Path

We'll deploy in this order:

1. ✅ **Supabase** (Database) - 5 minutes
2. ✅ **Vercel** (Frontend) - 5 minutes
3. ⚠️ **Backend API** - Optional (can add later)
4. ⚠️ **MQTT Broker** - Optional (can use public broker for now)

---

## STEP 1: Set Up Supabase (5 minutes)

### 1.1 Create Project

1. Go to **[supabase.com](https://supabase.com)**
2. Sign in or create account
3. Click **"New Project"**
4. Fill in:
   - **Organization**: Create new or select existing
   - **Name**: `gridios-production` (or your choice)
   - **Database Password**: Click "Generate" and **COPY THIS!**
   - **Region**: Choose closest to your users
     - **Europe (Frankfurt)** - Good for East Africa
     - **Asia (Singapore)** - Alternative
   - **Plan**: Start with **Free** (upgrade later)
5. Click **"Create new project"**
6. Wait 2-3 minutes while it provisions

### 1.2 Enable TimescaleDB Extension

1. In your Supabase dashboard, go to **Database** → **Extensions**
2. Search for: `timescaledb`
3. Click **Enable** (the switch on the right)
4. Wait for confirmation

### 1.3 Copy Your Credentials

1. Go to **Settings** → **API**
2. Copy these values (save them somewhere safe):

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M... (KEEP SECRET!)
```

### 1.4 Deploy Database Schema

**If you have your backend's schema file (`db/001_schema.sql`)**:

1. Go to **SQL Editor** in Supabase
2. Click **"New Query"**
3. Copy ALL contents of `db/001_schema.sql`
4. Paste into the editor
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. Wait for "Success!" message

**If you DON'T have the schema yet**:

Don't worry! The dashboard will work without it. You can add it later when you deploy the backend.

✅ **Supabase is ready!**

---

## STEP 2: Deploy to Vercel (5 minutes)

### Option A: Deploy via Vercel Dashboard (Easiest)

#### 2.1 Sign Up / Login

1. Go to **[vercel.com](https://vercel.com)**
2. Click **"Sign Up"** (or Log In if you have account)
3. Choose **"Continue with GitHub"** (recommended)
4. Authorize Vercel to access your repositories

#### 2.2 Import This Project

1. Click **"Add New..."** → **"Project"**
2. Select **"Import Git Repository"**
3. If this code is in GitHub:
   - Find your repo in the list
   - Click **"Import"**
4. If this code is NOT in GitHub yet:
   - You'll need to push it first (see Option B below)

#### 2.3 Configure Project

Vercel should auto-detect it's a Vite project. Verify these settings:

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

#### 2.4 Add Environment Variables

Click **"Environment Variables"** and add these:

**Required Variables:**

| Name | Value | Get From |
|------|-------|----------|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase Settings → API |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJI...` | Supabase Settings → API (anon public) |
| `VITE_MQTT_BROKER` | `wss://broker.hivemq.com:8884/mqtt` | Use public broker for now |
| `VITE_API_URL` | `http://localhost:4000` | Temporary (update later) |

**Optional Variables:**

| Name | Value |
|------|-------|
| `VITE_MQTT_TOPIC_PREFIX` | `gridios` |
| `VITE_SITE_ID` | `site-tz-001` |
| `VITE_OPERATOR_ID` | `op-jumeme-001` |

#### 2.5 Deploy!

1. Click **"Deploy"**
2. Wait 2-3 minutes while Vercel:
   - Installs dependencies
   - Builds your app
   - Deploys to their CDN
3. Watch the build logs (exciting! 🎉)
4. When you see **"✓ Build completed"**, you're done!

#### 2.6 Get Your URL

Vercel will give you a URL like:

```
https://gridios-dashboard-xxxxx.vercel.app
```

**Click it!** Your dashboard is now LIVE! 🚀

---

### Option B: Deploy via CLI (For Advanced Users)

If you prefer command line:

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy from project directory
vercel

# Follow prompts to set environment variables
# Or add them in vercel.com dashboard after deployment
```

---

## STEP 3: Verify Deployment ✅

### 3.1 Check Your Dashboard

1. Open your Vercel URL: `https://your-app.vercel.app`
2. You should see:
   - ✅ Dark theme UI loads
   - ✅ Sidebar with GridOS logo
   - ✅ Dashboard page showing "Site overview"
   - ⚠️ "Waiting for meter data" (normal - no simulator running yet)

### 3.2 Check Browser Console

1. Press **F12** (or right-click → Inspect)
2. Go to **Console** tab
3. Look for:
   - ✅ No red errors (yellow warnings are okay)
   - ✅ "GridOS System Health Check" output
   - ✅ MQTT connection attempt

### 3.3 Check Connection Status

In the sidebar, look for the connection indicator:

- 🟡 **"Connecting..."** - Normal, trying to connect to MQTT
- 🟢 **"Live data"** - Great! (only if simulator is running)
- 🔴 **"Error"** - Check MQTT broker URL in env vars

---

## STEP 4: What's Next?

Your dashboard is now **LIVE** but in "demo mode" because:

- ❌ No backend API running (yet)
- ❌ No meter simulator (yet)
- ❌ No real meters connected (yet)

### To Get Full Functionality:

#### Option 1: Test with Simulator (Recommended for MVP)

If you have the meter simulator:

```bash
cd ../minigrid-simulator
npm install
node src/simulator.js
```

This will publish MQTT data and your dashboard will show live readings!

#### Option 2: Deploy Backend API (For Production)

Follow the backend deployment guide:
- Deploy Express API to Railway/Render
- Update `VITE_API_URL` in Vercel
- Redeploy dashboard

#### Option 3: Connect Real Meters

Configure your actual meters to publish to your MQTT broker, and they'll appear automatically!

---

## 🔧 Common Issues & Fixes

### "Build Failed" on Vercel

**Fix**:
1. Check build logs in Vercel dashboard
2. Make sure `package.json` has all dependencies
3. Verify `npm run build` works locally first

### "Environment Variable Not Found"

**Fix**:
1. Go to Vercel dashboard → Your Project → Settings → Environment Variables
2. Add missing variables
3. Redeploy (Vercel → Deployments → ⋯ → Redeploy)

### "MQTT Connection Failed"

**Fix**:
1. Check `VITE_MQTT_BROKER` is set correctly
2. Make sure it starts with `wss://` (secure WebSocket)
3. For public broker: `wss://broker.hivemq.com:8884/mqtt`

### "Supabase Errors"

**Fix**:
1. Verify `VITE_SUPABASE_URL` is correct
2. Verify `VITE_SUPABASE_ANON_KEY` is the **anon public** key (not service_role)
3. Check if schema is deployed (not required for basic functionality)

---

## 📊 Deployment Checklist

- [ ] Supabase project created
- [ ] TimescaleDB extension enabled
- [ ] Supabase credentials copied
- [ ] Vercel account created
- [ ] Project imported to Vercel
- [ ] Environment variables set
- [ ] Build succeeded
- [ ] Dashboard URL works
- [ ] No console errors
- [ ] Connection status shows (even if "connecting...")

---

## 🎉 Success!

**Your GridOS Dashboard is LIVE!**

**What you have now**:
- ✅ Professional monitoring dashboard
- ✅ Production-ready hosting (Vercel CDN)
- ✅ HTTPS with free SSL certificate
- ✅ Auto-deployments on git push
- ✅ Environment variables configured
- ✅ Supabase database ready

**URL**: `https://your-app.vercel.app`

**Cost**: $0/month (Vercel free tier + Supabase free tier)

---

## 🚀 Advanced: Custom Domain

Want `dashboard.yourcompany.com` instead of `*.vercel.app`?

1. Go to Vercel dashboard → Your Project → Settings → Domains
2. Click **"Add Domain"**
3. Enter your domain: `dashboard.yourcompany.com`
4. Follow DNS configuration instructions
5. Wait for SSL certificate (automatic)
6. Your dashboard is now at your custom domain! 🎊

---

## 📞 Need Help?

**Stuck on Supabase?**
- Check [supabase.com/docs](https://supabase.com/docs)
- Verify region is correct
- Try refreshing after enabling extensions

**Stuck on Vercel?**
- Check build logs carefully
- Verify environment variables
- Try deploying a simple test first

**Dashboard not loading?**
- Check browser console for errors
- Verify all env vars are set
- Try hard refresh (Cmd/Ctrl + Shift + R)

---

## 🎊 What's Next?

Now that your dashboard is deployed:

1. **Test it**: Share the URL with your team
2. **Add data**: Deploy backend or run simulator
3. **Customize**: Update branding, site name, colors
4. **Monitor**: Set up uptime monitoring
5. **Scale**: Add more sites, meters, features

---

**You did it! Your mini-grid monitoring platform is LIVE! ⚡🌍**

Share the URL and start monitoring your sites!

---

**Built with ❤️ for sustainable energy access in Africa**
