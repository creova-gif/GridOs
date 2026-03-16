# 🚀 GridOS Dashboard - Quick Start Guide

**Get your mini-grid monitoring dashboard running in under 2 minutes!**

---

## ⚡ Option 1: Instant Demo (Local Simulator)

**Perfect for:** Testing, demos, development, training

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Open browser
# http://localhost:5173

# ✅ Done! You'll see 10 live meters immediately
```

**What you get:**
- 🟢 10 virtual meters with realistic data
- ⚡ Real-time power consumption
- 💰 Balance depletion simulation
- 🔔 Live alerts (low credit, disconnection, tamper)
- 📊 Revenue tracking

**No configuration needed!** The local simulator is enabled by default.

---

## 🌍 Option 2: Real MQTT Data

**Perfect for:** Production, real meters, live deployments

### Step 1: Disable Simulator

Edit `.env` file:

```env
# Change this line:
VITE_USE_LOCAL_SIMULATOR=false

# Add your MQTT broker:
VITE_MQTT_BROKER=wss://your-broker.hivemq.cloud:8884/mqtt
```

### Step 2: Start Server

```bash
npm run dev
```

### Step 3: Publish Data

Your MQTT publisher should send to these topics:

```
gridios/op-jumeme-001/site-tz-001/meters/MTR-001/status
gridios/op-jumeme-001/site-tz-001/site/summary
gridios/op-jumeme-001/site-tz-001/alerts
```

**Payload example (meter status):**
```json
{
  "meter_id": "MTR-001",
  "customer_name": "Amina Hassan",
  "customer_type": "residential",
  "power_w": 120,
  "voltage_v": 230,
  "current_a": 0.52,
  "balance_tzs": 5200,
  "connected": true,
  "tamper": false,
  "rssi": -70
}
```

---

## 📦 Option 3: Deploy to Production

**Perfect for:** Sharing with team, client demos, production use

### From Figma Make:

```
1. Click "Publish" button
2. Wait ~30 seconds for build
3. Get your URL: https://your-app.makeproxy-c.figma.site
4. Share the link!
```

**The local simulator will work on the deployed site!**  
No backend setup required.

### From Command Line:

```bash
# Build for production
npm run build

# Test production build locally
npm run preview

# Deploy to your hosting (Vercel, Netlify, etc.)
# Upload the /dist folder
```

---

## 🎯 Quick Navigation

Once running, use the sidebar to navigate:

- **◉ Dashboard** - Site overview, KPIs, live chart, alerts
- **⚡ Meters** - Full meter table with status and balances
- **🔔 Alerts** - Alert stream with severity levels
- **📊 Analytics** - Revenue charts and metrics

---

## 🧪 Quick Tests

### Test 1: Verify Simulator is Running

Open browser console (F12) and look for:
```
🎮 Local simulator enabled - starting with 10 virtual meters
```

### Test 2: Watch Live Updates

1. Go to Dashboard
2. Watch the load chart update every second
3. See meter balances decrease in real-time
4. Look for new alerts appearing

### Test 3: Check a Specific Meter

1. Go to Meters page
2. Find MTR-005 (Grace Nyamweru)
3. Watch her balance (starts at TZS 800)
4. She'll disconnect when it hits zero!

---

## ⚙️ Configuration Files

### `.env` (Local Development)

Already configured! Default settings:

```env
VITE_USE_LOCAL_SIMULATOR=true
VITE_MQTT_BROKER=wss://broker.hivemq.com:8884/mqtt
VITE_MQTT_TOPIC_PREFIX=gridios
VITE_SITE_ID=site-tz-001
VITE_OPERATOR_ID=op-jumeme-001
```

### `.env.example` (Template)

Copy this for production deployment:

```env
VITE_USE_LOCAL_SIMULATOR=false
VITE_MQTT_BROKER=wss://your-production-broker.hivemq.cloud:8884/mqtt
```

---

## 🎨 Customization

### Change Site Name

Edit `src/app/App.tsx` around line 20:

```tsx
<div className="text-emerald-400 font-bold text-lg">Your Site Name</div>
<div className="text-slate-400 text-xs mt-0.5">Your Location</div>
```

### Add/Modify Virtual Meters

Edit `src/app/utils/localSimulator.ts`:

```typescript
export const METERS = [
  {
    id: 'MTR-011',
    name: 'Your Customer',
    type: 'residential',
    balance: 10000,
    profile: 'mid',
    brand: 'Hexing'
  },
  // ... more meters
];
```

### Change Update Speed

Edit `src/app/contexts/LiveDataContext.tsx` around line 185:

```typescript
const intervalId = setInterval(() => {
  // Update simulator
}, 3000); // Change from 1000ms to 3000ms for slower updates
```

---

## 🐛 Troubleshooting

### Problem: No data showing

**Solution:**
1. Check `.env` file has `VITE_USE_LOCAL_SIMULATOR=true`
2. Restart dev server: `Ctrl+C` then `npm run dev`
3. Hard refresh browser: `Ctrl+Shift+R` or `Cmd+Shift+R`

### Problem: Console errors

**Solution:**
1. Open browser console (F12)
2. Look for red errors
3. Common fix: `rm -rf node_modules && npm install`

### Problem: MQTT not connecting

**Solution:**
1. Verify broker URL starts with `wss://`
2. Check broker is online and accessible
3. Try with simulator first to isolate issue

