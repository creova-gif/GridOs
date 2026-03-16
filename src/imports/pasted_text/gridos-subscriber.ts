/**
 * GridOS MQTT Subscriber / Event Processor
 *
 * This is the backend side of the pipeline:
 *   MQTT broker → this subscriber → (process reading) → (would write to DB)
 *
 * Run this in a second terminal alongside the simulator to see the full pipeline.
 * In production this becomes your Node.js backend service.
 */

import mqtt from 'mqtt';
import { SITE } from '../config/meters.js';

const BROKER_URL = process.env.MQTT_BROKER || 'mqtt://broker.hivemq.com';
const CLIENT_ID  = `gridios-subscriber-${Math.random().toString(16).slice(2, 8)}`;
const TOPIC_PRE  = `gridios/${SITE.operator}/${SITE.id}`;

// ─── In-memory store (replace with Supabase inserts in production) ─────────────
const readingLog   = [];     // would → INSERT INTO meter_readings
const alertLog     = [];     // would → INSERT INTO alerts
const billingEvents = [];    // would → INSERT INTO billing_events (event-sourced)
const statusCache   = {};    // would → UPDATE meter_status (or Redis cache)

// ─── Billing event processor ──────────────────────────────────────────────────
function processBillingEvent(reading) {
  // In the real system: INSERT INTO billing_events (immutable event log)
  const event = {
    id:              `evt-${Date.now()}-${reading.meter_id}`,
    type:            'ENERGY_CONSUMED',
    meter_id:        reading.meter_id,
    site_id:         reading.site_id,
    operator_id:     reading.operator_id,
    occurred_at:     reading.timestamp,
    energy_kwh:      reading.energy_kwh_interval,
    cost_tzs:        reading.cost_interval_tzs,
    balance_after:   reading.balance_tzs,
    tariff_applied:  reading.tariff_tzs_per_kwh,
    metadata: {
      voltage_v:     reading.voltage_v,
      power_w:       reading.power_w,
      rssi_dbm:      reading.rssi_dbm,
    }
  };
  billingEvents.push(event);
  return event;
}

// ─── Alert processor ──────────────────────────────────────────────────────────
function processAlert(alert) {
  // In production: INSERT INTO alerts + trigger SMS via Africa's Talking
  const actionMap = {
    'LOW_CREDIT':    () => `→ Would send SMS to customer: "Low balance: TZS ${alert.balance_tzs?.toFixed(0)}. Buy tokens via *150*00#"`,
    'DISCONNECTED':  () => `→ Would update meter status, notify field agent, log disconnection event`,
    'TAMPER':        () => `→ Would create maintenance ticket, alert operator dashboard, send priority SMS`,
    'UNDER_VOLTAGE': () => `→ Would log power quality event, check other meters on same feeder`,
  };
  return (actionMap[alert.type] || (() => `→ Unknown alert type: ${alert.type}`))();
}

// ─── Connection ───────────────────────────────────────────────────────────────
console.log(`\n╔══════════════════════════════════════════════╗`);
console.log(`║     GridOS MQTT Subscriber / Pipeline        ║`);
console.log(`║  Simulating: readings → billing → alerts     ║`);
console.log(`╚══════════════════════════════════════════════╝\n`);
console.log(`Connecting to ${BROKER_URL} ...`);

const client = mqtt.connect(BROKER_URL, {
  clientId: CLIENT_ID,
  clean: true,
  connectTimeout: 10000,
  reconnectPeriod: 3000,
});

client.on('connect', () => {
  console.log(`✓ Subscriber connected (${CLIENT_ID})\n`);

  // Subscribe to all meter topics for this site
  const topics = [
    `${TOPIC_PRE}/meters/+/readings`,   // + = wildcard for meter ID
    `${TOPIC_PRE}/meters/+/status`,
    `${TOPIC_PRE}/alerts`,
    `${TOPIC_PRE}/site/summary`,
  ];

  client.subscribe(topics, { qos: 1 }, (err) => {
    if (err) { console.error('Subscribe error:', err); return; }
    console.log('Subscribed to topics:');
    topics.forEach(t => console.log(`  • ${t}`));
    console.log('\nWaiting for meter data...\n');
    console.log('─────────────────────────────────────────────');
  });
});

client.on('message', (topic, payload) => {
  let data;
  try {
    data = JSON.parse(payload.toString());
  } catch {
    console.error('Invalid JSON on topic:', topic);
    return;
  }

  const now = new Date().toLocaleTimeString();

  // ── Meter reading ──────────────────────────────────────────────────────────
  if (topic.includes('/readings')) {
    readingLog.push(data);
    const billingEvent = processBillingEvent(data);
    billingEvents.push(billingEvent);

    const icon = data.connected ? '⚡' : '○ ';
    console.log(
      `${icon} [${now}] READ ${data.meter_id} | ` +
      `${data.power_w}W | ` +
      `${data.voltage_v}V | ` +
      `TZS ${data.balance_tzs.toFixed(0)} | ` +
      `${data.cumulative_kwh.toFixed(3)} kWh total`
    );
    console.log(
      `   DB: billing_events ← ${billingEvent.type} | cost: TZS ${billingEvent.cost_tzs.toFixed(4)} | ` +
      `energy: ${billingEvent.energy_kwh.toFixed(6)} kWh`
    );
  }

  // ── Alert ──────────────────────────────────────────────────────────────────
  else if (topic.includes('/alerts')) {
    alertLog.push(data);
    const action = processAlert(data);
    console.log(`\n  🚨 ALERT [${now}] ${data.type} (${data.severity.toUpperCase()})`);
    console.log(`     ${data.message}`);
    console.log(`     ${action}\n`);
  }

  // ── Site summary ───────────────────────────────────────────────────────────
  else if (topic.includes('/site/summary')) {
    console.log(`\n  📊 SITE SUMMARY [${now}]`);
    console.log(`     Connected: ${data.meters_connected}/${data.meters_total} meters`);
    console.log(`     Load: ${data.total_load_w}W / ${data.capacity_kw * 1000}W (${data.utilization_pct}%)`);
    console.log(`     Low credit: ${data.meters_low_credit} | Zero balance: ${data.meters_zero_balance} | Tamper: ${data.meters_tamper}`);
    console.log(`     Revenue today: TZS ${data.total_revenue_today_tzs?.toLocaleString()}`);
    console.log(`\n  Stats: ${readingLog.length} readings | ${billingEvents.length} billing events | ${alertLog.length} alerts processed\n`);
  }

  // ── Status update ──────────────────────────────────────────────────────────
  else if (topic.includes('/status')) {
    statusCache[data.meter_id] = data;
    // Silently cache — only log status changes
  }
});

client.on('error', err => console.error('MQTT error:', err.message));
client.on('offline', () => console.log('⚠ Broker offline'));
client.on('reconnect', () => console.log('↻ Reconnecting...'));

process.on('SIGINT', () => {
  console.log(`\n\nSubscriber stopped.`);
  console.log(`Total processed: ${readingLog.length} readings, ${billingEvents.length} billing events, ${alertLog.length} alerts`);
  client.end();
  process.exit(0);
});
