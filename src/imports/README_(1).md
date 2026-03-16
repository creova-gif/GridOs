# GridOS — Mini-Grid Management Platform

End-to-end SaaS for East Africa mini-grid operators.
Billing · Metering · Mobile Money · USSD · Agent App · Carbon Credits

---

## System architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        GridOS Platform                          │
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐    │
│  │   Simulator  │   │  Agent App   │   │ Operator Dashboard│   │
│  │  (dev only)  │   │  (Expo RN)   │   │  (React + Vite)  │   │
│  └──────┬───────┘   └──────┬───────┘   └────────┬─────────┘   │
│         │ MQTT              │ REST API            │ REST + WS   │
│         ▼                   ▼                     ▼             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              gridios-backend (Node.js / Express)        │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │MQTT Bridge│ │ REST API │ │ USSD     │ │ Webhooks │  │   │
│  │  │(subscriber│ │ /api/*   │ │ /ussd    │ │ /webhooks│  │   │
│  │  └──────┬───┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │   │
│  └─────────┼──────────┼────────────┼─────────────┼─────────┘  │
│            ▼          ▼            ▼             ▼              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │          Supabase (PostgreSQL + TimescaleDB + RLS)      │   │
│  │  billing_events · meter_readings · customers · tokens   │   │
│  └─────────────────────────────────────────────────────────┘   │
│            │                       │                            │
│            ▼                       ▼                            │
│  ┌──────────────────┐   ┌──────────────────┐                   │
│  │  Africa's Talking │   │   ClickPesa      │                   │
│  │  SMS + USSD       │   │   Mobile money   │                   │
│  └──────────────────┘   └──────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Monorepo structure

```
gridios/
├── minigrid-simulator/    ← Dev: 10 virtual meters publishing MQTT
│   ├── config/meters.js   ← Meter definitions + load profiles
│   ├── src/simulator.js   ← MQTT publisher
│   └── src/subscriber.js  ← MQTT subscriber (pipeline demo)
│
├── db/
│   └── 001_schema.sql     ← Full PostgreSQL schema (run in Supabase)
│
├── gridios-backend/       ← Node.js API + MQTT bridge
│   ├── src/server.js      ← Express entry point
│   ├── src/db.js          ← Supabase client
│   ├── src/mqtt/bridge.js ← MQTT → Supabase pipeline
│   ├── src/routes/        ← All REST API routes
│   └── src/services/      ← SMS, STS token generation
│
├── gridios-dashboard/     ← React operator dashboard
│   ├── src/App.jsx        ← Router + live MQTT context
│   └── src/pages/         ← Dashboard, Meters, Customers, Alerts, Analytics
│
└── gridios-agent/         ← Expo React Native field agent app
    ├── src/db/localDB.js  ← Offline SQLite database
    ├── src/services/sync.js ← Background sync
    └── src/screens/       ← Home, CollectPayment, Customers
```

---

## Setup: step by step

### 1. Supabase
1. Create project at supabase.com (free tier works)
2. Enable **TimescaleDB** extension: Dashboard → Database → Extensions → Search "timescale"
3. Run `db/001_schema.sql` in the SQL Editor
4. Copy Project URL and service role key

### 2. Africa's Talking
1. Sign up at africastalking.com
2. Create a sandbox app (free, no approval needed)
3. Get API key + username
4. Register a USSD code (sandbox: `*384*XXXX#`)

### 3. ClickPesa (Tanzania mobile money)
1. Sign up at clickpesa.com
2. Sandbox credentials available immediately
3. Set webhook URL to: `https://your-api-url/webhooks/clickpesa`

### 4. Backend
```bash
cd gridios-backend
npm install
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_KEY, AT_API_KEY, etc.
npm run dev
# API running on http://localhost:4000
```

### 5. Dashboard
```bash
cd gridios-dashboard
npm install
npm run dev
# Dashboard on http://localhost:5173
```

### 6. Simulator (dev only)
```bash
cd minigrid-simulator
npm install
node src/simulator.js     # Terminal 1 — publishes MQTT
node src/subscriber.js    # Terminal 2 — receives and logs
```

### 7. Agent app
```bash
cd gridios-agent
npm install
npx expo start
# Scan QR with Expo Go on Android/iOS
```

---

## Key design decisions

### Event-sourced billing
`billing_events` is append-only (immutable). The database trigger prevents UPDATE and DELETE. Customer balance is a materialized cache, recalculated from event log on demand via `recalculate_balance()`.

### TimescaleDB hypertable
`meter_readings` is a TimescaleDB hypertable partitioned weekly. 96 readings/day × 10 meters = 960 rows/day locally. At 1,000 meters: 96,000 rows/day — still fast with TimescaleDB continuous aggregates.

### Offline-first agent app
Agent SQLite (expo-sqlite) stores payments locally. Background sync uploads when online. Pre-generated token vault enables offline token issuance without connectivity.

### Multi-tenant RLS
Row-Level Security enforces data isolation at the database layer. Each operator sees only their data — no application-level filtering required.

### USSD in Swahili
All USSD menus are in Kiswahili — the language rural customers in Tanzania use. English fallback available via customer.language field.

---

## STS token production checklist

- [ ] Apply to STS Association (sts.org.za) — 3–6 months
- [ ] Obtain SGC (Supply Group Code) + TID keys
- [ ] Replace `generateStsToken()` in `services/sts.js` with licensed vending call
- [ ] Test with physical Hexing/SparkMeter meters
- [ ] TID Rollover compliance (November 2024 event) — use meters with firmware ≥ 2.3

---

## Deployment (production)

| Service         | Platform              | Cost/month |
|----------------|-----------------------|------------|
| Backend API     | Railway.app           | $5         |
| Dashboard       | Vercel (free tier)    | $0         |
| Database        | Supabase Pro          | $25        |
| MQTT (prod)     | HiveMQ Cloud free     | $0         |
| SMS/USSD        | Africa's Talking      | Pay/use    |
| Mobile money    | ClickPesa             | 1% per txn |
| **Total fixed** |                       | **~$30/mo**|

---

## Revenue model reminder

| Stream                  | Rate                   | 2,000 meters |
|------------------------|------------------------|--------------|
| SaaS meter fees         | $0.25/meter/month      | $500/month   |
| Implementation fees     | $1,000/site avg        | $10,000 one-time |
| Payment processing      | 0.5% on collections    | ~$150/month  |
| Carbon credit module    | $75/site/year          | $750/year    |