### Problem: Build fails

**Solution:**
```bash
# Clean install
rm -rf node_modules
npm install

# Try build again
npm run build
```

---

## 📚 Documentation Links

- **README.md** - Complete project overview
- **SIMULATOR-GUIDE.md** - Detailed simulator documentation
- **LATEST-UPDATES.md** - Recent changes and features
- **HEALTH-CHECK.md** - System status and verification

---

## 💡 Pro Tips

### 1. Fast Development Cycle

```bash
# Terminal 1: Dev server (always running)
npm run dev

# Terminal 2: Make changes, save, auto-reload!
```

### 2. Test Disconnection Quickly

```typescript
// In localSimulator.ts, change MTR-005 balance:
{ id: 'MTR-005', balance: 100, ... }  // Will disconnect in ~1 minute
```

### 3. Generate More Alerts

```typescript
// In localSimulator.ts, increase tamper chance:
if (!newMeter.tamper && Math.random() < 0.01) {  // Was 0.003
  newMeter.tamper = true;
}
```

### 4. See Revenue Accumulate Faster

```typescript
// In localSimulator.ts, increase consumption:
export const PROFILES = {
  mid: [20, 20, 20, ...],  // Double all values
};
```

---

## 🎯 Next Steps

1. ✅ **Run the app** - `npm run dev`
2. ✅ **Explore pages** - Click through Dashboard, Meters, Alerts, Analytics
3. ✅ **Watch simulation** - See balances drop, alerts appear, revenue accumulate
4. ✅ **Customize** - Edit meter data, consumption profiles, site name
5. ✅ **Deploy** - Publish from Figma Make or build for hosting

---

## 🆘 Need Help?

### Check Console First

```bash
# Browser console (F12)
Look for: 🎮 Local simulator enabled...

# If you see errors, check:
1. All dependencies installed? npm install
2. .env file exists and correct?
3. Node version 18+? node --version
```

### Common Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Test production build
```

### Environment Variables

```bash
# List all env vars
cat .env

# Reset to defaults
cp .env.example .env
```

---

## ✨ You're Ready!

Your GridOS Dashboard is **production-ready** with:
- ✅ 10 virtual meters
- ✅ Real-time simulation
- ✅ Live alerts
- ✅ Revenue tracking
- ✅ Dark theme UI
- ✅ Zero configuration

**Just run `npm run dev` and go!** 🚀

---

**GridOS Dashboard v1.0.0**  
Built for mini-grid operators in East Africa 🌍⚡
