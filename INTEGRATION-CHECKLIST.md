# 🔗 GridOS Dashboard Integration Checklist

Use this checklist to ensure complete integration between the dashboard, backend, simulator, and database.

---

## ✅ Phase 1: Database Setup

- [ ] **Supabase project created**
  - Project name: `gridios-production` or similar
  - Region selected (closest to users)
  - Database password saved securely

- [ ] **TimescaleDB extension enabled**
  - Dashboard → Database → Extensions → "timescaledb" → Enable

- [ ] **Schema deployed**
  - `db/001_schema.sql` executed in SQL Editor
  - All tables created (verify in Table Editor)
  - Seed data inserted (check `operators` and `sites` tables)

- [ ] **API credentials copied**
  - Project URL saved to `.env` as `VITE_SUPABASE_URL`
  - Anon key saved to `.env` as `VITE_SUPABASE_ANON_KEY`
  - Service role key saved (for backend only)

---

## ✅ Phase 2: Backend API Setup

- [ ] **Backend repository cloned**
  - `gridios-backend/` directory exists
  - Dependencies installed (`npm install`)

- [ ] **Backend environment configured**
  - `.env` file created from `.env.example`
  - Supabase credentials set (use service_role key!)
  - MQTT broker URL configured
  - Africa's Talking credentials set (if using USSD)
  - ClickPesa credentials set (if using payments)

- [ ] **Backend running locally**
  - `npm run dev` starts without errors
  - Health check passes: `curl http://localhost:4000/health`
  - MQTT bridge connects successfully

- [ ] **Test API endpoints**
  ```bash
  # Sites
  curl http://localhost:4000/api/sites
  
  # Meters
  curl http://localhost:4000/api/meters
  
  # Alerts
  curl http://localhost:4000/api/alerts?resolved=false
  ```

---

## ✅ Phase 3: MQTT Broker Setup

- [ ] **Broker selected**
  - [ ] HiveMQ Public (free, no auth, testing only)
  - [ ] HiveMQ Cloud (recommended for production)
  - [ ] Self-hosted Mosquitto
  - [ ] AWS IoT Core / Other

- [ ] **Broker credentials configured**
  - URL: `wss://your-broker:8884/mqtt`
  - Username/password (if required)
  - Updated in both backend and dashboard `.env`

- [ ] **Topic structure confirmed**
  - Prefix: `gridios` (or custom)
  - Format: `gridios/{operator-id}/{site-id}/meters/+/status`

- [ ] **Test MQTT connection**
  - Use MQTT.fx or similar tool
  - Subscribe to `gridios/#`
  - Verify no connection errors

---

## ✅ Phase 4: Meter Simulator Setup

- [ ] **Simulator configured**
  - `minigrid-simulator/` directory exists
  - Dependencies installed (`npm install`)
  - `config/meters.js` updated with correct IDs

- [ ] **Simulator running**
  - `node src/simulator.js` starts without errors
  - Console shows "Publishing to..." messages
  - No MQTT connection errors

- [ ] **Verify data flow**
  - Simulator publishes → MQTT broker
  - Backend MQTT bridge receives messages
  - Data written to Supabase `meter_readings` table
  - Check Supabase Table Editor for new rows

---

## ✅ Phase 5: Dashboard Setup

- [ ] **Dashboard dependencies installed**
  - `npm install` completed
  - `mqtt` and `@supabase/supabase-js` packages present

- [ ] **Dashboard environment configured**
  - `.env` file created from `.env.example`
  - Supabase URL and anon key set
  - Backend API URL set (`http://localhost:4000`)
  - MQTT broker URL set

- [ ] **Dashboard running**
  - `npm run dev` starts without errors
  - Opens at `http://localhost:5173`
  - No console errors on page load

- [ ] **System health check passes**
  - Open browser console
  - Check for "GridOS System Health Check" output
  - All services show ✅

---

## ✅ Phase 6: End-to-End Integration Test

### Test 1: Live MQTT Data

- [ ] Dashboard sidebar shows "Live data" (green dot)
- [ ] Meter cards appear in Dashboard page
- [ ] Power readings update every ~15 seconds
- [ ] Load chart shows changing values
- [ ] Alerts appear in real-time when triggered

### Test 2: Supabase Data Fetch

- [ ] Open Meters page
- [ ] Table shows meter data
- [ ] Click on a meter to see details
- [ ] No "failed to fetch" errors

### Test 3: Backend API Integration

- [ ] Health check passes (check console logs)
- [ ] Analytics page loads data
- [ ] Alerts can be filtered/sorted
- [ ] No CORS errors in console

### Test 4: Data Persistence

- [ ] Stop simulator
- [ ] Check Supabase Table Editor
- [ ] Verify `meter_readings` table has rows
- [ ] Verify `alerts` table has entries
- [ ] Check timestamps are recent

