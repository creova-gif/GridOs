# 🚀 GridOS Dashboard - Production Deployment Guide

Complete deployment guide for the GridOS mini-grid monitoring platform.

---

## 📋 Deployment Checklist

- [ ] Supabase project created and configured
- [ ] Database schema deployed
- [ ] Backend API deployed and running
- [ ] MQTT broker configured
- [ ] Environment variables set
- [ ] Frontend built and deployed
- [ ] DNS configured (optional)
- [ ] SSL certificates active

---

## 🏗️ Architecture Overview

```
┌──────────────────┐
│   CloudFlare CDN │ (Optional)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐      ┌─────────────────┐      ┌──────────────────┐
│  Vercel/Netlify  │────→ │  Railway/Render │────→ │    Supabase      │
│  (Frontend)      │      │  (Backend API)  │      │  (PostgreSQL)    │
└──────────────────┘      └────────┬────────┘      └──────────────────┘
         │                         │
         │                         │
         └────────┬────────────────┘
                  │
                  ▼
         ┌─────────────────┐
         │  HiveMQ Cloud   │
         │  (MQTT Broker)  │
         └─────────────────┘
                  ▲
                  │
         ┌────────┴────────┐
         │   Simulators    │
         │  (Dev/Testing)  │
         └─────────────────┘
```

---

## 1️⃣ Supabase Deployment

### Create Project

