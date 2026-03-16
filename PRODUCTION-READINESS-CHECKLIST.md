# ✅ GridOS Production Readiness Checklist

**Based on:** PRODUCT 5: Mini-Grid Management + Solar Billing SaaS Specification  
**Current Status:** Prototype → Production Gap Analysis  
**Target:** MVP v1.0 per specification

---

## 📋 CORE MVP FEATURES (v1.0)

### 1. Meter Registration & Device Management
- [ ] **Meter Registry Database**
  - [ ] PostgreSQL table: `meters` (id, serial_number, meter_type, site_id, customer_id, status, install_date)
  - [ ] Support meter types: SteamaCo Savi, SparkMeter Advantage, Hexing, Conlog
  - [ ] Device certificate management
  - [ ] Meter activation/deactivation workflow

- [ ] **Device Onboarding**
  - [ ] Admin UI: Register new meter form
  - [ ] API: `POST /api/meters/register`
  - [ ] Validation: Serial number uniqueness
  - [ ] Auto-generate AWS IoT device certificates

- [ ] **Load Limit Configuration**
  - [ ] Admin UI: Set max kW per meter
  - [ ] API: `PUT /api/meters/{id}/load-limit`
  - [ ] Push config to meter via MQTT

- [ ] **Firmware Management**
  - [ ] Track firmware versions per meter
  - [ ] OTA update mechanism (MQTT-based)
  - [ ] Rollback capability
  - [ ] Update logs

- [ ] **Tamper Detection**
  - [ ] Receive tamper events via MQTT
  - [ ] Generate alert on tamper
  - [ ] Log tamper history
  - [ ] Auto-notify operator via SMS

**Files to Create:**
```
/supabase/functions/server/meters/
  ├── registration.tsx
  ├── configuration.tsx
  ├── firmware-updater.tsx
  └── tamper-handler.tsx
```

---

### 2. PAYG Billing Engine (CRITICAL)

- [ ] **STS Token Generation**
  - [ ] Partner with STS-certified vendor OR
  - [ ] Implement IEC 62055-41 compliant generator
  - [ ] Support 20-digit token format
  - [ ] TID Rollover compliance (Nov 2024 standard)
  - [ ] Token encryption per meter serial

- [ ] **Credit/Debit Ledger**
  - [ ] PostgreSQL table: `customer_ledgers` (id, customer_id, transaction_type, amount_tzs, balance, timestamp)
  - [ ] Track all credit additions (payments)
  - [ ] Track all debits (consumption)
  - [ ] Real-time balance calculation
  - [ ] Balance threshold alerts (e.g., < TZS 1,000)

- [ ] **Tariff Configuration**
  - [ ] PostgreSQL table: `tariffs` (id, name, residential_rate, business_rate, productive_rate, currency)
  - [ ] Support per-customer-type rates
  - [ ] Time-of-use (TOU) pricing (v2.0)
  - [ ] Admin UI: Tariff management

- [ ] **Token Vending API**
  - [ ] API: `POST /api/tokens/generate`
  - [ ] Input: customer_id, amount_paid, payment_method
  - [ ] Output: 20-digit token, kWh credited
  - [ ] Log: Token generation history
  - [ ] Auto-dispatch via SMS

- [ ] **Automatic Disconnection**
  - [ ] Monitor balance = 0
  - [ ] Send disconnect command to meter (MQTT)
  - [ ] Log disconnection event
  - [ ] Notify customer via SMS

- [ ] **Reconnection on Payment**
  - [ ] Detect payment received
  - [ ] Generate token
  - [ ] Send reconnect command (MQTT)
  - [ ] Log reconnection event

**STS Requirements:**
- [ ] STS Association registration ($10K-$20K)
- [ ] Compliance testing (6-15 months)
- [ ] OR partner agreement with certified vendor

**Files to Create:**
```
/supabase/functions/server/billing/
  ├── sts-token-generator.tsx
  ├── tariff-engine.tsx
  ├── customer-ledger.tsx
  ├── disconnection-handler.tsx
  └── token-vending-api.tsx
```

**Database Schema:**
```sql
CREATE TABLE tariffs (
  id UUID PRIMARY KEY,
  name TEXT,
  residential_rate_tzs_per_kwh DECIMAL,
  business_rate_tzs_per_kwh DECIMAL,
  productive_rate_tzs_per_kwh DECIMAL,
  created_at TIMESTAMP
);

CREATE TABLE customer_ledgers (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  transaction_type TEXT, -- payment/consumption/adjustment
  amount_tzs DECIMAL,
  balance_after DECIMAL,
  token_id UUID REFERENCES tokens(id),
  created_at TIMESTAMP
);

CREATE TABLE tokens (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  token_20_digit TEXT,
  kwh_credited DECIMAL,
  amount_paid_tzs DECIMAL,
  payment_id UUID REFERENCES payments(id),
  status TEXT, -- generated/sent/used
  generated_at TIMESTAMP
);
```

