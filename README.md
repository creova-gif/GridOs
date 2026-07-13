# 🌍 GridOS Dashboard - AI-Powered Mini-Grid Management Platform

Real-time monitoring and AI-powered analytics for mini-grid operations in East Africa. Built for GridOS development project with multilingual support (English, Swahili, French).

## ✨ **New Features** (March 2026)

🌍 **Multilingual** - English, Swahili (Kiswahili), French  
🧠 **AI Insights** - Load forecasting, credit scoring, digital twin, TOU pricing  
📄 **RBF Reports** - Report templates modeled on REA Tanzania/World Bank/EWURA formats (not verified against the actual agencies — see note below)  
🗺️ **Site Planning** - Geospatial analysis with WorldPop & Global Solar Atlas  

## 📊 **7 Complete Pages**

### Core Operations:
- **Dashboard** (`/`) - Site overview with live KPIs, load chart, meter grid, alerts
- **Meters** (`/meters`) - Real-time telemetry table with customer names, status, balances
- **Alerts** (`/alerts`) - Live alert stream with severity levels (critical, high, medium)
- **Analytics** (`/analytics`) - Revenue tracking with custom bar chart (7-day revenue)

### Advanced Features:
- **🧠 AI Insights** (`/ai`) - Load forecast, site health (digital twin), credit scoring, TOU pricing
- **📄 RBF Reports** (`/reports`) - Draft report templates for REA Tanzania, World Bank ESMAP, EWURA, Carbon credits, Productive use — formats are not verified against the real agencies' current submission requirements
- **🗺️ Site Planning** (`/planning`) - Location scoring, population density, solar resource analysis

## ⚡ **Real-Time Data**
- **MQTT Integration** - Live streaming from HiveMQ broker
- **Local Simulator** - Built-in 10-meter simulation for testing (no MQTT required!)
- **Auto-Reconnect** - Resilient connection handling
- **Live Charts** - Recharts + custom CSS visualizations
- **1-Second Updates** - Fast real-time simulation

## 🎨 **Professional UI**
- Dark slate theme optimized for control rooms
- Responsive design (desktop & mobile)
- Real-time status indicators
- Color-coded alerts and warnings
- **Language switcher** (🇬🇧 🇹🇿 🇫🇷) in sidebar

---

## 🚀 Quick Start

### Option 1: Local Simulator (Recommended for Testing)

The dashboard includes a built-in simulator with 10 virtual meters and realistic consumption patterns!

```bash
# 1. Install dependencies
npm install

# 2. Enable local simulator (already configured in .env)
# VITE_USE_LOCAL_SIMULATOR=true

# 3. Start development server
npm run dev

# 4. Open http://localhost:5173
# ✅ Dashboard will show live data from 10 simulated meters!
```

**What you'll see:**
- 10 meters with realistic names and customer types
- Power consumption based on time of day and customer profile
- Automatic disconnection when balance reaches zero

### Option 2: MQTT Real-Time Data

Connect to an actual MQTT broker for live meter data:

```bash
# 1. Edit .env file
VITE_USE_LOCAL_SIMULATOR=false
VITE_MQTT_BROKER=wss://your-broker.hivemq.cloud:8884/mqtt

# 2. Start dev server
npm run dev

# 3. Publish meter data to MQTT topics:
# gridios/op-jumeme-001/site-tz-001/meters/MTR-001/status
# gridios/op-jumeme-001/site-tz-001/site/summary
# gridios/op-jumeme-001/site-tz-001/alerts
```

---

## 🎯 Local Simulator Details

### Virtual Meters

The simulator includes 10 realistic meters:

| Meter | Customer | Type | Profile | Initial Balance |
|-------|----------|------|---------|----------------|
| MTR-001 | Amina Hassan | Residential | Low | TZS 5,200 |
| MTR-002 | Joseph Mwangi | Residential | Mid | TZS 12,800 |
| MTR-003 | Mama Pima Duka | Business | Shop | TZS 28,000 |
| MTR-004 | Baraka Fishing Co | Productive | Heavy | TZS 45,000 |
| MTR-005 | Grace Nyamweru | Residential | Low | TZS 800 |
| MTR-006 | St. Peter School | Productive | School | TZS 67,000 |
| MTR-007 | Ali Dispensary | Business | Clinic | TZS 32,000 |
| MTR-008 | Zawadi Restaurant | Business | Restaurant | TZS 19,500 |
| MTR-009 | Farida Tailoring | Business | Shop | TZS 7,200 |
| MTR-010 | Pastor Elias | Residential | Zero | TZS 0 |

### Consumption Profiles

Power consumption varies by hour and customer type:
- **Residential (Low)**: 5-50W peak at 7-9 PM
- **Residential (Mid)**: 10-150W peak evenings
- **Business (Shop)**: 5-90W during business hours (8 AM - 6 PM)
- **Business (Restaurant)**: 5-300W with meal-time peaks
- **Productive (Heavy)**: 100-300W industrial loads
- **School**: 5-250W during school hours
- **Clinic**: 40-100W constant medical loads

