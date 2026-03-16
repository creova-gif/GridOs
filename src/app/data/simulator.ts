// Simulates MQTT meter data updates
import { SITE, METERS, LOAD_PROFILES } from './site-config';

export interface MeterReading {
  message_id: string;
  meter_id: string;
  meter_serial: string;
  meter_brand: string;
  site_id: string;
  operator_id: string;
  timestamp: string;
  power_w: number;
  voltage_v: number;
  current_a: number;
  frequency_hz: number;
  power_factor: number;
  energy_kwh_interval: number;
  cumulative_kwh: number;
  balance_tzs: number;
  tariff_tzs_per_kwh: number;
  cost_interval_tzs: number;
  customer_type: string;
  connected: boolean;
  tamper_detected: boolean;
  rssi_dbm: number;
  firmware: string;
}

export interface MeterStatus {
  meter_id: string;
  connected: boolean;
  balance_tzs: number;
  power_w: number;
  tamper: boolean;
  timestamp: string;
}

export interface Alert {
  id: string;
  type: 'DISCONNECTED' | 'LOW_CREDIT' | 'TAMPER' | 'UNDER_VOLTAGE';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  meter_id: string;
  site_id: string;
  timestamp: string;
  balance_tzs?: number;
  voltage_v?: number;
}

export interface SiteSummary {
  site_id: string;
  site_name: string;
  timestamp: string;
  meters_total: number;
  meters_connected: number;
  meters_zero_balance: number;
  meters_low_credit: number;
  meters_tamper: number;
  total_load_w: number;
  capacity_kw: number;
  utilization_pct: number;
  total_revenue_today_tzs: number;
  collection_rate_pct: number;
}

interface MeterState {
  id: string;
  serial: string;
  brand: string;
  model: string;
  customer: { name: string; type: string; phone: string };
  initial_balance_tzs: number;
  load_profile: string;
  phase: string;
  balance_tzs: number;
  cumulative_kwh: number;
  voltage: number;
  tamper: boolean;
  connected: boolean;
  last_reading_at: string | null;
  total_paid_tzs: number;
  token_count: number;
}

const INTERVAL = 5000; // 5 seconds

// Initialize meter state
const state: MeterState[] = METERS.map((m) => ({
  ...m,
  balance_tzs: m.initial_balance_tzs,
  cumulative_kwh: parseFloat((Math.random() * 200 + 50).toFixed(3)),
  voltage: 230,
  tamper: false,
  connected: m.load_profile !== 'disconnected',
  last_reading_at: null,
  total_paid_tzs: m.initial_balance_tzs + Math.floor(Math.random() * 50000),
  token_count: Math.floor(Math.random() * 12) + 1,
}));

function variance(base: number, pct: number = 0.15): number {
  return base * (1 + (Math.random() - 0.5) * 2 * pct);
}

function currentPowerW(meter: MeterState): number {
  if (!meter.connected || meter.balance_tzs <= 0) return 0;
  const hour = new Date().getHours();
  const profile = LOAD_PROFILES[meter.load_profile];
  return Math.max(0, Math.round(variance(profile[hour], 0.20)));
}

function tariffForMeter(meter: MeterState): number {
  return SITE.tariff_tzs_per_kwh[meter.customer.type as keyof typeof SITE.tariff_tzs_per_kwh] || SITE.tariff_tzs_per_kwh.residential;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function buildReading(meter: MeterState): MeterReading {
  const power_w = currentPowerW(meter);
  const energy_wh = (power_w * INTERVAL) / 3_600_000;
  const energy_kwh = energy_wh / 1000;
  const cost_tzs = energy_kwh * tariffForMeter(meter);

  // Update cumulative state
  meter.cumulative_kwh = parseFloat((meter.cumulative_kwh + energy_kwh).toFixed(4));
  meter.balance_tzs = Math.max(0, meter.balance_tzs - cost_tzs);

  // Simulate occasional tamper event (1 in 200 readings)
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
    message_id: generateId(),
    meter_id: meter.id,
    meter_serial: meter.serial,
    meter_brand: meter.brand,
    site_id: SITE.id,
    operator_id: SITE.operator,
    timestamp: meter.last_reading_at,
    power_w: power_w,
    voltage_v: meter.voltage,
    current_a: parseFloat((power_w / meter.voltage).toFixed(3)),
    frequency_hz: parseFloat(variance(50, 0.005).toFixed(2)),
    power_factor: parseFloat(variance(0.92, 0.05).toFixed(3)),
    energy_kwh_interval: parseFloat(energy_kwh.toFixed(6)),
    cumulative_kwh: meter.cumulative_kwh,
    balance_tzs: parseFloat(meter.balance_tzs.toFixed(2)),
    tariff_tzs_per_kwh: tariffForMeter(meter),
    cost_interval_tzs: parseFloat(cost_tzs.toFixed(4)),
    customer_type: meter.customer.type,
    connected: meter.connected,
    tamper_detected: meter.tamper,
    rssi_dbm: Math.round(variance(-72, 0.15)),
    firmware: '2.4.1',
  };
}

