# 🚀 START HERE - GridOS Dashboard

Welcome to the **GridOS Mini-Grid Monitoring Dashboard**!

This is your **complete production-ready system** for monitoring solar mini-grids in real-time.

---

## 🎯 Choose Your Path

### 🏃 I Want to Start Immediately (5 minutes)

**Go to**: [QUICK-START.md](./QUICK-START.md)

Perfect if you just want to get it running NOW.

---

### 📖 I Want to Understand the Full Setup (15 minutes)

**Go to**: [SETUP.md](./SETUP.md)

Complete guide covering:
- Supabase database setup
- Backend API configuration
- MQTT broker setup
- Environment variables
- Testing procedures

---

### 🚀 I'm Ready to Deploy to Production (30 minutes)

**Go to**: [DEPLOYMENT.md](./DEPLOYMENT.md)

Production deployment covering:
- Vercel frontend deployment
- Railway backend deployment
- HiveMQ Cloud MQTT
- Environment configuration
- SSL/DNS setup
- Monitoring

---

### ✅ I Want to Verify Everything Works

**Go to**: [INTEGRATION-CHECKLIST.md](./INTEGRATION-CHECKLIST.md)

Step-by-step validation of:
- Database connection
- Backend API
- MQTT broker
- Live data flow
- End-to-end testing

---

### 📚 I Want to Learn What Was Built

**Go to**: [WHAT-WE-BUILT.md](./WHAT-WE-BUILT.md)

Complete overview of:
- All features delivered
- File structure
- Integration points
- Technologies used
- Architecture decisions

---

### 🤔 I Just Want an Overview

**Go to**: [README.md](./README.md)

High-level overview:
- Features
- Tech stack
- Quick commands
- Architecture diagram

---

## 🎯 Quick Decision Tree

```
┌─────────────────────────────────────────┐
│ What do you want to do RIGHT NOW?      │
└──────────────┬──────────────────────────┘
               │
      ┌────────┴────────┐
      │                 │
      ▼                 ▼
  Just run it      Set it up properly
      │                 │
      │                 ▼
      │         [SETUP.md]
      │         15 minutes
      │         All services
      │                 │
      ▼                 │
  [QUICK-START.md]     │
  5 minutes            │
  Basic setup          │
      │                 │
      └────────┬────────┘
               │
               ▼
       Works locally?
               │
       ┌───────┴────────┐
       │                │
      Yes              No
       │                │
       ▼                ▼
  Deploy it?    [INTEGRATION-CHECKLIST.md]
       │         Debug with checklist
       │                │
       ▼                │
  [DEPLOYMENT.md]      │
  Production ready     │
       │                │
       └────────┬───────┘
                │
                ▼
         🎉 SUCCESS! 🎉
```

---

## 🔥 Fastest Path to Success

### Option A: "I trust the setup, just show me"

```bash
# 1. Install
npm install

# 2. Configure (edit .env with your Supabase credentials)
nano .env

# 3. Run
npm run dev

# 4. In another terminal, start simulator
cd ../minigrid-simulator
node src/simulator.js
```

**Time**: 2 minutes (if you have Supabase ready)

---

### Option B: "I want to do this right"

1. Read [QUICK-START.md](./QUICK-START.md) (5 min)
2. Set up Supabase (5 min)
3. Configure `.env` (1 min)
4. Run dashboard (1 min)
5. Validate with [INTEGRATION-CHECKLIST.md](./INTEGRATION-CHECKLIST.md) (10 min)

**Time**: 22 minutes for bulletproof setup

---

### Option C: "I'm going to production today"

1. Do Option B above
2. Set up backend API (follow backend README)
3. Configure production MQTT broker (HiveMQ Cloud)
4. Deploy following [DEPLOYMENT.md](./DEPLOYMENT.md)
5. Test end-to-end
6. Go live!

**Time**: 1-2 hours for production deployment

---

## 📋 Prerequisites Checklist

Before you start, make sure you have:

- [ ] **Node.js 18+** installed ([download](https://nodejs.org))
- [ ] **Code editor** (VS Code recommended)
- [ ] **Supabase account** ([sign up free](https://supabase.com))
- [ ] **10 minutes** of focused time
- [ ] **Terminal/command line** knowledge

**Optional but recommended**:
- [ ] Backend API repo cloned
- [ ] Meter simulator ready
- [ ] MQTT broker access (HiveMQ free works)

---

## 🆘 Help! Something's Not Working

### Quick Fixes

**Dashboard won't start**
```bash
rm -rf node_modules
npm install
npm run dev
```

**"No data showing"**
- Check if simulator is running
- Check MQTT broker URL in `.env`
- Open browser console for errors

**"Supabase errors"**
- Verify credentials in `.env`
- Check schema is deployed (Supabase SQL Editor)
- Ensure TimescaleDB extension enabled

### Full Troubleshooting

See [INTEGRATION-CHECKLIST.md](./INTEGRATION-CHECKLIST.md) → Troubleshooting section

---

## 📚 All Documentation Files

| File | Purpose | Time | When to Use |
|------|---------|------|-------------|
| **START-HERE.md** | This file! Navigation | 2 min | First time here |
| **QUICK-START.md** | Fastest setup | 5 min | Just want it running |
| **SETUP.md** | Complete setup guide | 15 min | Proper setup |
| **DEPLOYMENT.md** | Production deployment | 30 min | Going live |
| **INTEGRATION-CHECKLIST.md** | Validation steps | 20 min | Debugging / QA |
| **WHAT-WE-BUILT.md** | Technical overview | 10 min | Understanding system |
| **README.md** | Project overview | 5 min | General info |

---

## 🎯 Success Criteria

You'll know it's working when:

✅ Dashboard loads at `http://localhost:5173`  
✅ Sidebar shows green "Live data" indicator  
✅ Meter cards appear on Dashboard page  
✅ Numbers update every 15 seconds  
✅ Charts show real-time data  
✅ Alerts stream in Alerts page  
✅ No errors in browser console  

---

## 🎉 What You're About to Build

A **complete monitoring platform** with:

- 📊 **Live Dashboard** - Real-time site overview
- ⚡ **Meter Monitoring** - Individual meter details
- 🔔 **Alert System** - Instant notifications
- 📈 **Analytics** - Revenue and energy tracking
- 🌐 **MQTT Integration** - Live data streaming
- 🗄️ **Supabase Backend** - Time-series storage
- 🎨 **Professional UI** - Dark theme, responsive

**Used by mini-grid operators across East Africa to power rural communities.**

---

## 🚀 Ready?

Pick your path above and let's get started!

**Recommended**: Start with [QUICK-START.md](./QUICK-START.md) ⚡

---

## 💬 Questions?

- **Setup issues**: Check [INTEGRATION-CHECKLIST.md](./INTEGRATION-CHECKLIST.md)
- **Deployment help**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Understanding the code**: Read [WHAT-WE-BUILT.md](./WHAT-WE-BUILT.md)
- **API integration**: See [SETUP.md](./SETUP.md) → API section

---

**Built for sustainable energy access in Africa 🌍⚡**

Let's power communities together!
