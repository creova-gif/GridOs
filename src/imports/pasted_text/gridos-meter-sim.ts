/**
 * GridOS Meter Simulator
 * Publishes realistic MQTT meter readings for 10 virtual Tanzania mini-grid customers.
 *
 * Topic structure:
 *   gridios/{operator_id}/{site_id}/meters/{meter_id}/readings   <- telemetry
 *   gridios/{operator_id}/{site_id}/meters/{meter_id}/status     <- connection/billing state
 *   gridios/{operator_id}/{site_id}/alerts                       <- site-level alerts
 *   gridios/{operator_id}/{site_id}/site/summary                 <- aggregated site stats
 */

import mqtt from 'mqtt';
import { v4 as uuidv4 } from 'uuid';
import { SITE, METERS, LOAD_PROFILES } from '../config/meters.js';

// ─── Config ──────────────────────────────────────────────────────────────────
const BROKER_URL = process.env.MQTT_BROKER || 'mqtt://broker.hivemq.com';
const CLIENT_ID  = `gridios-sim-${Math.random().toString(16).slice(2, 8)}`;
const INTERVAL   = parseInt(process.env.SIM_INTERVAL_MS || '5000');
const TOPIC_PRE  = `gridios/${SITE.operator}/${SITE.id}`;

// ─── Meter State (in-memory, evolves over time) ───────────────────────────────
const state = METERS.map(m => ({
  ...m,
  balance_tzs:       m.initial_balance_tzs,
  cumulative_kwh:    parseFloat((Math.random() * 200 + 50).toFixed(3)),
  voltage:           230,
  tamper:            false,
  connected:         m.load_profile !== 'disconnected',
  last_reading_at:   null,
  total_paid_tzs:    m.initial_balance_tzs + Math.floor(Math.random() * 50000),
  token_count:       Math.floor(Math.random() * 12) + 1,
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────
function variance(base, pct = 0.15) {
  return base * (1 + (Math.random() - 0.5) * 2 * pct);
}

function currentPowerW(meter) {
  if (!meter.connected || meter.balance_tzs <= 0) return 0;
  const hour = new Date().getHours();
  const profile = LOAD_PROFILES[meter.load_profile];
  return Math.max(0, Math.round(variance(profile[hour], 0.20)));
}

function tariffForMeter(meter) {
  return SITE.tariff_tzs_per_kwh[meter.customer.type] || SITE.tariff_tzs_per_kwh.residential;
}

function buildReading(meter) {
  const power_w   = currentPowerW(meter);
  const energy_wh = (power_w * INTERVAL) / 3_600_000;          // Wh consumed this interval
  const energy_kwh = energy_wh / 1000;
  const cost_tzs  = energy_kwh * tariffForMeter(meter);

  // Update cumulative state
  meter.cumulative_kwh = parseFloat((meter.cumulative_kwh + energy_kwh).toFixed(4));
  meter.balance_tzs    = Math.max(0, meter.balance_tzs - cost_tzs);

  // Simulate occasional tamper event (1 in 200 readings on any meter)
  if (!meter.tamper && Math.random() < 0.005) meter.tamper = true;

  // Disconnect if balance hits zero
  if (meter.balance_tzs <= 0 && meter.connected) {
    meter.connected = false;
    meter.balance_tzs = 0;
  }

  // Simulate voltage sag under heavy load
  meter.voltage = power_w > 200 ? Math.round(variance(218, 0.03)) : Math.round(variance(230, 0.015));

  meter.last_reading_at = new Date().toISOString();

  return {
    // IDs
    message_id:      uuidv4(),
    meter_id:        meter.id,
    meter_serial:    meter.serial,
    meter_brand:     meter.brand,
    site_id:         SITE.id,
    operator_id:     SITE.operator,
    timestamp:       meter.last_reading_at,

    // Electrical
    power_w:         power_w,
    voltage_v:       meter.voltage,
    current_a:       parseFloat((power_w / meter.voltage).toFixed(3)),
    frequency_hz:    parseFloat(variance(50, 0.005).toFixed(2)),
    power_factor:    parseFloat(variance(0.92, 0.05).toFixed(3)),
    energy_kwh_interval: parseFloat(energy_kwh.toFixed(6)),
    cumulative_kwh:  meter.cumulative_kwh,

    // Billing
    balance_tzs:     parseFloat(meter.balance_tzs.toFixed(2)),
    tariff_tzs_per_kwh: tariffForMeter(meter),
    cost_interval_tzs: parseFloat(cost_tzs.toFixed(4)),
    customer_type:   meter.customer.type,

    // Status
    connected:       meter.connected,
    tamper_detected: meter.tamper,
    rssi_dbm:        Math.round(variance(-72, 0.15)),    // GSM signal strength
    firmware:        '2.4.1',
  };
}

function buildSiteSummary() {
  const active    = state.filter(m => m.connected);
  const total_w   = active.reduce((s, m) => s + currentPowerW(m), 0);
  const low_credit = state.filter(m => m.balance_tzs > 0 && m.balance_tzs < 3000);
  const zero_bal  = state.filter(m => m.balance_tzs <= 0);
  const tampered  = state.filter(m => m.tamper);

  return {
    site_id:           SITE.id,
    site_name:         SITE.name,
    timestamp:         new Date().toISOString(),
    meters_total:      state.length,
    meters_connected:  active.length,
    meters_zero_balance: zero_bal.length,
    meters_low_credit: low_credit.length,
    meters_tamper:     tampered.length,
    total_load_w:      total_w,
    capacity_kw:       SITE.capacity_kw,
    utilization_pct:   parseFloat(((total_w / (SITE.capacity_kw * 1000)) * 100).toFixed(1)),
    total_revenue_today_tzs: Math.round(state.reduce((s, m) => s + m.initial_balance_tzs - m.balance_tzs, 0)),
    collection_rate_pct: parseFloat(((active.length / state.length) * 100).toFixed(1)),
  };
}

function checkAlerts(meter, reading) {
  const alerts = [];

  if (reading.balance_tzs <= 0 && meter.connected === false) {
    alerts.push({ type: 'DISCONNECTED', severity: 'high',
      message: `${meter.customer.name} disconnected — zero balance`,
      meter_id: meter.id, balance_tzs: 0 });
  }
  if (reading.balance_tzs > 0 && reading.balance_tzs < 3000) {
    alerts.push({ type: 'LOW_CREDIT', severity: 'medium',
      message: `${meter.customer.name} low credit: TZS ${reading.balance_tzs.toFixed(0)}`,
      meter_id: meter.id, balance_tzs: reading.balance_tzs });
  }
  if (reading.tamper_detected) {
    alerts.push({ type: 'TAMPER', severity: 'critical',
      message: `Tamper detected on meter ${meter.serial} (${meter.customer.name})`,
      meter_id: meter.id });
  }
  if (reading.voltage_v < 210) {
    alerts.push({ type: 'UNDER_VOLTAGE', severity: 'medium',
      message: `Under-voltage on ${meter.id}: ${reading.voltage_v}V`,
      meter_id: meter.id, voltage_v: reading.voltage_v });
  }

  return alerts.map(a => ({ ...a, site_id: SITE.id, timestamp: reading.timestamp, id: uuidv4() }));
}

// ─── Main ─────────────────────────────────────────────────────────────────────
console.log(`\n╔══════════════════════════════════════════════╗`);
console.log(`║       GridOS Meter Simulator v1.0            ║`);
console.log(`║  ${SITE.name.padEnd(44)}║`);
console.log(`║  ${METERS.length} virtual meters · ${INTERVAL/1000}s interval               ║`);
console.log(`╚══════════════════════════════════════════════╝\n`);
console.log(`Connecting to ${BROKER_URL} ...`);

const client = mqtt.connect(BROKER_URL, {
  clientId: CLIENT_ID,
  clean: true,
  connectTimeout: 10000,
  reconnectPeriod: 3000,
});

client.on('connect', () => {
  console.log(`✓ Connected to MQTT broker (${CLIENT_ID})\n`);
  console.log(`Publishing on topic prefix: ${TOPIC_PRE}/\n`);
  console.log(`─────────────────────────────────────────────`);

  let tick = 0;

  setInterval(() => {
    tick++;
    const now = new Date().toLocaleTimeString();
    let alertCount = 0;

    // Publish individual meter readings
    state.forEach(meter => {
      const reading = buildReading(meter);

      // Reading telemetry
      client.publish(
        `${TOPIC_PRE}/meters/${meter.id}/readings`,
        JSON.stringify(reading),
        { qos: 1 }
      );

      // Status summary (lighter payload, useful for dashboard polling)
      client.publish(
        `${TOPIC_PRE}/meters/${meter.id}/status`,
        JSON.stringify({
          meter_id:    meter.id,
          connected:   meter.connected,
          balance_tzs: parseFloat(meter.balance_tzs.toFixed(2)),
          power_w:     reading.power_w,
          tamper:      meter.tamper,
          timestamp:   reading.timestamp,
        }),
        { qos: 0 }
      );

      // Alerts
      const alerts = checkAlerts(meter, reading);
      alerts.forEach(alert => {
        client.publish(
          `${TOPIC_PRE}/alerts`,
          JSON.stringify(alert),
          { qos: 1 }
        );
        alertCount++;
        console.log(`  ⚠  [${now}] ALERT ${alert.type}: ${alert.message}`);
      });

      // Console reading summary
      const bal = reading.balance_tzs.toFixed(0).padStart(7);
      const pwr = reading.power_w.toString().padStart(4);
      const status = meter.connected ? '●' : '○';
      console.log(`  ${status} [${now}] ${meter.id} (${meter.customer.name.padEnd(22)}) ${pwr}W  TZS ${bal}`);
    });

    // Site summary every 3 ticks
    if (tick % 3 === 0) {
      const summary = buildSiteSummary();
      client.publish(
        `${TOPIC_PRE}/site/summary`,
        JSON.stringify(summary),
        { qos: 0 }
      );
      console.log(`\n  📊 Site summary: ${summary.meters_connected}/${summary.meters_total} connected · ${summary.total_load_w}W load · ${summary.utilization_pct}% capacity\n`);
    } else {
      console.log(`  ─ tick ${tick}`);
    }

  }, INTERVAL);
});

client.on('error', err => {
  console.error('MQTT error:', err.message);
});

client.on('offline', () => {
  console.log('⚠ MQTT broker offline — buffering...');
});

client.on('reconnect', () => {
  console.log('↻ Reconnecting to broker...');
});

process.on('SIGINT', () => {
  console.log('\n\nSimulator stopped. Disconnecting...');
  client.end();
  process.exit(0);
});