# GridOS Meter Simulator

Simulates 10 Tanzania mini-grid meters for the GridOS platform — publishing realistic MQTT telemetry, billing events, and alerts.

## What this simulates

| Meter | Customer | Type | Load Profile |
|-------|----------|------|-------------|
| MTR-001 | Amina Hassan | Residential | Low (lights + phone) |
| MTR-002 | Joseph Mwangi | Residential | Mid (TV + fridge) |
| MTR-003 | Mama Pima Duka | Business | Small shop |
| MTR-004 | Baraka Fishing Co | Productive | Ice maker (peak hours) |
| MTR-005 | Grace Nyamweru | Residential | **Low credit** — triggers alert |
| MTR-006 | St. Peter Primary School | Productive | High daytime, off at night |
| MTR-007 | Ali Dispensary | Business | 24hr medical fridge |
| MTR-008 | Zawadi Restaurant | Business | Cooking hours peaks |
| MTR-009 | Farida Tailoring | Business | Standard business |
| MTR-010 | Pastor Elias Home | Residential | **Zero balance** — disconnected |

## Setup

```bash
npm install
cp .env.example .env
```

## Run (two terminals)

**Terminal 1 — Simulator (publishes)**
```bash
node src/simulator.js
```

**Terminal 2 — Subscriber (receives + processes)**
```bash
node src/subscriber.js
```

## MQTT topic structure

```
gridios/{operator_id}/{site_id}/meters/{meter_id}/readings   ← full telemetry
gridios/{operator_id}/{site_id}/meters/{meter_id}/status     ← lightweight status
gridios/{operator_id}/{site_id}/alerts                       ← triggered alerts
gridios/{operator_id}/{site_id}/site/summary                 ← aggregated stats
```

## Reading payload (meter telemetry)

```json
{
  "message_id": "uuid",
  "meter_id": "MTR-001",
  "meter_serial": "HXG-2024-001",
  "meter_brand": "Hexing",
  "site_id": "site-tz-001",
  "operator_id": "op-jumeme-001",
  "timestamp": "2025-01-15T10:30:00.000Z",

  "power_w": 42,
  "voltage_v": 231,
  "current_a": 0.182,
  "frequency_hz": 50.02,
  "power_factor": 0.91,
  "energy_kwh_interval": 0.000058,
  "cumulative_kwh": 187.443,

  "balance_tzs": 4980.22,
  "tariff_tzs_per_kwh": 1710,
  "cost_interval_tzs": 0.0992,
  "customer_type": "residential",

  "connected": true,
  "tamper_detected": false,
  "rssi_dbm": -68,
  "firmware": "2.4.1"
}
```

## Next steps

1. **Add Supabase** — replace the in-memory arrays in `subscriber.js` with Supabase inserts
2. **Event-sourced billing** — each reading → INSERT into `billing_events` table (never UPDATE balance)
3. **Operator dashboard** — React frontend subscribes to site summary via WebSocket or polls API
4. **Africa's Talking SMS** — plug in when `LOW_CREDIT` or `DISCONNECTED` alerts fire

## Switching to HiveMQ Cloud (production-ready free tier)

1. Sign up at cloud.hivemq.com (free: 100 connections, 10GB/month)
2. Create a cluster and get your credentials
3. Update `.env`:
   ```
   MQTT_BROKER=mqtts://YOUR-CLUSTER.s2.eu.hivemq.cloud
   MQTT_PORT=8883
   MQTT_USERNAME=your-username
   MQTT_PASSWORD=your-password
   ```

## Switching to AWS IoT Core (production)

Replace the `mqtt.connect()` call with AWS IoT Device SDK v2 + X.509 certificate auth.
Cost: ~$9/month for 1,000 meters at 96 readings/day.