---

### 3. Mobile Money Collection (CRITICAL)

#### Kenya - M-Pesa Daraja API
- [ ] **Setup**
  - [ ] Register Safaricom Daraja account
  - [ ] Get Consumer Key & Secret
  - [ ] Set up C2B shortcode
  - [ ] Register callback URLs

- [ ] **STK Push Implementation**
  - [ ] API: `POST /api/payments/mpesa/initiate`
  - [ ] Trigger STK Push on customer phone
  - [ ] Customer enters M-Pesa PIN
  - [ ] Receive payment callback

- [ ] **Webhook Handler**
  - [ ] API: `POST /api/webhooks/mpesa/callback`
  - [ ] Verify payment signature
  - [ ] Update payment status
  - [ ] Trigger token generation
  - [ ] Send token via SMS

#### Tanzania - ClickPesa (All Wallets)
- [ ] **Setup**
  - [ ] Register ClickPesa account
  - [ ] Get API credentials
  - [ ] Support: M-Pesa TZ, Airtel Money, Tigo Pesa, Halo Pesa

- [ ] **Bill Pay Integration**
  - [ ] Create customer bill references
  - [ ] Accept payments from all 4 wallets
  - [ ] 1% fee handling
  - [ ] Webhook for payment confirmation

#### Rwanda/Uganda - MTN MoMo
- [ ] **Setup**
  - [ ] Register MTN MoMo Developer account
  - [ ] Get API credentials (30 APIs available)
  - [ ] Support C2B, B2C, B2B

- [ ] **Collection API**
  - [ ] Request payment from customer
  - [ ] Customer approves on phone
  - [ ] Receive confirmation webhook

#### Payment Processing Logic
- [ ] **Unified Payment Handler**
  - [ ] API: `POST /api/payments/initiate`
  - [ ] Detect country/provider from phone number
  - [ ] Route to correct gateway
  - [ ] Store payment intent
  - [ ] Poll for confirmation (if no webhook)

- [ ] **Token Auto-Dispatch**
  - [ ] On payment success webhook:
    1. Update payment status → completed
    2. Credit customer ledger
    3. Generate STS token
    4. Send token via SMS
    5. Log transaction

- [ ] **Reconciliation**
  - [ ] Daily payment reconciliation report
  - [ ] Match gateway records vs. database
  - [ ] Flag discrepancies

**Files to Create:**
```
/supabase/functions/server/payments/
  ├── mpesa-daraja.tsx
  ├── clickpesa.tsx
  ├── mtn-momo.tsx
  ├── payment-initiator.tsx
  ├── webhook-handler.tsx
  └── token-dispatcher.tsx
```