### Realistic Behaviors

✅ **Balance depletion** - Meters consume credit at tariff rates  
✅ **Auto-disconnect** - Zero balance = power off  
✅ **Low credit alerts** - Warnings when < TZS 3,000  
✅ **Tamper detection** - Random tamper events (0.3% per tick)  
✅ **Voltage variation** - Drops under heavy load  
✅ **Signal strength** - Realistic RSSI values  
✅ **Revenue tracking** - Cumulative daily earnings  

### Update Interval

- Simulator ticks every **1 second** (configurable in `LiveDataContext.tsx`)
- Faster than production (production = 3s) for demo purposes
- All meters update simultaneously

---

## 📁 Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── WelcomeBanner.tsx       # Welcome message component
│   │   └── LoadChart.tsx           # Live load chart (unused in current layout)
│   ├── contexts/
│   │   └── LiveDataContext.tsx     # MQTT + Simulator data provider
│   ├── pages/
│   │   ├── Root.tsx                # Layout with sidebar navigation
│   │   ├── Dashboard.tsx           # Main overview page
│   │   ├── Meters.tsx              # Meter telemetry table
│   │   ├── Alerts.tsx              # Alert feed page
│   │   └── Analytics.tsx           # Revenue & analytics
│   ├── utils/
│   │   └── localSimulator.ts       # 🆕 Built-in meter simulator
│   ├── routes.tsx                  # React Router configuration
│   └── App.tsx                     # Entry point
└── styles/
    ├── fonts.css                   # Font imports
    └── theme.css                   # Tailwind v4 theme tokens
```

---

## 🛠️ Technology Stack

- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **React Router** - Navigation
- **Tailwind CSS v4** - Styling
- **Recharts** - Charts & graphs
- **MQTT.js** - Real-time messaging
- **Lucide React** - Icons

---

## 🎨 Customization

### Change Site Name

Edit `src/app/pages/Root.tsx`:

```tsx
<div className="text-emerald-400 font-bold text-lg">GridOS</div>
<div className="text-slate-400 text-xs mt-0.5">Your Site Name</div>
```

### Modify Simulator Meters

Edit `src/app/utils/localSimulator.ts`:

```typescript
export const METERS = [
  { id: 'MTR-001', name: 'Your Customer', type: 'residential', balance: 10000, profile: 'mid', brand: 'Hexing' },
  // Add more meters...
];
```

### Adjust Update Frequency

Edit `src/app/contexts/LiveDataContext.tsx`:

```typescript
const intervalId = setInterval(() => {
  // Tick simulator
}, 3000); // Change from 1000ms to 3000ms for slower updates
```

### Change Language

Click the **🌍 Globe icon** at the bottom of the sidebar and select:
- 🇬🇧 **English**
- 🇹🇿 **Kiswahili** (Swahili)
- 🇫🇷 **Français** (French)

Language preference is saved to localStorage and persists across sessions.

---

## 🧠 AI Features Overview

### 📈 **Load Forecasting**
- **24-hour forecast** - Hourly power consumption predictions
- **7-day forecast** - Weekly energy demand planning
- **Prophet model** - Time-series analysis with seasonality
- **Factors:** Historical patterns, time-of-day, day-of-week, agricultural seasons

### 💚 **Site Health (Digital Twin)**
- **Health score** (0–100) - Composite site performance metric
- **Expected vs Actual** - Solar generation modeling with loss detection
- **Status levels:** Healthy (85+), Attention (65–84), Warning (40–64), Critical (<40)
- **Detects:** Panel degradation, distribution losses, meter tampering

### 💰 **Credit Scoring**
- **Customer scores** (0–100) - Based on 6 payment & consumption factors
- **Credit tiers:** Excellent (80+), Good (65+), Fair (50+), Poor (<50)
- **Recommendations:** TZS 0–20,000 credit limits per tier
- **MFI Export:** JSON format for FINCA, Jumo, Branch underwriting

### ⚡ **Time-of-Use Pricing**
- **6 pricing periods** - Dynamic tariffs by time of day
- **Solar peak discount** (10am–3pm): ×0.70 - Shift load to solar hours
- **Evening peak premium** (6pm–10pm): ×1.35 - Reduce grid stress
- **Demand response** - Auto-SMS customers during high load

---

## 📄 RBF Reports

### Report Templates (Unverified)

⚠️ **These are draft templates styled after the named programs, not certified or agency-approved outputs.** Before relying on any of these for a real subsidy claim or regulatory submission, verify the current format directly with the issuing body.

1. **REA Tanzania** - Draft RBF template for subsidy claims (up to $400/connection)
2. **World Bank ESMAP** - Draft Mission 300 universal access tracking template
3. **EWURA** - Draft tariff review submission template
4. **Carbon Credits** - Draft Verra/Gold Standard VCS-style template
5. **Productive Use** - Customer identification for appliance financing

### Requirements:
- ≥50 connections for RBF eligibility
- ≥70% collection rate
- LOIS registration (REA Tanzania)
- EWURA license

---

## 🗺️ Site Planning Tool

**Geospatial analysis for new site selection:**

### Data Sources:
- **WorldPop** - Unelectrified population density (5km radius)
- **Global Solar Atlas** - Solar resource (GHI kWh/m²/day)
- **GridOS Registry** - Distance to existing sites

### Viability Scoring (0–100):
- **Population** (0–30 pts)
- **Solar Resource** (0–25 pts)
- **Isolation** (0–25 pts)
- **Productive Use Potential** (0–20 pts)

### Financial Projections:
- Estimated connections (30% of population)
- System size (kW)
- CAPEX ($4,500/kW typical SSA)
- Annual revenue ($8 ARPU)
- Simple payback period
- RBF eligibility status

### Regulatory Guidance:
- Tanzania licensing requirements (LOIS/EWURA)
- Timeline estimates (3–12 months)

---

## 📊 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_USE_LOCAL_SIMULATOR` | Enable built-in simulator | `true` |
| `VITE_MQTT_BROKER` | MQTT broker WebSocket URL | `wss://broker.hivemq.com:8884/mqtt` |
| `VITE_MQTT_TOPIC_PREFIX` | MQTT topic prefix | `gridios` |
| `VITE_SITE_ID` | Site identifier | `site-tz-001` |
| `VITE_OPERATOR_ID` | Operator identifier | `op-jumeme-001` |
| `VITE_API_URL` | Backend API URL (optional) | `http://localhost:4000` |

