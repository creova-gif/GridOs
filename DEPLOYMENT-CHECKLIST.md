# 🚀 GridOS Deployment Checklist

**Goal:** Deploy Express backend + Connect Figma Make frontend  
**Timeline:** 2-4 hours for first deployment

---

## ✅ **PHASE 1: BACKEND DEPLOYMENT** (45-60 minutes)

### **Step 1: Prepare Backend Repository**

- [ ] **Create GitHub repository** for Express backend
  ```bash
  cd your-express-backend
  git init
  git add .
  git commit -m "GridOS API v2.0 - 21 features"
  ```

- [ ] **Create `.gitignore`**
  ```
  node_modules/
  .env
  .env.local
  *.log
  dist/
  .DS_Store
  ```

- [ ] **Push to GitHub**
  ```bash
  git remote add origin https://github.com/USERNAME/gridos-api.git
  git branch -M main
  git push -u origin main
  ```

---

### **Step 2: Set Up Supabase (if not already done)**

- [ ] **Create Supabase project**
  - Go to https://supabase.com/dashboard
  - Click "New project"
  - Name: `gridos-production`
  - Database password: Generate strong password
  - Region: US East (or closest to Tanzania)
  - Wait 2-3 minutes for provisioning

- [ ] **Get credentials**
  - Copy **Project URL**
  - Copy **service_role key** (Settings → API)
  - Save these securely

- [ ] **Run database schema**
  ```bash
  # In your Express backend
  node src/scripts/setupSupabase.js
  ```
  This will create all tables + seed 10 meters

---

### **Step 3: Deploy to Render.com**

- [ ] **Sign up for Render**
  - Go to https://render.com
  - Click "Get Started"
  - Sign up with GitHub

- [ ] **Create new Web Service**
  1. Click "New +" → "Web Service"
  2. Click "Connect account" → Authorize GitHub
  3. Select your `gridos-api` repository
  4. Click "Connect"

- [ ] **Configure service**
  - **Name:** `gridos-api`
  - **Environment:** `Node`
  - **Region:** Oregon (US West) or Frankfurt (closer to Africa)
  - **Branch:** `main`
  - **Build Command:** `npm install`
  - **Start Command:** `node src/server.js` (or `npm start`)
  - **Instance Type:** Free

- [ ] **Add environment variables**
  Click "Environment" tab → "Add Environment Variable":
  
  ```
  PORT=4000
  NODE_ENV=production
  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_SERVICE_KEY=your-service-role-key-here
  FRONTEND_URL=https://your-figma-make-app.makeproxy-c.figma.site
  ```

- [ ] **Deploy**
  - Click "Create Web Service"
  - Wait 3-5 minutes for first build
  - Watch logs for errors

- [ ] **Verify deployment**
  - Copy your Render URL: `https://gridos-api.onrender.com`
  - Test health endpoint: Open `https://gridos-api.onrender.com/health`
  - Should return: `{"status":"ok","version":"2.0.0","features":21}`

---

## ✅ **PHASE 2: FRONTEND CONFIGURATION** (15-30 minutes)

### **Step 4: Update Figma Make Project**

- [ ] **Install API client dependencies**
  
  **In Figma Make Code Editor:**
  - Click on `package.json`
  - Add to dependencies:
    ```json
    "axios": "^1.6.0",
    "@tanstack/react-query": "^5.0.0"
    ```
  - Save file (dependencies auto-install)

- [ ] **Create environment file**
  
  **Create `/VITE_CONFIG.md` in Figma Make:**
  ```md
  # Environment Configuration
  
  Set these in Figma Make Project Settings:
  
  VITE_API_URL=https://gridos-api.onrender.com
  VITE_USE_LOCAL_SIMULATOR=false
  VITE_SITE_ID=00000000-0000-0000-0000-000000000010
  VITE_OPERATOR_ID=00000000-0000-0000-0000-000000000001
  ```

- [ ] **Verify API client** (`/src/app/services/api.ts`)
  - File should exist from previous creation
  - Check `API_BASE_URL` uses `import.meta.env.VITE_API_URL`

---

### **Step 5: Update Frontend to Use Real API**

Choose between two approaches:

#### **APPROACH A: Minimal Changes (Keep Simulator as Fallback)**