**Database Schema:**
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  amount_tzs DECIMAL,
  payment_method TEXT, -- mpesa_ke/clickpesa_tz/mtn_rw
  phone_number TEXT,
  transaction_id TEXT UNIQUE,
  status TEXT, -- pending/completed/failed
  gateway_response JSONB,
  created_at TIMESTAMP,
  completed_at TIMESTAMP
);
```

**External Accounts Needed:**
- [ ] M-Pesa Daraja (developer.safaricom.co.ke)
- [ ] ClickPesa (clickpesa.com)
- [ ] MTN MoMo (momodeveloper.mtn.com)

**Budget per Spec:** $3,000–$8,000/year

---

### 4. MQTT Meter Data Ingestion (CRITICAL)

- [ ] **AWS IoT Core Setup**
  - [ ] Create AWS account
  - [ ] Enable IoT Core in af-south-1 (Cape Town)
  - [ ] Configure security policies
  - [ ] Set up thing registry

- [ ] **Device Certificates**
  - [ ] Generate X.509 certificates per meter
  - [ ] Provision to DCU on installation
  - [ ] Rotation policy (every 2 years)

- [ ] **MQTT Topics Structure**
  ```
  site/{siteId}/meter/{meterId}/readings
  site/{siteId}/meter/{meterId}/events
  site/{siteId}/meter/{meterId}/commands
  site/{siteId}/dcus/{dcuId}/status
  ```

- [ ] **Lambda Processing Pipeline**
  - [ ] Lambda: `meter-readings-processor`
    - Parse DLMS/COSEM or Modbus payloads
    - Extract: voltage, current, power, energy, balance
    - Store in DynamoDB (time-series)
    - Trigger alerts if thresholds exceeded

  - [ ] Lambda: `meter-events-processor`
    - Parse: tamper, low balance, disconnect events
    - Generate alerts
    - Update meter status
    - Send SMS notifications

  - [ ] Lambda: `meter-commands-handler`
    - Publish disconnect/reconnect commands
    - Push STS tokens to meter
    - Update firmware

- [ ] **Time-Series Storage**
  - [ ] DynamoDB table: `meter_readings`
    - Partition key: meter_id
    - Sort key: timestamp
    - TTL: 2 years
  - [ ] OR TimescaleDB (PostgreSQL extension)
    - Better for analytics
    - Continuous aggregates

- [ ] **Real-Time Dashboard Updates**
  - [ ] WebSocket connection from dashboard
  - [ ] Subscribe to meter updates
  - [ ] Push live data to UI
  - [ ] Replace local simulator

**Architecture:**
```
[Meter] → [DCU] → [GPRS] → [AWS IoT Core MQTT]
                                  ↓
                          [IoT Rules Engine]
                                  ↓
                    ┌─────────────┴─────────────┐
                    ↓                           ↓
            [Lambda: Readings]        [Lambda: Events]
                    ↓                           ↓
           [DynamoDB/Timescale]           [Alerts Queue]
                    ↓                           ↓
              [REST API]                  [SMS Sender]
                    ↓
            [Dashboard WebSocket]
```

**Files to Create:**
```
/supabase/functions/server/iot/
  ├── mqtt-handler.tsx
  ├── device-registry.tsx
  ├── readings-processor.tsx
  ├── events-processor.tsx
  ├── commands-publisher.tsx
  └── alert-generator.tsx
```

**AWS Lambda Functions (separate repo):**
```
/aws-lambda/
  ├── meter-readings-processor/
  ├── meter-events-processor/
  └── meter-commands-handler/
```

**Budget per Spec:**
- AWS IoT Core: ~$9/month for 1,000 meters
- $0.08/1M connection-minutes
- $1.00/1M messages

**External Accounts Needed:**
- [ ] AWS account with IoT Core enabled

---

### 5. Operator Dashboard (Frontend Complete, Backend Missing)

**Status:** ✅ Frontend built | ❌ Backend APIs missing

**Missing Backend APIs:**
- [ ] `GET /api/dashboard/overview` - Site stats
- [ ] `GET /api/dashboard/load-chart` - 24h power data
- [ ] `GET /api/meters` - Meter list with real-time status
- [ ] `GET /api/alerts/recent` - Last 10 alerts
- [ ] `GET /api/revenue/trend` - 7-day revenue
- [ ] `GET /api/customers/summary` - Customer counts by type

**Replace Simulator:**
- [ ] Remove `/src/app/data/meterData.ts` static data
- [ ] Update `/src/app/contexts/LiveDataContext.tsx` to fetch from API
- [ ] Implement WebSocket for live updates
- [ ] Add loading states
- [ ] Add error handling

**Files to Update:**
```
/src/app/contexts/LiveDataContext.tsx - Replace simulator with API calls
/src/app/pages/Dashboard.tsx - Connect to real data
/src/app/pages/Meters.tsx - Connect to real data
/src/app/pages/Alerts.tsx - Connect to real data
/src/app/pages/Analytics.tsx - Connect to real data
```

**Files to Create:**
```
/supabase/functions/server/api/
  ├── dashboard-overview.tsx
  ├── meters-list.tsx
  ├── alerts-recent.tsx
  └── revenue-trend.tsx
```

---

### 6. Real-Time Monitoring

**Frontend:** ✅ Complete (charts, load patterns)  
**Backend:** ❌ Missing

**Required Data Pipelines:**
- [ ] **Load Patterns**
  - Aggregate meter readings per hour
  - Calculate total site load
  - Detect peak vs. off-peak

- [ ] **Power Quality Metrics**
  - Track voltage fluctuations
  - Detect brownouts
  - Monitor frequency stability

- [ ] **Generation vs. Consumption**
  - Solar generation tracking
  - Battery charge/discharge
  - Grid import (if hybrid)

- [ ] **Loss Detection** (v2.0)
  - Compare generation to billed consumption
  - Calculate technical + commercial losses
  - Flag anomalies (theft, leakage)

**Files to Create:**
```
/supabase/functions/server/monitoring/
  ├── load-aggregator.tsx
  ├── power-quality-tracker.tsx
  └── generation-tracker.tsx
