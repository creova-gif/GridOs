# 🎮 GridOS Local Simulator Guide

Your dashboard now includes a **built-in meter simulator** with 10 virtual meters and realistic power consumption patterns!

---

## 🚀 Quick Start

### Enable the Simulator

The simulator is **already enabled** by default! Just start the dev server:

```bash
npm run dev
```

Visit http://localhost:5173 and you'll see:
- ✅ 10 meters with live data
- ✅ Real-time power consumption
- ✅ Balance depletion
- ✅ Automatic alerts
- ✅ Revenue tracking

---

## 🔧 Configuration

### Toggle Simulator On/Off

Edit `.env` file:

```env
# Enable simulator (no MQTT needed)
VITE_USE_LOCAL_SIMULATOR=true

# Disable simulator (use real MQTT)
VITE_USE_LOCAL_SIMULATOR=false
```

After changing, restart the dev server.

---

## 📊 What's Simulated

### 10 Virtual Meters

| Meter | Customer | Type | Profile | Balance |
|-------|----------|------|---------|---------|
| MTR-001 | Amina Hassan | Residential | Low (5-50W) | TZS 5,200 |
| MTR-002 | Joseph Mwangi | Residential | Mid (10-150W) | TZS 12,800 |
| MTR-003 | Mama Pima Duka | Business | Shop (5-90W) | TZS 28,000 |
| MTR-004 | Baraka Fishing Co | Productive | Heavy (100-300W) | TZS 45,000 |
| MTR-005 | Grace Nyamweru | Residential | Low (5-50W) | TZS 800 ⚠️ |
| MTR-006 | St. Peter School | Productive | School (5-250W) | TZS 67,000 |
| MTR-007 | Ali Dispensary | Business | Clinic (40-100W) | TZS 32,000 |
| MTR-008 | Zawadi Restaurant | Business | Restaurant (5-300W) | TZS 19,500 |
| MTR-009 | Farida Tailoring | Business | Shop (5-90W) | TZS 7,200 |
| MTR-010 | Pastor Elias | Residential | Zero (0W) | TZS 0 ❌ |

### Realistic Behaviors

#### ⚡ Power Consumption
- Varies by **hour of day** (24-hour profiles)
- Different patterns for each customer type
- Random variation (±20%) for realism

**Example - Residential Low Profile:**
```
Hour:   0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16  17  18  19  20  21  22  23
Power:  5W  5W  5W  5W  5W  5W 10W 20W 15W 10W 10W 10W 15W 10W 10W 10W 15W 30W 40W 50W 45W 35W 20W 10W
                                                                               ^^^^^ Evening peak
```

**Restaurant Profile (Meal-time peaks):**
```
Hour:   0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16  17  18  19  20  21  22  23
Power:  5W  5W  5W  5W  5W100W200W250W150W 50W 40W200W250W200W 80W 50W 40W200W300W280W180W 80W 30W 10W
                         ^^^^^^^^ Breakfast     ^^^^^^^^ Lunch           ^^^^^^^^ Dinner
```

#### 💰 Balance Depletion

Balances decrease based on actual consumption:

**Calculation:**
```typescript
kWh consumed = (power_watts × 3 seconds) / 3,600,000
cost = kWh × tariff_per_kWh
balance = balance - cost
```

**Tariffs:**
- Residential: TZS 1,710/kWh
- Business: TZS 1,560/kWh
- Productive: TZS 1,310/kWh

**Example:**
```
Customer: Joseph Mwangi (Residential, MTR-002)
Current power: 120W
Tick duration: 3 seconds
kWh consumed: (120 × 3) / 3,600,000 = 0.0001 kWh
Cost: 0.0001 × 1,710 = TZS 0.171
New balance: 12,800 - 0.171 = 12,799.829
```

After ~1 hour at 120W:
```
60 minutes × 20 ticks/min = 1,200 ticks
Total cost: 0.171 × 1,200 = TZS 205.20
Balance after 1 hour: 12,800 - 205.20 = TZS 12,594.80
```

#### 🔴 Auto-Disconnect

When balance hits **TZS 0**:
- ❌ Power consumption = 0W
- ❌ Meter marked as disconnected
- 🔔 Alert generated: "Customer disconnected — zero balance"
- 📊 Shows in "Zero balance" KPI

**Watch MTR-005 (Grace) and MTR-010 (Pastor Elias):**
- Grace starts with only TZS 800 → will disconnect within ~2 hours
- Pastor Elias already at TZS 0 → permanently off

#### 🔔 Automatic Alerts

**Low Credit Warning:**
```
Trigger: Balance < TZS 3,000
Severity: Medium (yellow dot)
Message: "Grace Nyamweru low credit: TZS 784"
```

**Disconnection Alert:**
```
Trigger: Balance reaches 0
Severity: High (orange dot)
Message: "Grace Nyamweru disconnected — zero balance"
```

**Tamper Detection:**
```
Trigger: Random (0.3% chance per tick)
Severity: Critical (red dot)
Message: "Tamper detected — MTR-005 (Grace Nyamweru)"
```

#### 📉 Voltage Variation

