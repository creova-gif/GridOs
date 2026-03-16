# GridOS Dashboard - Complete Setup Guide

This is the **production-ready** GridOS dashboard that integrates with your backend API, Supabase database, and MQTT real-time data streams.

## 🎯 What's Integrated

✅ **Live MQTT Data** - Real-time meter readings, alerts, and site summaries  
✅ **Supabase Backend** - PostgreSQL with TimescaleDB for time-series data  
✅ **Dark Theme UI** - Professional slate/emerald color scheme  
✅ **API Service Layer** - Full REST API integration with your Express backend  
✅ **Type Safety** - TypeScript throughout for better DX  

---

## 📋 Prerequisites

1. **Node.js 18+** installed
2. **Supabase Account** (free tier works)
3. **MQTT Broker Access** (HiveMQ public broker included, or use your own)
4. **GridOS Backend Running** (your Express API from `gridios-backend/`)

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
# Supabase (from https://app.supabase.com/project/_/settings/api)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Backend API (your Express server)
VITE_API_URL=http://localhost:4000

# MQTT Broker (defaults work for development)
VITE_MQTT_BROKER=wss://broker.hivemq.com:8884/mqtt
VITE_MQTT_TOPIC_PREFIX=gridios
VITE_SITE_ID=site-tz-001
VITE_OPERATOR_ID=op-jumeme-001
```

### 3. Set Up Supabase

#### a. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Enable **TimescaleDB** extension:
   - Dashboard → Database → Extensions → Search "timescale" → Enable

#### b. Run Database Schema

1. Open SQL Editor in Supabase
2. Copy and paste the contents of your `db/001_schema.sql` file
3. Execute the SQL to create all tables, functions, and policies

#### c. Insert Seed Data

The schema includes seed data for:
- 1 operator: `Jumeme Rural Power`
- 1 site: `Ukerewe Island — Nansio Feeder`

You can add your 10 meters using the provided schema structure.

### 4. Start the Backend API

In your `gridios-backend/` directory:

```bash
cd ../gridios-backend
npm install
cp .env.example .env
# Edit .env with your Supabase credentials, Africa's Talking keys, etc.
npm run dev
```

The API should start on `http://localhost:4000`

### 5. Start the Meter Simulator

In your `minigrid-simulator/` directory:

```bash
cd ../minigrid-simulator
npm install
node src/simulator.js
```

This publishes MQTT messages to the broker that the dashboard subscribes to.

### 6. Run the Dashboard

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 📁 Project Structure

```
/src/app/
├── contexts/
│   └── LiveDataContext.tsx       # MQTT real-time data provider
├── lib/
│   └── supabase.ts              # Supabase client configuration
├── services/
│   └── api.ts                   # REST API service layer
├── pages/
│   ├── Root.tsx                 # Layout with dark theme sidebar
│   ├── Dashboard.tsx            # Site overview with live data
│   ├── Meters.tsx               # Meter table view
│   └── Alerts.tsx               # Alert feed
├── routes.tsx                   # React Router configuration
└── App.tsx                      # App entry point
```

---

## 🔧 How It Works

### Real-Time Data Flow

```
┌─────────────────┐
│ Meter Simulator │ (publishes MQTT)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MQTT Broker    │ (HiveMQ / Your Broker)
│ Topic Structure │
│ gridios/        │
│   {op-id}/      │
│     {site-id}/  │
│       meters/+/ │
│         status  │
└────────┬────────┘
         │
         ├──────────────────────────────┬───────────────────┐
         │                              │                   │
         ▼                              ▼                   ▼
┌──────────────────┐        ┌──────────────────┐  ┌───────────────┐
│ Dashboard        │        │ MQTT Bridge      │  │ Other Clients │
│ (This App)       │        │ (Express Backend)│  │               │
│ - Live updates   │        │ - Writes to DB   │  │               │
└──────────────────┘        └────────┬─────────┘  └───────────────┘
         │                           │
         │                           ▼
         │                  ┌─────────────────┐
         └─────────────────>│   Supabase DB   │
           (API calls for   │  - Time-series  │
            historical data)│  - Customers    │
                            │  - Alerts       │
                            └─────────────────┘
```

### Data Sources

1. **Live Data (MQTT)**: Meter status, site summary, alerts → Updates UI in real-time
2. **Historical Data (Supabase)**: Customer info, billing events, meter readings → Loaded via REST API

---

## 🎨 Customization

### Change Site Information

Edit `/src/app/pages/Root.tsx`:

```tsx
<div className="text-emerald-400 font-bold text-lg tracking-tight">GridOS</div>
<div className="text-slate-400 text-xs mt-0.5">YOUR SITE NAME</div>
```

### Add More Routes

1. Create a new page in `/src/app/pages/`
2. Add route in `/src/app/routes.tsx`
3. Add nav item in `/src/app/pages/Root.tsx`

### Modify Theme Colors

The theme uses Tailwind's slate + emerald palette:
- Background: `slate-950`, `slate-900`
- Text: `slate-100`, `slate-400`
- Accent: `emerald-400`
- Alerts: `red-400`, `amber-400`

To change, search and replace in component files or modify Tailwind config.

---

## 🔐 Security Notes

### Row-Level Security (RLS)

The database schema includes RLS policies that filter data by `operator_id`. To make this work:

1. Set up Supabase Auth (or use service role key for MVP)
2. Add `operator_id` to JWT custom claims
3. All queries automatically filter by operator

### API Authentication

For production:
1. Add authentication middleware to Express backend
2. Pass JWT tokens from dashboard to API
3. Validate tokens in backend before DB access

---

## 🚀 Deployment

### Frontend (Dashboard)

**Vercel (Recommended)**:
```bash
npm run build
# Deploy dist/ folder to Vercel
```

**Netlify**:
```bash
npm run build
# Deploy dist/ folder to Netlify
```

Set environment variables in your hosting provider's dashboard.

### Backend API

**Railway.app**:
1. Connect GitHub repo
2. Set environment variables
3. Deploy (auto-deploys on push)

**Render / Fly.io**:
Similar process - see their docs for Node.js deployment.

### MQTT Broker (Production)

For production, use a managed MQTT broker:
- **HiveMQ Cloud** (free tier available)
- **AWS IoT Core**
- **CloudMQTT**
- **Self-hosted Mosquitto** (Docker)

Update `VITE_MQTT_BROKER` to your production broker URL.

---

## 📊 Monitoring & Debugging

### Check MQTT Connection

Open browser console:
- ✅ "✓ MQTT connected" → Working
- ❌ Connection errors → Check broker URL, firewall, CORS

### Check API Connection

```bash
curl http://localhost:4000/health
```

Should return:
```json
{
  "status": "ok",
  "service": "GridOS API",
  "version": "1.0.0"
}
```

### Check Supabase Connection

In browser console:
```javascript
import { supabase } from './src/app/lib/supabase';
const { data, error } = await supabase.from('sites').select('*');
console.log(data, error);
```

---

## 🐛 Troubleshooting

### "Waiting for meter data" message

**Cause**: Simulator not running or MQTT not connected

**Fix**:
1. Start simulator: `node src/simulator.js`
2. Check MQTT broker URL in `.env`
3. Check browser console for MQTT connection errors

### "No data from Supabase"

**Cause**: Database not set up or wrong credentials

**Fix**:
1. Run schema SQL in Supabase
2. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Check Supabase dashboard → API settings

### API calls failing

**Cause**: Backend not running or wrong URL

**Fix**:
1. Start backend: `npm run dev` in `gridios-backend/`
2. Verify `VITE_API_URL` points to correct URL
3. Check CORS settings in backend

---

## 📚 Next Steps

### Add Features

- [ ] **Customer Management Page** - CRUD for customers
- [ ] **Billing Events View** - Transaction history
- [ ] **Analytics Dashboard** - Revenue, energy charts
- [ ] **Token Generation** - Buy tokens via dashboard
- [ ] **Export Reports** - PDF/CSV downloads
- [ ] **Real-time Notifications** - Toast alerts for critical events

### Optimize Performance

- [ ] Add React Query for API caching
- [ ] Implement virtual scrolling for large meter lists
- [ ] Add service worker for offline support
- [ ] Optimize MQTT message handling

### Production Readiness

- [ ] Add error boundaries
- [ ] Implement proper logging (Sentry)
- [ ] Add analytics (Plausible/PostHog)
- [ ] Set up CI/CD pipeline
- [ ] Add E2E tests (Playwright)

---

## 💬 Support

For issues related to:
- **Dashboard**: Check this README and browser console
- **Backend API**: See `gridios-backend/README.md`
- **Database Schema**: See `db/001_schema.sql` comments
- **Simulator**: See `minigrid-simulator/README.md`

---

## 📄 License

GridOS Dashboard - Part of the GridOS mini-grid management platform.

Built with React, TypeScript, Tailwind CSS, Supabase, and MQTT.

---

**Happy monitoring! ⚡**