```

---

### 7. USSD/SMS Customer Portal (Backend Missing)

**Status:** ✅ UI mockup exists | ❌ Backend NOT implemented

**Africa's Talking Setup:**
- [ ] Create account at africastalking.com
- [ ] Get API credentials
- [ ] Register USSD shortcode (spec says *150*00# sandbox)
- [ ] Set callback URL: `https://your-api.com/ussd/callback`

**USSD Session Flow:**
```
1. Customer dials *150*00#
2. Africa's Talking sends POST to /ussd/callback
3. Your server responds with menu text
4. Customer selects option (1, 2, 3...)
5. Server responds with next screen
6. Continue until END (session terminates)
```

**USSD Handler Implementation:**
- [ ] **Session State Management**
  - Store session in Redis or database
  - Track current menu level
  - Store user input history

- [ ] **Menu Router**
  ```
  Level 0: Main menu
    1. Check balance → Level 1
    2. Buy tokens → Level 2
    3. Report issue → Level 3
    4. Last payment → Level 4
    5. Contact agent → Level 5
  
  Level 1: Display balance, meter status, return
  Level 2: Enter amount → Confirm → Trigger payment
  Level 3: Select issue type → Confirm → Create ticket
  Level 4: Show last payment date, amount, token
  Level 5: Show agent phone number
  ```

- [ ] **Customer Lookup**
  - Extract phone number from USSD session
  - Query database for customer record
  - If not found, show registration message

- [ ] **Balance Check**
  - Query customer_ledgers for latest balance
  - Format in Swahili: "Salio lako: TZS 4,980"
  - Show meter status (connected/disconnected)

- [ ] **Token Purchase Flow**
  1. Customer enters amount (e.g., 5000)
  2. Server calculates kWh (amount ÷ tariff)
  3. Show confirmation: "TZS 5,000 = 2.92 kWh?"
  4. If confirmed, trigger M-Pesa STK Push
  5. Show "Ombi limepokelewa" (Request received)
  6. On payment success webhook → Send token via SMS

- [ ] **Issue Reporting**
  - Menu: Power outage / Meter fault / Billing issue
  - Store in `support_tickets` table
  - Notify operator via email/SMS
  - Return ticket number

**SMS Token Delivery:**
- [ ] On payment success:
  - Generate 20-digit token
  - Send SMS: "Tokeni yako: 1234-5678-9012-3456-7890. Ingiza kwenye mita."
  - Log SMS delivery status

**Files to Create:**
```
/supabase/functions/server/ussd/
  ├── session-handler.tsx
  ├── menu-router.tsx
  ├── balance-checker.tsx
  └── issue-reporter.tsx

/supabase/functions/server/sms/
  ├── token-sender.tsx
  ├── alert-sender.tsx
  └── notification-sender.tsx
```

**Database Schema:**
```sql
CREATE TABLE ussd_sessions (
  id UUID PRIMARY KEY,
  session_id TEXT UNIQUE,
  phone_number TEXT,
  current_level INTEGER,
  user_input JSONB,
  created_at TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE TABLE support_tickets (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  issue_type TEXT,
  description TEXT,
  status TEXT, -- open/in-progress/resolved
  created_at TIMESTAMP
);
```

**Budget per Spec:** $3,000–$5,000/year

**External Accounts Needed:**
- [ ] Africa's Talking account

---

### 8. Agent App (React Native Build Missing)

**Status:** ✅ UI mockup exists | ❌ React Native app NOT built

**React Native (Expo) Project:**
- [ ] **Setup**
  - [ ] Create new Expo project: `npx create-expo-app agent-app`
  - [ ] Install dependencies: SQLite, axios, react-navigation
  - [ ] Configure offline-first architecture

- [ ] **Screens**
  1. **Home Screen**
     - Show sync status (online/offline)
     - Show pending uploads count
     - Buttons: Collect Payment, Issue Token, Customers, Inspection, Sync

  2. **Collect Payment Screen**
     - Input: Phone number → Search customer
     - Display: Customer name, meter ID, current balance
     - Input: Amount (TZS)
     - Select: Payment method (Cash/M-Pesa/Airtel/Tigo)
     - Button: Record Payment
     - On submit: Store locally → Sync to server when online

  3. **Customers Screen**
     - List all customers assigned to agent
     - Search by name/phone
     - Show balance + status (connected/disconnected)
     - Tap to view details

  4. **Issue Token Screen** (Offline Mode)
     - Pre-download token batch (e.g., 100 tokens)
     - Agent selects customer
     - Enter amount paid (cash)
     - Dispense token from local batch
     - Print/SMS token to customer
     - Sync usage to server

  5. **Inspection Screen**
     - Form: Meter photo, notes, issues
     - Dropdown: Issue type (meter fault, tamper, theft, outage)
     - Button: Submit inspection
     - Store locally → Sync when online

