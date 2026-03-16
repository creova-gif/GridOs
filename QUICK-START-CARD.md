# ⚡ GridOS Backend Integration - Quick Start Card

**🎯 Goal:** Connect your Express backend to Figma Make frontend in 90 minutes

---

## 🚀 **3-STEP DEPLOYMENT**

### **STEP 1: Deploy Backend to Render (45 min)**

```bash
# 1. Push to GitHub
cd your-express-backend
git init
git add .
git commit -m "GridOS API v2.0"
git remote add origin https://github.com/USERNAME/gridos-api.git
git push -u origin main

# 2. Deploy on Render.com
# → Go to https://render.com
# → Sign up with GitHub
# → New Web Service → Connect repo
# → Add environment variables (see below)
# → Click "Create Web Service"
# → Wait 3-5 minutes

# 3. Test deployment
curl https://gridos-api.onrender.com/health
# Should return: {"status":"ok","version":"2.0.0","features":21}
```

**Environment Variables for Render:**
```
PORT=4000
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...
FRONTEND_URL=https://your-app.makeproxy-c.figma.site
```

---

### **STEP 2: Connect Frontend (30 min)**

**In Figma Make:**

1. **Install dependencies** - Update `package.json`:
   ```json
   {
     "dependencies": {
       "axios": "^1.6.0",
       "@tantml:react-query": "^5.0.0"
     }
   }
   ```

2. **Set environment** - Create `.env.local`:
   ```
   VITE_API_URL=https://gridos-api.onrender.com
   VITE_USE_LOCAL_SIMULATOR=false
   ```

3. **Add React Query** - Update `App.tsx`:
   ```tsx
   import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
   
   const queryClient = new QueryClient();
   
   <QueryClientProvider client={queryClient}>
     <LiveDataProvider>
       {/* ... your app ... */}
     </LiveDataProvider>
   </QueryClientProvider>
   ```

---

### **STEP 3: Convert One Page (15 min)**

**Try Meters page first:**

**BEFORE (simulator):**
```tsx
const { meters } = useLiveData();
```

**AFTER (real API):**
```tsx
import { useQuery } from '@tanstack/react-query';
import { metersApi } from '../services/api';

const SITE_ID = '00000000-0000-0000-0000-000000000010';

const { data: meters = [], isLoading } = useQuery({
  queryKey: ['meters', SITE_ID],
  queryFn: () => metersApi.getBySite(SITE_ID).then(r => r.data),
  refetchInterval: 15000,
});

if (isLoading) return <div>Loading...</div>;
```

**Test:** Open Figma Make preview → Should show real data!

---

## 📋 **CHECKLIST**

**Backend Deployment:**
- [ ] Backend pushed to GitHub
- [ ] Supabase project created
- [ ] Database seeded (10 meters)
- [ ] Render service created
- [ ] Environment variables added
- [ ] Health endpoint returns OK
- [ ] API accessible from browser

**Frontend Connection:**
- [ ] Axios installed
- [ ] React Query installed
- [ ] Environment variables set
- [ ] React Query provider added
- [ ] API client file exists
- [ ] One page converted
- [ ] Real data displays

**Verification:**
- [ ] No simulator badge shown
- [ ] Dashboard shows real meters
- [ ] Data auto-refreshes
- [ ] No console errors
- [ ] Charts display correctly

---

## 🔗 **QUICK LINKS**

| Resource | Link |
|----------|------|
| **Render Dashboard** | https://dashboard.render.com |
| **Supabase Dashboard** | https://supabase.com/dashboard |
| **API Client Code** | `/src/app/services/api.ts` |
| **Full Deployment Guide** | `/DEPLOYMENT-CHECKLIST.md` |
| **Code Examples** | `/INTEGRATION-EXAMPLE.md` |
| **Complete Summary** | `/EXPRESS-BACKEND-SUMMARY.md` |

---

## 🚨 **TROUBLESHOOTING**

| Problem | Solution |
|---------|----------|
| **"Network Error"** | Check `VITE_API_URL` is correct |
| **CORS Error** | Add your domain to backend CORS whitelist |
| **Still shows simulator** | Set `VITE_USE_LOCAL_SIMULATOR=false` |
| **500 Internal Error** | Check Render logs for backend errors |
| **No data loading** | Verify database is seeded (10 meters) |

---

## 💡 **PRO TIPS**

1. **Start simple:** Convert Meters page first, then Dashboard
2. **Test incrementally:** Deploy backend → Test API → Connect one page → Test → Repeat
3. **Watch the logs:** Render dashboard → Logs tab (critical for debugging)
4. **Use React Query DevTools:** See all API calls in browser
   ```tsx
   import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
   <ReactQueryDevtools />
   ```

---

## 📊 **API ENDPOINTS YOU'LL USE**

```
GET  /health                          → Status check
GET  /api/sites                       → All sites
GET  /api/sites/:id/stats             → Site summary
GET  /api/sites/:id/meters            → Meters list
GET  /api/meters/:id/readings         → Time-series data
GET  /api/sites/:id/alerts            → Active alerts
POST /api/customers/:id/topup         → Generate token
PATCH /api/alerts/:id/resolve         → Resolve alert
GET  /api/portfolio/:operatorId       → Multi-site view
GET  /api/fintech/rbf/:siteId         → RBF tracker
GET  /api/operations/anomalies/:siteId → AI anomalies
```

---

## ⏱️ **90-MINUTE BREAKDOWN**

| Time | Task |
|------|------|
| **0-15 min** | Push backend to GitHub |
| **15-25 min** | Create Render account + deploy |
| **25-35 min** | Set environment variables |
| **35-45 min** | Test API endpoints |
| **45-55 min** | Install frontend dependencies |
| **55-65 min** | Add React Query provider |
| **65-75 min** | Convert Meters page |
| **75-85 min** | Test with real data |
| **85-90 min** | Fix any errors |

---

## 🎉 **SUCCESS LOOKS LIKE:**

```
✅ Backend URL: https://gridos-api.onrender.com
✅ Health check: {"status":"ok"}
✅ Frontend: Real data loading
✅ No simulator badge
✅ Auto-refresh working
✅ Zero console errors
```

**You're live!** 🚀

---

## 📞 **NEXT STEPS**

1. ✅ Backend deployed
2. ✅ Frontend connected
3. ✅ One page working
4. → Convert Dashboard page
5. → Convert Alerts page
6. → Convert Analytics page
7. → Add error handling
8. → Polish UI
9. → User testing
10. → Production launch!

---

**Questions?** Read the full guides:
- `/DEPLOYMENT-CHECKLIST.md` - Step-by-step deployment
- `/INTEGRATION-EXAMPLE.md` - Code examples
- `/EXPRESS-BACKEND-SUMMARY.md` - Complete overview

**Let's ship it!** 💪