---

## 🚀 Deployment (Figma Make)

This project is built for **Figma Make** and can be deployed directly from the Figma interface!

### Deploy Steps:

1. Click the **"Publish"** button in Figma Make
2. Your dashboard will be live at a `.makeproxy-c.figma.site` URL
3. Share the URL with your team!

### Production Configuration:

When deploying to production, update environment variables:

```env
VITE_USE_LOCAL_SIMULATOR=false
VITE_MQTT_BROKER=wss://your-production-broker.hivemq.cloud:8884/mqtt
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🐛 Troubleshooting

### No Data Showing?

**Check simulator is enabled:**
```bash
# In .env file:
VITE_USE_LOCAL_SIMULATOR=true
```

**Check browser console:**
- Press F12
- Look for "GridOS System Health Check"
- Verify no red errors

### MQTT Not Connecting?

**Test with simulator first:**
- Enable `VITE_USE_LOCAL_SIMULATOR=true`
- Restart dev server
- Data should appear immediately

**For real MQTT:**
- Verify broker URL starts with `wss://`
- Check broker is online
- Verify topic structure matches your publisher

### Charts Not Updating?

- Wait 10-15 seconds for data to accumulate
- Recharts animations are disabled to prevent duplicate key warnings
- Load history needs at least 2 data points to render

---

## 📖 Related Documentation

Original HTML dashboard reference:
- `/src/imports/gridios_live_dashboard.html` - Standalone HTML version

Deployment guides:
- `DEPLOY-NOW.md` - Quick deployment guide
- `DEPLOYMENT-READY.md` - Pre-deployment checklist
- `deployment-status.md` - Track deployment progress

**🆕 Comprehensive Guides:**
- **`AI-FEATURES-GUIDE.md`** ⭐ - Complete AI features & multilingual documentation
- **`FEATURES-SUMMARY.md`** ⭐ - Full feature list and capabilities
- **`QUICK-REFERENCE.md`** ⭐ - One-page quick reference card
- **`SIMULATOR-GUIDE.md`** - Detailed simulator documentation
- **`QUICK-START.md`** - 2-minute setup guide
- **`HEALTH-CHECK.md`** - System verification checklist
- **`LATEST-UPDATES.md`** - Recent changes and updates

---

## 🎉 What's Next?

Now that your dashboard is running:

1. ✅ **Test the simulator** - Watch meters consume power and balances drop
2. ✅ **Trigger alerts** - Wait for meters to reach zero balance
3. ✅ **Explore pages** - Navigate between Dashboard, Meters, Alerts, Analytics
4. ✅ **Customize** - Add your own meters, sites, branding
5. ✅ **Deploy** - Publish from Figma Make when ready!

---

## 📞 Support

**Using Local Simulator:**
- Check `.env` has `VITE_USE_LOCAL_SIMULATOR=true`
- Restart dev server after changing environment variables
- Data appears within 1-2 seconds

**Using MQTT:**
- Verify broker connection in browser console
- Check topic structure matches your publisher
- Test with public broker first: `wss://broker.hivemq.com:8884/mqtt`

---

**Built with ⚡ for mini-grid operators powering communities across East Africa**

GridOS Dashboard v1.0.0 | Jumeme Rural Power | Tanzania 🇹🇿