- [ ] **Offline-First Architecture**
  - [ ] SQLite database on device
  - [ ] Store: Customers, tokens (batch), payments (pending), inspections
  - [ ] Sync queue: Track pending uploads
  - [ ] On connectivity:
    1. Upload pending payments
    2. Upload inspections
    3. Download new token batch
    4. Download updated customer list
    5. Mark synced items

- [ ] **Backend APIs for Agent**
  - [ ] `POST /api/agent/login` - Authenticate agent
  - [ ] `GET /api/agent/customers` - Get assigned customers
  - [ ] `POST /api/agent/cash-payment` - Record cash collection
  - [ ] `GET /api/agent/tokens/batch` - Download 100 pre-generated tokens
  - [ ] `POST /api/agent/token-used` - Report token dispensed
  - [ ] `POST /api/agent/inspection` - Upload inspection report
  - [ ] `POST /api/agent/sync` - Bulk sync endpoint

**Files to Create:**
```
/agent-app/ (new React Native project)
  ├── app/
  │   ├── screens/
  │   │   ├── HomeScreen.tsx
  │   │   ├── CollectPaymentScreen.tsx
  │   │   ├── CustomersScreen.tsx
  │   │   ├── IssueTokenScreen.tsx
  │   │   └── InspectionScreen.tsx
  │   ├── services/
  │   │   ├── api.ts
  │   │   ├── sqlite.ts
  │   │   └── sync.ts
  │   └── App.tsx
  └── package.json

/supabase/functions/server/agent/
  ├── login.tsx
  ├── customers.tsx
  ├── cash-payment.tsx
  ├── token-batch.tsx
  ├── inspection.tsx
  └── sync.tsx
```

**Database Schema:**
```sql
CREATE TABLE agent_users (
  id UUID PRIMARY KEY,
  name TEXT,
  phone_number TEXT UNIQUE,
  password_hash TEXT,
  assigned_site_id UUID REFERENCES sites(id),
  status TEXT, -- active/suspended
  created_at TIMESTAMP
);

CREATE TABLE cash_collections (
  id UUID PRIMARY KEY,
  agent_id UUID REFERENCES agent_users(id),
  customer_id UUID REFERENCES customers(id),
  amount_tzs DECIMAL,
  token_id UUID REFERENCES tokens(id),
  collected_at TIMESTAMP,
  synced_at TIMESTAMP
);

CREATE TABLE site_inspections (
  id UUID PRIMARY KEY,
  agent_id UUID REFERENCES agent_users(id),
  site_id UUID REFERENCES sites(id),
  meter_id UUID REFERENCES meters(id),
  issue_type TEXT,
  notes TEXT,
  photo_url TEXT,
  inspected_at TIMESTAMP,
  synced_at TIMESTAMP
);
```

**Deployment:**
- [ ] Build APK with Expo EAS: `eas build --platform android`
- [ ] Distribute via direct download (no Play Store for MVP)
- [ ] Enable OTA updates via Expo

**Budget per Spec:** 1 mobile developer (part of $160K-$240K team)

---

### 9. Automated Alerts (Backend Missing)

**Status:** ⚠️ Frontend alert display exists | ❌ SMS/email NOT sent

**Alert Types (per spec):**
1. **Outages** - No meter data for 30+ minutes
2. **Low Credit** - Customer balance < TZS 1,000
3. **Tamper Events** - Meter cover opened
4. **Maintenance Due** - Equipment scheduled service

**Alert Rule Engine:**
- [ ] **Low Balance Rule**
  - Trigger: balance < threshold (e.g., TZS 1,000)
  - Action: Send SMS to customer + email to operator
  - Frequency: Once per day max

- [ ] **Disconnection Rule**
  - Trigger: balance = 0 → meter disconnected
  - Action: SMS to customer, log in dashboard

- [ ] **Tamper Rule**
  - Trigger: Tamper event from meter (MQTT)
  - Action: SMS to operator, create alert, log event