1. Go to [supabase.com](https://supabase.com)
2. Click **"New Project"**
3. Choose:
   - **Organization**: Create or select existing
   - **Name**: `gridios-production`
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Choose closest to your users (e.g., Frankfurt for East Africa)
   - **Plan**: Free tier works for MVP, Pro for production

### Enable TimescaleDB

1. Go to **Database** → **Extensions**
2. Search for **"timescaledb"**
3. Click **Enable**

### Deploy Schema

1. Go to **SQL Editor**
2. Click **"New Query"**
3. Copy entire contents of `db/001_schema.sql`
4. Paste and click **Run**
5. Verify tables created: **Table Editor** → Check for `operators`, `sites`, `meters`, etc.

### Get API Credentials

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: (for backend only, keep secret!)

### Configure Row-Level Security (Production)

For multi-tenant isolation:

1. **Enable Auth** (if using user authentication):
   - Go to **Authentication** → **Settings**
   - Configure providers (Email, Google, etc.)

2. **Set operator_id in JWT**:
   - Create custom claims via Supabase Edge Functions or backend
   - Add `operator_id` to JWT payload

3. **RLS Policies** are already in schema:
   ```sql
   CREATE POLICY operator_isolation ON sites
     USING (operator_id = (auth.jwt() ->> 'operator_id')::UUID);
   ```

---

## 2️⃣ Backend API Deployment

### Option A: Railway.app (Recommended)

**Why Railway?**
- Auto-deploys from GitHub
- Built-in PostgreSQL (if needed)
- Simple env var management
- $5-10/month for basic plan

**Steps:**

1. **Sign up** at [railway.app](https://railway.app)

2. **New Project** → **Deploy from GitHub**
   - Connect your `gridios` repo
   - Select `gridios-backend/` as root directory

3. **Configure Build Settings**:
   ```
   Build Command: npm install
   Start Command: npm start
   ```

4. **Set Environment Variables**:
   ```
   NODE_ENV=production
   PORT=4000
   
   # Supabase
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (service_role!)
   
   # MQTT
   MQTT_BROKER=wss://your-hivemq-cluster.hivemq.cloud:8884/mqtt
   MQTT_TOPIC_PREFIX=gridios
   
   # Africa's Talking
   AT_USERNAME=your_username
   AT_API_KEY=your_api_key
   AT_SENDER_ID=GRIDIOS
   
   # ClickPesa (Tanzania mobile money)
   CLICKPESA_API_KEY=your_api_key
   CLICKPESA_API_USER=your_user
   
   # Frontend URL (for CORS)
   FRONTEND_URL=https://your-dashboard.vercel.app
   ```

5. **Deploy**:
   - Railway auto-deploys on git push
   - Get public URL: `https://gridios-backend.railway.app`

6. **Verify**:
   ```bash
   curl https://gridios-backend.railway.app/health
   ```

### Option B: Render.com

1. **New Web Service** → Connect GitHub repo
2. **Settings**:
   ```
   Build Command: npm install
   Start Command: npm start
   ```
3. Set same environment variables as above
4. Deploy

### Option C: Fly.io

1. Install Fly CLI: `brew install flyctl`
2. Login: `fly auth login`
3. In `gridios-backend/`:
   ```bash
   fly launch
   fly secrets set SUPABASE_URL=... SUPABASE_SERVICE_KEY=...
   fly deploy
   ```

---

## 3️⃣ MQTT Broker Setup

### Option A: HiveMQ Cloud (Recommended for Production)

**Free Tier**: 100 connections, 10 GB data transfer/month

1. **Sign up** at [hivemq.com/cloud](https://www.hivemq.com/cloud/)

2. **Create Cluster**:
   - Name: `gridios-prod`
   - Cloud: AWS / Google Cloud
   - Region: Closest to your backend

3. **Get Connection Details**:
   ```
   Host: your-cluster.hivemq.cloud
   Port: 8883 (secure WebSocket)
   URL: wss://your-cluster.hivemq.cloud:8884/mqtt
   ```

4. **Create Credentials**:
   - Username: `gridios-backend`
   - Password: Generate strong password
   - Permissions: Publish & Subscribe to `gridios/#`

5. **Update Environment Variables**:
   - Backend: `MQTT_BROKER=wss://your-cluster.hivemq.cloud:8884/mqtt`
   - Frontend: `VITE_MQTT_BROKER=wss://your-cluster.hivemq.cloud:8884/mqtt`

### Option B: Public Broker (Development Only)

Use HiveMQ public broker:
```
MQTT_BROKER=wss://broker.hivemq.com:8884/mqtt
```

⚠️ **Warning**: No authentication, anyone can publish/subscribe. Use only for testing!

### Option C: Self-Hosted Mosquitto

Using Docker:

```bash
docker run -d \
  --name mosquitto \
  -p 1883:1883 \
  -p 8883:8883 \
  -v ./mosquitto.conf:/mosquitto/config/mosquitto.conf \
  eclipse-mosquitto
```

---

## 4️⃣ Frontend Deployment

### Option A: Vercel (Recommended)

**Why Vercel?**
- Free tier with excellent performance
- Auto-deploys from GitHub
- Built-in CDN
- SSL included

**Steps:**

1. **Sign up** at [vercel.com](https://vercel.com)

2. **Import Project**:
   - New Project → Import from GitHub
   - Select your `gridios` repo
   - Root directory: `./` (or wherever this dashboard is)

3. **Configure Build**:
   ```
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Set Environment Variables**:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_API_URL=https://gridios-backend.railway.app
   VITE_MQTT_BROKER=wss://your-cluster.hivemq.cloud:8884/mqtt
   VITE_MQTT_TOPIC_PREFIX=gridios
   VITE_SITE_ID=site-tz-001
   VITE_OPERATOR_ID=op-jumeme-001
   ```

5. **Deploy**:
   - Click **Deploy**
   - Get URL: `https://gridios-dashboard.vercel.app`

6. **Custom Domain** (Optional):
   - Go to **Settings** → **Domains**
   - Add your domain: `dashboard.gridios.io`
   - Configure DNS as instructed

### Option B: Netlify

Similar to Vercel:

1. **New Site** → Import from Git
2. **Build settings**:
   ```
   Build command: npm run build
   Publish directory: dist
   ```
3. Set environment variables (same as Vercel)
4. Deploy

### Option C: Cloudflare Pages

1. Connect GitHub repo
2. Build settings:
   ```
   Framework: Vite
   Build command: npm run build
   Output: dist
   ```
3. Set env vars
4. Deploy

---

## 5️⃣ Post-Deployment Configuration

### Update CORS in Backend

In `gridios-backend/src/server.js`:

```javascript
app.use(cors({
  origin: [
    'https://gridios-dashboard.vercel.app',
    'https://dashboard.gridios.io',  // your custom domain
    'http://localhost:5173'  // keep for local dev
  ]
}));
```

Redeploy backend after change.

### Configure Webhooks

**Africa's Talking USSD Callback**:
- URL: `https://gridios-backend.railway.app/ussd`

**ClickPesa Payment Webhook**:
- URL: `https://gridios-backend.railway.app/webhooks/clickpesa`

### Test End-to-End

1. **Open Dashboard**: `https://gridios-dashboard.vercel.app`
2. **Check MQTT Connection**: Should show "Live data" indicator
3. **Start Simulator** (or real meters):
   ```bash
   node src/simulator.js
   ```
4. **Verify**:
   - Dashboard shows live meter readings
   - Alerts appear in real-time
   - Backend logs show MQTT messages being processed
   - Supabase shows new rows in `meter_readings` table

---

## 6️⃣ Monitoring & Maintenance

### Application Monitoring

**Sentry** (Error Tracking):
```bash
npm install @sentry/react
```

In `src/app/App.tsx`:
```tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://xxx@sentry.io/xxx",
  environment: import.meta.env.MODE,
});
```

**PostHog** (Analytics):
```bash
npm install posthog-js
```

### Uptime Monitoring

- **UptimeRobot** (free): Monitor dashboard and API endpoints
- **Checkly**: API monitoring with alerts
- **Better Uptime**: Status page + monitoring

### Database Backups

**Supabase** (automatic):
- Free tier: Daily backups, 7-day retention
- Pro tier: Point-in-time recovery

**Manual Backup**:
```bash
# From Supabase dashboard: Database → Backups → Download
```

### Log Monitoring

**Railway/Render**:
- Built-in log viewer
- Export logs to Logtail or Papertrail

**Supabase**:
- Real-time logs in dashboard: Logs → Postgres

---

## 7️⃣ Scaling Considerations

### Frontend

- **CDN**: Already included with Vercel/Netlify/Cloudflare
- **Image Optimization**: Use Vercel Image Optimization for logos/photos
- **Code Splitting**: Vite does this automatically

### Backend

**Horizontal Scaling**:
- Railway: Increase replicas in settings
- Add load balancer if needed

**Vertical Scaling**:
- Upgrade server resources (CPU/RAM)

### Database

**Supabase Scaling**:
- Free tier: 500 MB database, 2 GB file storage
- Pro tier: 8 GB database, 100 GB storage
- Team/Enterprise: Unlimited (pay per use)

**TimescaleDB Optimization**:
- Continuous aggregates already configured
- Add data retention policies:
  ```sql
  SELECT add_retention_policy('meter_readings', INTERVAL '90 days');
  ```

### MQTT Broker

**HiveMQ Cloud Scaling**:
- Starter: 100 connections
- Professional: 1,000 connections
- Enterprise: Custom

---

## 8️⃣ Security Hardening

### Frontend

- [ ] **Content Security Policy** (CSP):
  ```html
  <meta http-equiv="Content-Security-Policy" 
        content="default-src 'self'; connect-src 'self' https://*.supabase.co wss://*.hivemq.cloud">
  ```

- [ ] **Environment Variables**: Never commit `.env` to git
- [ ] **API Keys**: Use Vercel environment variables (not in code)

### Backend

- [ ] **Rate Limiting**: Already configured (300 req/min)
- [ ] **Helmet.js**: Already configured (security headers)
- [ ] **API Authentication**: Add JWT validation
- [ ] **Secrets Management**: Use Railway/Render secrets (not `.env` file)

### Database

- [ ] **RLS Enabled**: Already configured in schema
- [ ] **Service Role Key**: Keep secret, only use in backend
- [ ] **Anon Key**: Safe to use in frontend (RLS enforces access)

### MQTT

- [ ] **Authentication**: Use username/password for broker
- [ ] **TLS/SSL**: Always use `wss://` (secure WebSocket)
- [ ] **Access Control**: Limit topic permissions per client

---

## 9️⃣ Cost Estimate (Monthly)

| Service           | Tier        | Cost      |
|-------------------|-------------|-----------|
| Vercel (Frontend) | Hobby       | **$0**    |
| Railway (Backend) | Hobby       | **$5**    |
| Supabase          | Pro         | **$25**   |
| HiveMQ Cloud      | Starter     | **$0**    |
| Africa's Talking | Pay-as-you-go | ~$10    |
| ClickPesa         | 1% per txn  | Variable  |
| **Total Fixed**   |             | **$30-40/month** |

**Scaling Up** (1,000 meters, 10,000 customers):
- Supabase: $25-50/month
- Backend: $10-20/month (2 instances)
- MQTT: $29/month (Professional tier)
- **Total**: ~$70-100/month

---

## 🔟 Rollback Plan

If something breaks in production:

### Frontend
```bash
# Vercel: Deployments → Previous deployment → Promote to Production
```

### Backend
```bash
# Railway: Deployments → Select previous → Redeploy
```

### Database
```bash
# Supabase: Database → Backups → Restore
```

⚠️ **Test rollback procedure in staging first!**

---

## ✅ Go-Live Checklist

- [ ] All services deployed and running
- [ ] Health checks passing
- [ ] MQTT connection established
- [ ] Sample data flowing through system
- [ ] Alerts triggering correctly
- [ ] SMS notifications working
- [ ] USSD menu functional
- [ ] Monitoring/logging configured
- [ ] Backups verified
- [ ] Team trained on dashboard
- [ ] Documentation updated
- [ ] Support contacts listed

---

## 📞 Support Contacts

**Production Issues**:
- Vercel Support: [vercel.com/support](https://vercel.com/support)
- Railway Support: [railway.app/help](https://railway.app/help)
- Supabase Support: [supabase.com/support](https://supabase.com/support)

**Service Status Pages**:
- Vercel: [vercel-status.com](https://vercel-status.com)
- Supabase: [status.supabase.com](https://status.supabase.com)
- HiveMQ: [status.hivemq.com](https://status.hivemq.com)

---

## 🎉 You're Live!

Your GridOS dashboard is now running in production! 

Monitor the system for the first few days and adjust as needed.

**Next Steps**:
- Add real meters/customers to database
- Configure custom alerts
- Set up automated reports
- Train field agents on the system

---

**Built with ⚡ for mini-grid operators in East Africa**