---

## ✅ Phase 7: Production Readiness

### Security

- [ ] `.env` file NOT committed to Git (in `.gitignore`)
- [ ] Supabase RLS policies enabled
- [ ] Backend rate limiting configured
- [ ] MQTT broker uses authentication
- [ ] API keys rotated from defaults

### Performance

- [ ] Dashboard builds successfully (`npm run build`)
- [ ] Build size < 2 MB (check `dist/` folder)
- [ ] MQTT reconnection working (test by stopping broker)
- [ ] No memory leaks (test long-running session)

### Monitoring

- [ ] Error tracking configured (Sentry, etc.)
- [ ] Uptime monitoring set up
- [ ] Log aggregation configured
- [ ] Backup strategy defined

---

## 🔧 Troubleshooting Guide

### Issue: "Waiting for meter data"

**Symptoms**: Dashboard shows loading state, no meters appear

**Checklist**:
- [ ] Simulator is running (`node src/simulator.js`)
- [ ] MQTT broker URL correct in `.env`
- [ ] Browser console shows "MQTT connected"
- [ ] Firewall not blocking WebSocket connections
- [ ] MQTT topic structure matches (check topics in console)

**Fix**:
```bash
# Check simulator output
cd minigrid-simulator
node src/simulator.js

# Should see:
# ✓ Connected to MQTT
# Publishing to gridios/op-jumeme-001/site-tz-001/meters/MTR-001/status
```

---

### Issue: "No data from Supabase"

**Symptoms**: Tables empty, API calls fail

**Checklist**:
- [ ] Supabase URL correct in `.env`
- [ ] Anon key correct and not expired
- [ ] Schema deployed (`operators` table exists)
- [ ] RLS policies allow public read (or auth configured)
- [ ] Internet connection stable

**Fix**:
```javascript
// Test in browser console
import { supabase } from './src/app/lib/supabase';
const { data, error } = await supabase.from('operators').select('*');
console.log('Data:', data, 'Error:', error);
```

---

### Issue: "Backend API not responding"

**Symptoms**: 404 or network errors on API calls

**Checklist**:
- [ ] Backend is running (`npm run dev` in backend folder)
- [ ] API URL correct in dashboard `.env`
- [ ] CORS configured for dashboard domain
- [ ] Port 4000 not blocked by firewall
- [ ] Backend shows no startup errors

**Fix**:
```bash
# Test backend directly
curl http://localhost:4000/health

# Should return:
# {"status":"ok","service":"GridOS API","version":"1.0.0"}
```

---

### Issue: "MQTT connection failed"

**Symptoms**: Red "Error" indicator, console shows MQTT errors

**Checklist**:
- [ ] Broker URL uses `wss://` (secure WebSocket)
- [ ] Broker is accessible (not behind firewall)
- [ ] Credentials correct (if using auth)
- [ ] Browser supports WebSockets
- [ ] No proxy blocking connections

**Fix**:
```javascript
// Test MQTT connection in console
import mqtt from 'mqtt';
const client = mqtt.connect('wss://broker.hivemq.com:8884/mqtt');
client.on('connect', () => console.log('✓ MQTT OK'));
client.on('error', (err) => console.log('✗ MQTT Error:', err));
```

---

## 📊 Integration Success Criteria

All these should be true:

✅ **Dashboard loads** without errors  
✅ **MQTT shows "Live data"** with green indicator  
✅ **Meters appear** in Dashboard and Meters pages  
✅ **Live updates** happening every 15 seconds  
✅ **Alerts stream** in Alerts page  
✅ **Analytics loads** revenue charts  
✅ **Backend health check** passes  
✅ **Supabase tables** contain data  
✅ **No console errors** in browser  
✅ **Build succeeds** (`npm run build`)  

---

## 🎉 Next Steps After Integration

Once all checks pass:

1. **Add Real Meters**
   - Replace simulator with actual meter data
   - Update meter configs in database
   - Test with 1-2 real meters first

2. **Configure Alerts**
   - Set thresholds in backend
   - Test SMS notifications
   - Configure alert routing

3. **Invite Users**
   - Set up Supabase Auth
   - Create operator accounts
   - Configure RLS based on user roles

4. **Go to Production**
   - Follow `DEPLOYMENT.md`
   - Deploy to Vercel/Railway
   - Configure custom domain
   - Set up monitoring

---

## 📞 Support

Stuck? Check these resources:

- **[SETUP.md](./SETUP.md)** - Detailed setup instructions
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide
- **[README.md](./README.md)** - Project overview and architecture

Still having issues?
1. Check browser console for errors
2. Check backend logs for errors
3. Verify all credentials are correct
4. Test each service individually
5. Consult service-specific docs (Supabase, HiveMQ, etc.)

---

**Once all checks pass, you're ready to monitor your mini-grid! ⚡**