- [ ] **Outage Rule**
  - Trigger: No meter readings for 30 minutes
  - Action: SMS to operator, mark meter offline

- [ ] **Maintenance Rule**
  - Trigger: Last maintenance date > 90 days
  - Action: Email to operator with checklist

**Notification Delivery:**
- [ ] **SMS via Africa's Talking**
  - API: `POST https://api.africastalking.com/version1/messaging`
  - Templates:
    ```
    Low balance: "Salio lako ni TZS 980. Nunua tokeni haraka."
    Disconnected: "Mita yako imekatwa. Lipa kupata tokeni."
    Tamper: "ALERT: Tamper detected at Meter MTR-005"
    ```

- [ ] **Email via SendGrid/AWS SES**
  - For operator notifications
  - Daily summary reports

**Files to Create:**
```
/supabase/functions/server/alerts/
  ├── rule-engine.tsx
  ├── notification-sender.tsx
  ├── sms-sender.tsx
  └── email-sender.tsx
```

**Database Schema:**
```sql
CREATE TABLE alert_rules (
  id UUID PRIMARY KEY,
  rule_type TEXT, -- low_balance/tamper/outage/maintenance
  threshold JSONB, -- {balance: 1000} or {minutes: 30}
  notification_method TEXT, -- sms/email/both
  enabled BOOLEAN,
  created_at TIMESTAMP
);

CREATE TABLE alerts (
  id UUID PRIMARY KEY,
  meter_id UUID REFERENCES meters(id),
  alert_type TEXT,
  severity TEXT, -- info/warning/critical
  message TEXT,
  acknowledged BOOLEAN,
  created_at TIMESTAMP,
  acknowledged_at TIMESTAMP
);
```

---

### 10. Revenue Analytics (Backend Missing)

**Status:** ✅ Frontend charts exist | ❌ Real data missing

**Analytics Endpoints:**
- [ ] `GET /api/analytics/collection-rate`
  - Formula: (payments_received / billing_expected) * 100
  - Period: Daily/weekly/monthly

- [ ] `GET /api/analytics/arpu`
  - Formula: total_revenue / active_customers
  - Average Revenue Per User

- [ ] `GET /api/analytics/revenue-per-kwh`
  - Formula: total_revenue / total_kwh_sold

- [ ] `GET /api/analytics/revenue-trend`
  - Data: Last 30 days revenue by day
  - Chart: Line chart with trend

- [ ] `GET /api/analytics/customer-segments`
  - Breakdown: Residential vs. Business vs. Productive Use
  - Data: Count, revenue, ARPU per segment

**Files to Create:**
```
/supabase/functions/server/analytics/
  ├── collection-rate.tsx
  ├── arpu.tsx
  ├── revenue-per-kwh.tsx
  └── customer-segments.tsx
```

---

### 11. Carbon Credit Data Module (Not Started)

**Revenue Potential (per spec):**
- 50kW mini-grid → ~100 MWh/year
- 100 MWh → ~80 tCO2e credits
- At $3/tCO2e: $240/year per site
- At $13/tCO2e: $1,040/year per site

**Implementation:**
- [ ] **MWh Tracking**
  - Aggregate solar generation from meter readings
  - Store monthly totals per site

- [ ] **CO2 Calculation**
  - Baseline: Diesel generator emissions (0.8 tCO2e/MWh)
  - Formula: MWh_generated × 0.8 = tCO2e_offset

- [ ] **Reporting Export**
  - [ ] Verra VCS format (CSV/JSON)
  - [ ] Gold Standard format
  - [ ] Annual summary report (PDF)

- [ ] **Certification Integration** (v2.0)
  - [ ] AirCarbon Exchange API (Kenya)
  - [ ] Direct registry submission

**Files to Create:**
```
/supabase/functions/server/carbon/
  ├── generation-tracker.tsx
  ├── baseline-calculator.tsx
  ├── report-generator.tsx
  └── verra-exporter.tsx
```

**Database Schema:**
```sql
CREATE TABLE carbon_generation_logs (
  id UUID PRIMARY KEY,
  site_id UUID REFERENCES sites(id),
  month INTEGER,
  year INTEGER,
  mwh_generated DECIMAL,
  tco2e_offset DECIMAL,
  created_at TIMESTAMP
);

CREATE TABLE carbon_credits (
  id UUID PRIMARY KEY,
  site_id UUID REFERENCES sites(id),
  year INTEGER,
  total_mwh DECIMAL,
  total_tco2e DECIMAL,
  status TEXT, -- pending/verified/sold
  revenue_usd DECIMAL,
  created_at TIMESTAMP
);
```