function buildSiteSummary(): SiteSummary {
  const active = state.filter((m) => m.connected);
  const total_w = active.reduce((s, m) => s + currentPowerW(m), 0);
  const low_credit = state.filter((m) => m.balance_tzs > 0 && m.balance_tzs < 3000);
  const zero_bal = state.filter((m) => m.balance_tzs <= 0);
  const tampered = state.filter((m) => m.tamper);

  return {
    site_id: SITE.id,
    site_name: SITE.name,
    timestamp: new Date().toISOString(),
    meters_total: state.length,
    meters_connected: active.length,
    meters_zero_balance: zero_bal.length,
    meters_low_credit: low_credit.length,
    meters_tamper: tampered.length,
    total_load_w: total_w,
    capacity_kw: SITE.capacity_kw,
    utilization_pct: parseFloat(((total_w / (SITE.capacity_kw * 1000)) * 100).toFixed(1)),
    total_revenue_today_tzs: Math.round(state.reduce((s, m) => s + m.initial_balance_tzs - m.balance_tzs, 0)),
    collection_rate_pct: parseFloat(((active.length / state.length) * 100).toFixed(1)),
  };
}

function checkAlerts(meter: MeterState, reading: MeterReading): Alert[] {
  const alerts: Alert[] = [];

  if (reading.balance_tzs <= 0 && meter.connected === false) {
    alerts.push({
      id: generateId(),
      type: 'DISCONNECTED',
      severity: 'high',
      message: `${meter.customer.name} disconnected — zero balance`,
      meter_id: meter.id,
      site_id: SITE.id,
      timestamp: reading.timestamp,
      balance_tzs: 0,
    });
  }
  if (reading.balance_tzs > 0 && reading.balance_tzs < 3000) {
    alerts.push({
      id: generateId(),
      type: 'LOW_CREDIT',
      severity: 'medium',
      message: `${meter.customer.name} low credit: TZS ${reading.balance_tzs.toFixed(0)}`,
      meter_id: meter.id,
      site_id: SITE.id,
      timestamp: reading.timestamp,
      balance_tzs: reading.balance_tzs,
    });
  }
  if (reading.tamper_detected) {
    alerts.push({
      id: generateId(),
      type: 'TAMPER',
      severity: 'critical',
      message: `Tamper detected on meter ${meter.serial} (${meter.customer.name})`,
      meter_id: meter.id,
      site_id: SITE.id,
      timestamp: reading.timestamp,
    });
  }
  if (reading.voltage_v < 210) {
    alerts.push({
      id: generateId(),
      type: 'UNDER_VOLTAGE',
      severity: 'medium',
      message: `Under-voltage on ${meter.id}: ${reading.voltage_v}V`,
      meter_id: meter.id,
      site_id: SITE.id,
      timestamp: reading.timestamp,
      voltage_v: reading.voltage_v,
    });
  }

  return alerts;
}

export class MeterSimulator {
  private listeners: {
    onReading?: (reading: MeterReading) => void;
    onStatus?: (status: MeterStatus) => void;
    onAlert?: (alert: Alert) => void;
    onSummary?: (summary: SiteSummary) => void;
  } = {};
  private interval: NodeJS.Timeout | null = null;
  private tick = 0;

  start() {
    this.interval = setInterval(() => {
      this.tick++;
      const allAlerts: Alert[] = [];

      // Process each meter
      state.forEach((meter) => {
        const reading = buildReading(meter);
        this.listeners.onReading?.(reading);

        // Status summary
        const status: MeterStatus = {
          meter_id: meter.id,
          connected: meter.connected,
          balance_tzs: parseFloat(meter.balance_tzs.toFixed(2)),
          power_w: reading.power_w,
          tamper: meter.tamper,
          timestamp: reading.timestamp,
        };
        this.listeners.onStatus?.(status);

        // Check for alerts
        const alerts = checkAlerts(meter, reading);
        alerts.forEach((alert) => {
          allAlerts.push(alert);
          this.listeners.onAlert?.(alert);
        });
      });

      // Site summary every 3 ticks
      if (this.tick % 3 === 0) {
        const summary = buildSiteSummary();
        this.listeners.onSummary?.(summary);
      }
    }, INTERVAL);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  on(
    event: 'reading' | 'status' | 'alert' | 'summary',
    callback: (data: any) => void
  ) {
    if (event === 'reading') this.listeners.onReading = callback;
    if (event === 'status') this.listeners.onStatus = callback;
    if (event === 'alert') this.listeners.onAlert = callback;
    if (event === 'summary') this.listeners.onSummary = callback;
  }

  getState() {
    return state;
  }

  getCurrentSummary(): SiteSummary {
    return buildSiteSummary();
  }
}