Update `/src/app/contexts/LiveDataContext.tsx` to try real API first:

```tsx
const USE_LOCAL_SIMULATOR = 
  import.meta.env.VITE_USE_LOCAL_SIMULATOR === 'true' || 
  import.meta.env.VITE_API_URL === undefined;
```

This keeps the local simulator working if API is unavailable.

#### **APPROACH B: Full API Integration (Recommended for Production)**

Replace simulator with real API calls in each page component.

**Example for Dashboard:**

```tsx
// OLD: Using simulator
const { meters, summary } = useLiveData();

// NEW: Using API
import { useQuery } from '@tanstack/react-query';
import { sitesApi, metersApi } from '../services/api';

const SITE_ID = import.meta.env.VITE_SITE_ID;

const { data: summary } = useQuery({
  queryKey: ['site-stats', SITE_ID],
  queryFn: () => sitesApi.getStats(SITE_ID).then(r => r.data),
  refetchInterval: 30000, // 30 seconds
});

const { data: meters } = useQuery({
  queryKey: ['meters', SITE_ID],
  queryFn: () => metersApi.getBySite(SITE_ID).then(r => r.data),
  refetchInterval: 15000, // 15 seconds
});
```

---

### **Step 6: Add React Query Provider**

Update `/src/app/App.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LiveDataProvider>
        <BrowserRouter>
          {/* ... rest of app ... */}
        </BrowserRouter>
      </LiveDataProvider>
    </QueryClientProvider>
  );
}
```

---

## ✅ **PHASE 3: TESTING** (30 minutes)

### **Step 7: Test Backend Endpoints**

Use Postman or curl to test each API route:

- [ ] **Health check**
  ```bash
  curl https://gridos-api.onrender.com/health
  ```
  Expected: `{"status":"ok","version":"2.0.0","features":21}`

- [ ] **Sites API**
  ```bash
  curl https://gridos-api.onrender.com/api/sites
  ```
  Expected: Array of sites

- [ ] **Meters API**
  ```bash
  curl https://gridos-api.onrender.com/api/meters
  ```
  Expected: Array of 10 meters

- [ ] **Site stats**
  ```bash
  curl https://gridos-api.onrender.com/api/sites/SITE_ID/stats
  ```
  Replace `SITE_ID` with: `00000000-0000-0000-0000-000000000010`

---

### **Step 8: Test Frontend Connection**

- [ ] **Open Figma Make preview**
  - Click "Preview" in Figma Make
  - Open browser console (F12)
  - Check for API errors

- [ ] **Verify data loading**
  - Dashboard should show real meter data
  - No "simulator" badge should appear
  - Meters table should show 10 real meters

- [ ] **Test features**
  - [ ] Dashboard KPIs load
  - [ ] Meters table loads
  - [ ] Charts display data
  - [ ] Navigation works
  - [ ] No console errors

---

## ✅ **PHASE 4: PRODUCTION READINESS** (30 minutes)

### **Step 9: Configure CORS**

Update your Express backend `/src/server.js`:

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173', // Local dev
    'https://your-figma-make-app.makeproxy-c.figma.site', // Production
  ],
  credentials: true,
}));
```

Redeploy backend:
```bash
git add .
git commit -m "Update CORS for production"
git push
```

Render will auto-deploy in 2-3 minutes.

---

### **Step 10: Enable HTTPS**

- [ ] **Render SSL (automatic)**
  - Render provides free SSL certificates
  - No action needed - already enabled

- [ ] **Verify HTTPS**
  - Open `https://gridos-api.onrender.com/health`
  - Check for 🔒 in browser address bar

---

### **Step 11: Set Up Monitoring**

- [ ] **Render Dashboard**
  - Go to https://dashboard.render.com
  - Click your `gridos-api` service
  - Check "Metrics" tab for CPU/Memory/Request count

- [ ] **Error Tracking (Optional)**
  - Sign up for Sentry: https://sentry.io
  - Add Sentry DSN to environment variables
  - Install: `npm install @sentry/node`

---

### **Step 12: Performance Optimization**

- [ ] **Enable Render health checks**
  - In Render dashboard → Settings
  - Health Check Path: `/health`
  - This keeps your free instance awake