**Budget per Spec:**
- Carbon module subscription: $50-$100/site/year
- Certification: $5K-$50K setup, 6-15 months

---

## 🏗️ INFRASTRUCTURE SETUP

### Database (PostgreSQL)

**Issue:** Figma Make only has KV store  
**Solution:** Deploy to full Supabase project

**Schema Required:**
```sql
-- Core entities
CREATE TABLE operators (...);
CREATE TABLE sites (...);
CREATE TABLE users (...);
CREATE TABLE roles (...);

-- Metering
CREATE TABLE meters (...);
CREATE TABLE dcus (...);
CREATE TABLE meter_readings (...); -- Time-series
CREATE TABLE meter_configurations (...);

-- Customers & Billing
CREATE TABLE customers (...);
CREATE TABLE tariffs (...);
CREATE TABLE customer_ledgers (...);
CREATE TABLE tokens (...);
CREATE TABLE payments (...);

-- Operations
CREATE TABLE alerts (...);
CREATE TABLE alert_rules (...);
CREATE TABLE maintenance_logs (...);
CREATE TABLE site_inspections (...);

-- Agent
CREATE TABLE agent_users (...);
CREATE TABLE cash_collections (...);

-- Carbon
CREATE TABLE carbon_generation_logs (...);
CREATE TABLE carbon_credits (...);

-- USSD
CREATE TABLE ussd_sessions (...);
CREATE TABLE support_tickets (...);
```

**Migration Strategy:**
1. Cannot run migrations in Figma Make
2. Must deploy to real Supabase project
3. Use Supabase CLI: `supabase db push`

---

### AWS IoT Core

- [ ] **Account Setup**
  - [ ] Create AWS account
  - [ ] Enable IoT Core in af-south-1
  - [ ] Create IAM roles for Lambda

- [ ] **Cost Monitoring**
  - [ ] Set up billing alerts
  - [ ] Target: ~$9/month for 1,000 meters
  - [ ] Scale estimates ready

---

### Payment Gateways

- [ ] **M-Pesa Daraja (Kenya)**
  - [ ] developer.safaricom.co.ke signup
  - [ ] Test in sandbox
  - [ ] Production approval (requires business docs)

- [ ] **ClickPesa (Tanzania)**
  - [ ] clickpesa.com signup
  - [ ] API key generation
  - [ ] Test transactions

- [ ] **MTN MoMo (Rwanda/Uganda)**
  - [ ] momodeveloper.mtn.com signup
  - [ ] Sandbox testing
  - [ ] Production onboarding

---

### SMS/USSD Gateway