Voltage drops under heavy load:

```typescript
if (power > 200W) {
  voltage = ~218V (±3%)  // Heavy load
} else {
  voltage = ~230V (±1.5%)  // Normal
}
```

**Why?** Simulates real-world voltage drop when many customers draw power simultaneously.

#### 📶 Signal Strength

Realistic RSSI (Received Signal Strength Indicator):

```
Average: -70 dBm (±15%)
Range: -80 dBm to -60 dBm
```

- Better than -60 dBm: Excellent
- -60 to -70 dBm: Good
- -70 to -80 dBm: Fair
- Worse than -80 dBm: Poor

---

## 📊 Dashboard Features

### Live KPI Cards

**Connected Meters:**
```
Shows: 9/10 (Pastor Elias disconnected)
Color: Green if ≥8, Yellow if 6-7, Red if <6
```

**Total Load:**
```
Shows: Current total watts (e.g., "1,234W")
Sub: Utilization % (e.g., "2.5% of 50kW")
```

**Zero Balance:**
```
Shows: Number of disconnected meters
Color: Red if >0, Green if 0
Alert: Red border if any disconnected
```

**Revenue Today:**
```
Shows: Cumulative earnings (e.g., "TZS 12,450")
Updates: Every tick as customers consume power
```

### Load Chart

Rolling 30-point live chart:
- Updates every second
- Shows total site load in watts
- Gradient fill for visual appeal
- No animation (prevents key warnings)

### Meter Feed Grid

10 tiles showing each meter:
- Meter ID and customer name
- Current power or "OFF"
- Current balance with color coding:
  - 🟢 Green: Balance ≥ TZS 3,000
  - 🟡 Yellow: Balance TZS 1-2,999
  - 🔴 Red: Balance TZS 0
- Border highlights:
  - Red border: Disconnected
  - Amber border: Tamper detected

### Alert Stream

Live alert feed (right side):
- Latest 5 alerts shown
- Color-coded dots:
  - 🔴 Critical (red)
  - 🟠 High (orange)
  - 🟡 Medium (yellow)
- Auto-updates as new alerts arrive
- Maximum 20 alerts kept in memory

---

## 🧪 Testing Scenarios

### Scenario 1: Watch a Meter Disconnect

**Target:** MTR-005 (Grace Nyamweru)

```
Starting balance: TZS 800
Average consumption: ~15W (low profile, daytime)
Estimated time to zero: ~2-3 hours real-time

What to watch:
1. Balance drops slowly on Meters page
2. Low credit alert appears when < TZS 3,000
3. Power consumption continues normally
4. Balance hits TZS 0
5. Disconnection alert fires
6. Meter tile gets red border
7. Power drops to 0W
8. "Zero balance" KPI increments
9. "Connected meters" KPI decrements
```

**Speed it up:**
- Wait for evening (7-9 PM) when consumption peaks at 50W
- Grace will disconnect faster

### Scenario 2: Tamper Detection

**Watch all meters:**

```
Chance: 0.3% per tick (every second)
Expected: ~1 tamper every 5-10 minutes

What to watch:
1. Random meter gets flagged
2. Critical alert appears (red dot)
3. Meter tile gets amber border
4. "Tamper" badge on Meters page
5. Alert persists until cleared
```

### Scenario 3: Peak Load Hours

**Time:** 7-9 PM (19:00-21:00)

```
What happens:
- Residential meters hit peak consumption
- Restaurant serving dinner (300W peak)
- School is idle (5W)
- Clinic running steady (60-80W)

Watch:
1. Total load increases dramatically
2. Load chart shows spike
3. Utilization % rises
4. Revenue accumulates faster
5. Multiple meters hit low credit threshold
6. Voltage drops slightly under load
```

### Scenario 4: Off-Peak Hours

**Time:** 1-5 AM (01:00-05:00)

```
What happens:
- Most residential asleep (5W standby)
- Restaurant closed (5W)
- School off (5W)
- Clinic running 24/7 (40W)
- Heavy industry still operating (120-200W)

Watch:
1. Total load drops to minimum
2. Only essential loads remain
3. Balances deplete slowly
4. Utilization % low (1-2%)
```

---

## 🔧 Customization

### Add More Meters

Edit `src/app/utils/localSimulator.ts`:

```typescript
export const METERS = [
  // Existing meters...
  {
    id: 'MTR-011',
    name: 'Your Customer',
    type: 'residential', // or 'business', 'productive'
    balance: 15000,
    profile: 'mid', // or 'low', 'biz', 'heavy', 'school', 'clinic', 'rest'
    brand: 'Hexing'
  },
];
```

### Create Custom Consumption Profile

```typescript
export const PROFILES: Record<string, number[]> = {
  // ... existing profiles ...
  
  // Your custom 24-hour profile (watts per hour)
  custom: [
    5, 5, 5, 5, 5, 5,        // 00:00-05:59: Sleep/off
    10, 20, 30, 40, 50, 60,  // 06:00-11:59: Morning ramp-up
    70, 80, 90, 80, 70, 60,  // 12:00-17:59: Afternoon peak
    50, 40, 30, 20, 10, 5    // 18:00-23:59: Evening wind-down
  ],
};
```