- [ ] **Add request caching**
  ```javascript
  // In Express backend
  const cache = {};
  app.get('/api/sites/:id/stats', (req, res) => {
    const cacheKey = `stats-${req.params.id}`;
    if (cache[cacheKey] && Date.now() - cache[cacheKey].time < 30000) {
      return res.json(cache[cacheKey].data);
    }
    // ... fetch from database ...
    cache[cacheKey] = { data: result, time: Date.now() };
    res.json(result);
  });
  ```

---

## ✅ **PHASE 5: GO LIVE** (15 minutes)

### **Step 13: Final Checks**

- [ ] **Backend health**
  - ✅ Render service is running
  - ✅ No errors in logs
  - ✅ All API endpoints respond
  - ✅ Database connected

- [ ] **Frontend health**
  - ✅ Figma Make preview loads
  - ✅ Real data displays
  - ✅ No console errors
  - ✅ All pages functional

- [ ] **Environment variables**
  - ✅ `VITE_API_URL` points to production
  - ✅ `VITE_USE_LOCAL_SIMULATOR=false`
  - ✅ Backend CORS allows Figma Make domain

---

### **Step 14: Publish Figma Make App**

- [ ] **In Figma Make:**
  - Click "Publish" button (top right)
  - Your app is now live!
  - Copy the public URL: `https://your-app.makeproxy-c.figma.site`

- [ ] **Share with team**
  - Send URL to operators
  - Provide login credentials (if auth implemented)
  - Share user guide

---

## 🎉 **DEPLOYMENT COMPLETE!**

Your GridOS dashboard is now live with:
- ✅ Express backend on Render.com
- ✅ Frontend on Figma Make
- ✅ Real-time data from Supabase
- ✅ 21 production features
- ✅ HTTPS enabled
- ✅ CORS configured

---

## 🔧 **TROUBLESHOOTING**

### **Issue: "Network Error" in frontend**

**Solution:**
1. Check `VITE_API_URL` is correct
2. Verify backend is running (open health endpoint)
3. Check CORS allows your Figma Make domain
4. Open browser console for detailed error

---

### **Issue: Backend "Application Error" on Render**

**Solution:**
1. Go to Render logs (Dashboard → Logs tab)
2. Look for error message
3. Common fixes:
   - Missing environment variable → Add in Render settings
   - Database connection failed → Check Supabase credentials
   - Port binding error → Ensure `PORT` env var is set

---

### **Issue: Figma Make shows simulator badge**

**Solution:**
1. Verify `VITE_USE_LOCAL_SIMULATOR=false`
2. Check API URL is accessible
3. Clear browser cache (Cmd+Shift+R / Ctrl+Shift+R)
4. Check browser console for API errors

---

### **Issue: CORS errors**

**Solution:**
1. In backend, add your Figma Make domain to CORS whitelist:
   ```javascript
   app.use(cors({
     origin: 'https://your-app.makeproxy-c.figma.site',
   }));
   ```
2. Redeploy backend
3. Clear browser cache

---

## 📞 **SUPPORT**

### **Render Issues**
- Docs: https://render.com/docs
- Support: help@render.com

### **Supabase Issues**
- Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com

### **Figma Make Issues**
- Help Center: figma.com/help

---

## 🚀 **NEXT STEPS AFTER DEPLOYMENT**

1. **Set up custom domain** (Optional)
   - Buy domain at Namecheap/Google Domains
   - Point to Render/Figma Make
   - $10-15/year

2. **Enable authentication**
   - Implement JWT auth in backend
   - Add login page in frontend
   - Protect API routes

3. **Add monitoring**
   - Sentry for error tracking
   - LogRocket for session replay
   - Render metrics dashboard

4. **Upgrade to paid tiers** (when ready)
   - Render: $7/month (always-on, no cold starts)
   - Supabase: $25/month (dedicated instance)

5. **Connect MQTT broker**
   - Deploy HiveMQ broker
   - Connect real smart meters
   - Stream live data to dashboard

---

**Estimated Total Cost:**
- **Free Tier:** $0/month (Render Free + Supabase Free)
- **Production Tier:** $32/month (Render $7 + Supabase $25)
- **Enterprise Tier:** $100+/month (Dedicated infrastructure)

**Deployment completed:** _____ / _____ / _____  
**Deployed by:** _________________  
**Live URL:** _________________