- [ ] **Africa's Talking**
  - [ ] africastalking.com signup
  - [ ] Buy credits ($10 minimum)
  - [ ] Register USSD shortcode
  - [ ] Test in sandbox (*384*TEST#)

---

### Deployment Platform

**Option 1: Full Supabase + AWS (Recommended)**
- Supabase: Database, Auth, Edge Functions
- AWS: IoT Core, Lambda, S3
- Cloudflare: CDN, DDoS protection
- Cost: ~$50-200/month at 1,000 meters

**Option 2: Keep Figma Make Frontend + Separate Backend**
- Figma Make: Dashboard UI only
- Separate deployment: Backend APIs
- Connect via CORS
- Hybrid approach

---

## 📅 IMPLEMENTATION ROADMAP (Per Spec)

### Phase 1: MVP (Months 1-3)
**Goal:** Core billing + payment + token generation

**Week 1-2: Database & Auth**
- [ ] Deploy PostgreSQL schema
- [ ] Set up Supabase Auth
- [ ] Create operator/admin accounts

**Week 3-4: STS Token Partnership**
- [ ] Research vendors
- [ ] Sign partnership agreement
- [ ] Integrate token API

**Week 5-6: Mobile Money**
- [ ] M-Pesa Daraja integration
- [ ] ClickPesa integration
- [ ] Payment webhook handler

**Week 7-8: Customer Management**
- [ ] Customer CRUD APIs
- [ ] Balance tracking
- [ ] Payment history

**Week 9-10: Token Vending**
- [ ] Payment → Token flow
- [ ] SMS delivery
- [ ] Admin UI for manual tokens

**Week 11-12: Testing**
- [ ] End-to-end payment flow
- [ ] Test with 1-2 real meters
- [ ] Validate token acceptance

**Milestone:** Customer pays → Receives token → Loads into meter

---

### Phase 2: Pilot (Months 4-6)
**Goal:** Connect 500 meters, 2 operators

**Month 4: MQTT Integration**
- [ ] AWS IoT Core setup
- [ ] Lambda processors
- [ ] Test with 10 meters
- [ ] Replace dashboard simulator

**Month 5: Operator Onboarding**
- [ ] Sign 2 pilot agreements
- [ ] Train operators
- [ ] Onboard 500 meters total
- [ ] Deploy to production

**Month 6: USSD Portal**
- [ ] Africa's Talking integration
- [ ] USSD session handler
- [ ] Test with customers
- [ ] Monitor usage

**Milestone:** 500 meters online, 90%+ collection rate

---

### Phase 3: Launch (Months 7-9)
**Goal:** Commercial launch Tanzania

**Month 7: Agent App**
- [ ] Build React Native app
- [ ] Offline SQLite sync
- [ ] Deploy to 10 agents
- [ ] Training sessions

**Month 8: Automated Alerts**
- [ ] SMS/email notifications
- [ ] Alert rule engine
- [ ] Dashboard integration

**Month 9: Carbon Module v1**
- [ ] MWh tracking
- [ ] CO2 calculations
- [ ] Verra reporting export
- [ ] Pilot with 2 sites

**Milestone:** 2,000 meters, 5 operators, $26K revenue

---

### Phase 4: Scale (Months 10-12)
**Goal:** Kenya expansion, advanced features

**Month 10: Kenya Launch**
- [ ] EPRA compliance
- [ ] Kenya operators outreach
- [ ] M-Pesa KE focus

**Month 11: Advanced Analytics**
- [ ] Loss detection
- [ ] Load forecasting
- [ ] Predictive maintenance

**Month 12: Portfolio Management**
- [ ] Multi-site dashboard
- [ ] Cross-site analytics
- [ ] Operator white-labeling

**Milestone:** 5,000+ meters, Rwanda/Uganda pipeline

---

## 💰 BUDGET ALLOCATION (Year 1)

| Category | Spec Budget | Priority |
|----------|-------------|----------|
| Dev Team (6 people) | $160K–$240K | 🔴 Critical |
| AWS IoT Infrastructure | $8K–$15K | 🔴 Critical |
| STS Certification | $10K–$20K | 🔴 Critical |
| Mobile Money APIs | $3K–$8K | 🔴 Critical |
| SMS/USSD | $3K–$5K | 🟠 High |
| Meter Testing Lab | $5K–$10K | 🟡 Medium |
| Regulatory/Legal | $5K–$10K | 🟡 Medium |
| Sales & BD | $15K–$25K | 🟡 Medium |
| Office/Admin | $6K–$10K | 🟢 Low |
| **TOTAL** | **$223K–$355K** | — |

---

## 🎯 SUCCESS METRICS (Year 1)

### Technical Metrics
- [ ] 2,000 meters connected
- [ ] 99.5% uptime
- [ ] <5 second token delivery
- [ ] 90%+ payment success rate
- [ ] <1% technical loss

### Business Metrics
- [ ] 5 operator contracts signed
- [ ] $26,000 total revenue
- [ ] 90%+ collection rate
- [ ] $6,000 SaaS revenue (2,000 meters × $0.25/month)
- [ ] $15,000 implementation fees

### Customer Metrics
- [ ] 50,000+ tokens generated
- [ ] 80%+ customer satisfaction
- [ ] <10% customer churn
- [ ] USSD adoption: 40%+ of transactions

---

## ✅ FINAL CHECKLIST

### Before Production Launch:
- [ ] All 10 MVP features implemented
- [ ] Database schema deployed
- [ ] AWS IoT Core configured
- [ ] Payment gateways live
- [ ] STS token partnership active
- [ ] USSD shortcode registered
- [ ] Agent app deployed (Android APK)
- [ ] 2 pilot operators onboarded
- [ ] 500 test meters connected
- [ ] 90%+ payment → token success rate
- [ ] Security audit completed
- [ ] EWURA/EPRA regulatory review
- [ ] Support documentation written
- [ ] Operator training materials ready

### Legal & Regulatory:
- [ ] Tanzania EWURA consultation
- [ ] Kenya EPRA consultation
- [ ] Data privacy compliance (GDPR/local)
- [ ] Terms of Service
- [ ] SLA agreements with operators
- [ ] Mobile money agreements signed

---

**Document Version:** 1.0  
**Last Updated:** March 15, 2026  
**Status:** Ready for implementation  
**Estimated Timeline:** 12 months to production launch