### Adjust Tariffs

```typescript
export const TARIFF: Record<string, number> = {
  residential: 1710,  // TZS/kWh
  business: 1560,
  productive: 1310,
  
  // Add custom tariff
  vip: 1200,  // Discounted rate for VIP customers
};
```

### Change Update Frequency

In `src/app/contexts/LiveDataContext.tsx`:

```typescript
const intervalId = setInterval(() => {
  // Simulator tick
}, 3000); // Change from 1000ms to 3000ms
```

**Options:**
- `1000` = 1 second (current, fast demo)
- `3000` = 3 seconds (matches production)
- `5000` = 5 seconds (slower, easier to watch)

---

## 📝 How It Works

### Architecture

```
LiveDataContext.tsx
   │
   ├─► Checks VITE_USE_LOCAL_SIMULATOR env var
   │
   ├─► If TRUE:
   │     ├─► Create simulator with 10 meters
   │     ├─► setInterval every 1 second
   │     ├─► tickSimulator() updates state
   │     ├─► convertToLiveDataFormat()
   │     └─► Update React state
   │
   └─► If FALSE:
         ├─► Connect to MQTT broker
         └─► Subscribe to live topics
```

### Data Flow

```
localSimulator.ts                LiveDataContext.tsx              Dashboard.tsx
────────────────                ────────────────────              ──────────────

createSimulator()
  └─► Initial state          ──┬───────────────────────────►  meterStatus
                               │                               siteSummary
                               │                               recentAlerts
tickSimulator(state)           │
  ├─► Calculate power          │
  ├─► Deduct balance           │
  ├─► Check for alerts         │
  └─► Return new state      ───┘

convertToLiveDataFormat()
  ├─► meterStatus object
  ├─► siteSummary stats
  └─► recentAlerts array
```

### Tick Logic

Every 1 second:

```typescript
1. For each meter:
   a. Get current hour (0-23)
   b. Look up expected power from profile
   c. Add random variation (±20%)
   d. If balance > 0: consume power
   e. Calculate kWh consumed (3 seconds)
   f. Calculate cost (kWh × tariff)
   g. Deduct from balance
   h. Update voltage based on load
   i. Update signal strength (random)
   j. Random tamper check (0.3%)

2. Check for alert conditions:
   a. Balance just hit zero? → Disconnection alert
   b. Balance < 3000? → Low credit alert
   c. Tamper detected? → Tamper alert

3. Update totals:
   a. Sum all power → total load
   b. Add earned revenue → revenue today
   c. Count disconnected meters

4. Update UI:
   a. Push to load history (rolling 20 points)
   b. Update all React state
   c. Re-render components
```

---

## 🎓 Educational Use

### Learning Outcomes

**For developers:**
- ✅ Real-time state management
- ✅ Interval-based simulation
- ✅ Alert generation logic
- ✅ Data transformation patterns

**For operators:**
- ✅ Understanding consumption patterns
- ✅ Revenue calculation mechanics
- ✅ Alert thresholds and triggers
- ✅ Load management scenarios

**For demonstrations:**
- ✅ No backend required
- ✅ Predictable scenarios
- ✅ Fast testing cycles
- ✅ Self-contained demo

---

## 🚀 Deployment

### Deploying with Simulator Enabled

When publishing from Figma Make, the simulator will work automatically!

**Why?** 
- No external dependencies (MQTT, database)
- All logic runs client-side
- Data generated on-the-fly

**Perfect for:**
- ✅ Demos and presentations
- ✅ User training
- ✅ System previews
- ✅ Development testing

### Switching to Production

When ready for real meters:

1. Edit `.env`:
```env
VITE_USE_LOCAL_SIMULATOR=false
VITE_MQTT_BROKER=wss://your-production-broker.hivemq.cloud:8884/mqtt
```

2. Redeploy from Figma Make

3. Start publishing real meter data to MQTT

---

## 📊 Expected Behavior Timeline

**First 5 minutes:**
- All meters show initial data
- Balances start decreasing
- Load chart starts populating
- 1-2 alerts appear (low credit for Grace)

**After 30 minutes:**
- Grace (MTR-005) may disconnect (if evening hours)
- 3-5 alerts accumulated
- Load chart fully populated (30 points)
- Revenue > TZS 500

**After 1 hour:**
- Grace definitely disconnected
- Possible tamper alert
- Load chart shows hourly pattern
- Revenue > TZS 1,000

**After 2 hours:**
- Multiple balances showing yellow (< TZS 3,000)
- 5-10 total alerts
- Clear consumption patterns visible
- Revenue > TZS 2,000

---

## 🎉 You're Ready!

Your GridOS dashboard now has:
- ✅ 10 realistic virtual meters
- ✅ Live power consumption simulation
- ✅ Automatic balance depletion
- ✅ Alert generation
- ✅ Revenue tracking
- ✅ Real-time charts

**No backend required. No MQTT needed. Just works!** 🚀

---

**Built with ⚡ for mini-grid operators in East Africa**
