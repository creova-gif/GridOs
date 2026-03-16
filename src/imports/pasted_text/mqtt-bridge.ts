/**
 * GridOS MQTT Bridge
 * Subscribes to all operator/site topics and persists data to Supabase.
 * This runs as a background service alongside the Express API.
 */

import mqtt from 'mqtt';
import { supabase } from '../db.js';
import { sendSms }  from '../services/sms.js';

const BROKER_URL  = process.env.MQTT_BROKER || 'mqtt://broker.hivemq.com';
const TOPIC_PRE   = process.env.MQTT_TOPIC_PREFIX || 'gridios';
const CLIENT_ID   = `gridios-bridge-${Math.random().toString(16).slice(2, 8)}`;

// Dedup cache — prevent duplicate reads within 1s window
const recentMessages = new Map();
function isDuplicate(msgId) {
  if (!msgId) return false;
  if (recentMessages.has(msgId)) return true;
  recentMessages.set(msgId, true);
  setTimeout(() => recentMessages.delete(msgId), 60_000);
  return false;
}

// ─── Handlers ────────────────────────────────────────────────

async function handleReading(payload) {
  if (isDuplicate(payload.message_id)) return;

  const { error } = await supabase.from('meter_readings').insert({
    time:                  payload.timestamp,
    meter_id:              await resolveMeterUUID(payload.meter_id),
    site_id:               await resolveSiteUUID(payload.site_id),
    operator_id:           await resolveOperatorUUID(payload.operator_id),
    power_w:               payload.power_w,
    voltage_v:             payload.voltage_v,
    current_a:             payload.current_a,
    frequency_hz:          payload.frequency_hz,
    power_factor:          payload.power_factor,
    energy_kwh_interval:   payload.energy_kwh_interval,
    cumulative_kwh:        payload.cumulative_kwh,
    balance_tzs:           payload.balance_tzs,
    rssi_dbm:              payload.rssi_dbm,
    tamper_detected:       payload.tamper_detected,
    firmware:              payload.firmware,
    connected:             payload.connected,
    message_id:            payload.message_id,
  });

  if (error) console.error('Reading insert error:', error.message);

  // Record energy consumption as a billing event
  if (payload.energy_kwh_interval > 0 && payload.connected) {
    await insertBillingEvent({
      meter_ref:    payload.meter_id,
      site_ref:     payload.site_id,
      operator_ref: payload.operator_id,
      type:         'ENERGY_CONSUMED',
      amount_tzs:   -(payload.cost_interval_tzs),   // negative = debit
      energy_kwh:   payload.energy_kwh_interval,
      tariff:       payload.tariff_tzs_per_kwh,
      balance_after: payload.balance_tzs,
    });
  }
}

async function handleAlert(payload) {
  // Look up DB IDs
  const [meter_uuid, site_uuid, operator_uuid] = await Promise.all([
    payload.meter_id ? resolveMeterUUID(payload.meter_id) : null,
    resolveSiteUUID(payload.site_id),
    resolveOperatorUUID(TOPIC_PRE),
  ]);

  const { error } = await supabase.from('alerts').insert({
    operator_id:  operator_uuid,
    site_id:      site_uuid,
    meter_id:     meter_uuid,
    alert_type:   payload.type,
    severity:     payload.severity,
    message:      payload.message,
    metadata:     payload,
    occurred_at:  payload.timestamp,
  });

  if (error) console.error('Alert insert error:', error.message);

  // Send SMS for high/critical alerts
  if (['high','critical'].includes(payload.severity)) {
    await triggerAlertNotification(payload, meter_uuid);
  }
}

async function triggerAlertNotification(alert, meter_uuid) {
  if (!meter_uuid) return;

  // Get customer phone number
  const { data: customer } = await supabase
    .from('customers')
    .select('phone, full_name, language')
    .eq('meter_id', meter_uuid)
    .single();

  if (!customer) return;

  const messages = {
    LOW_CREDIT:   `Habari ${customer.full_name}, salio lako ni chini (TZS ${alert.balance_tzs?.toFixed(0)}). Nunua tokeni kupitia *150*00# au wasiliana na wakala.`,
    DISCONNECTED: `Habari ${customer.full_name}, umba wako umezimwa kwa sababu ya salio la sifuri. Nunua tokeni kupitia *150*00#`,
    TAMPER:       null,  // operator notification only, not customer
  };

  const msg = messages[alert.type];
  if (msg) await sendSms(customer.phone, msg);
}

// ─── Billing event writer ─────────────────────────────────────
const idCache = {};
async function resolveMeterUUID(ref)    { return resolveRef('meters',    'meter_ref',    ref); }
async function resolveSiteUUID(ref)     { return resolveRef('sites',     'id',           ref); } // site_id already UUID in sim
async function resolveOperatorUUID(ref) { return resolveRef('operators', 'id',           ref); }

async function resolveRef(table, col, val) {
  const key = `${table}:${val}`;
  if (idCache[key]) return idCache[key];
  const { data } = await supabase.from(table).select('id').eq(col, val).single();
  if (data) idCache[key] = data.id;
  return data?.id || null;
}

async function insertBillingEvent({ meter_ref, site_ref, operator_ref, type, amount_tzs, energy_kwh, tariff, balance_after }) {
  const [meter_id, site_id, operator_id] = await Promise.all([
    resolveMeterUUID(meter_ref),
    resolveSiteUUID(site_ref),
    resolveOperatorUUID(operator_ref),
  ]);
  if (!meter_id || !site_id || !operator_id) return;

  const { data: customer } = await supabase
    .from('customers').select('id').eq('meter_id', meter_id).single();
  if (!customer) return;

  await supabase.from('billing_events').insert({
    customer_id:        customer.id,
    operator_id,
    site_id,
    meter_id,
    event_type:         type,
    amount_tzs:         parseFloat(amount_tzs.toFixed(4)),
    balance_after:      parseFloat(balance_after.toFixed(2)),
    energy_kwh:         energy_kwh,
    tariff_tzs_per_kwh: tariff,
  });
}

// ─── Main ─────────────────────────────────────────────────────
export async function startMqttBridge() {
  console.log(`MQTT Bridge connecting to ${BROKER_URL}...`);

  const client = mqtt.connect(BROKER_URL, {
    clientId: CLIENT_ID,
    clean: true,
    connectTimeout: 10_000,
    reconnectPeriod: 5_000,
  });

  client.on('connect', () => {
    console.log('✓ MQTT Bridge connected\n');

    client.subscribe([
      `${TOPIC_PRE}/+/+/meters/+/readings`,
      `${TOPIC_PRE}/+/+/alerts`,
    ], { qos: 1 });
  });

  client.on('message', async (topic, raw) => {
    let payload;
    try { payload = JSON.parse(raw.toString()); }
    catch { return; }

    try {
      if (topic.includes('/readings')) await handleReading(payload);
      else if (topic.includes('/alerts')) await handleAlert(payload);
    } catch (err) {
      console.error(`Bridge error on ${topic}:`, err.message);
    }
  });

  client.on('error', err => console.error('MQTT Bridge error:', err.message));
  client.on('offline', () => console.warn('MQTT Bridge offline'));
}
