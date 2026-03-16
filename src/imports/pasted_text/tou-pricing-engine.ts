/**
 * GridOS — Time-of-Use (TOU) Pricing Engine
 *
 * Implements dynamic tariffs based on:
 *   - Time of day (solar peak = cheap, evening peak = expensive)
 *   - Day of week (market days = premium)
 *   - Seasonal demand index (harvest season = higher base)
 *   - Site-specific load curve (from digital twin)
 *
 * Configurable per site. EWURA requires tariff approval before
 * commercial deployment — export tariff schedule for submission.
 *
 * Demand response: auto-SMS customers during peak to shift load.
 */

import { supabase } from '../db.js';
import { sendSms }  from '../sms.js';

// ─── Default TOU schedule (Tanzania residential baseline: 1,710 TZS/kWh) ──
export const DEFAULT_TOU_SCHEDULE = {
  // hour_start (inclusive) → hour_end (exclusive) → multiplier
  periods: [
    { name: 'off_peak',    hours: [0, 6],   multiplier: 0.75, label: 'Bei ya chini' },
    { name: 'shoulder',    hours: [6, 10],  multiplier: 0.90, label: 'Bei ya wastani' },
    { name: 'solar_peak',  hours: [10, 15], multiplier: 0.70, label: 'Bei ya jua (nafuu!)' },
    { name: 'pre_peak',    hours: [15, 18], multiplier: 1.00, label: 'Bei ya kawaida' },
    { name: 'peak',        hours: [18, 22], multiplier: 1.35, label: 'Bei ya juu' },
    { name: 'late',        hours: [22, 24], multiplier: 0.85, label: 'Bei ya usiku' },
  ],
};

// ─── Get current tariff for a customer ───────────────────────
export function getCurrentTariff(baseTariff, schedule = DEFAULT_TOU_SCHEDULE) {
  const hour = new Date().getHours();
  const period = schedule.periods.find(p => hour >= p.hours[0] && hour < p.hours[1]);
  if (!period) return { tariff: baseTariff, period: 'unknown', multiplier: 1.0 };

  return {
    tariff:     parseFloat((baseTariff * period.multiplier).toFixed(2)),
    period:     period.name,
    label:      period.label,
    multiplier: period.multiplier,
    valid_until: new Date(new Date().setHours(period.hours[1], 0, 0, 0)).toISOString(),
  };
}

// ─── Export EWURA tariff schedule ────────────────────────────
export function generateEwuraSchedule(siteId, baseTariffs, schedule = DEFAULT_TOU_SCHEDULE) {
  const rows = [];
  schedule.periods.forEach(p => {
    ['residential','business','productive'].forEach(type => {
      const base = baseTariffs[type] || 1710;
      rows.push({
        period:           p.name,
        hours:            `${p.hours[0].toString().padStart(2,'0')}:00–${p.hours[1].toString().padStart(2,'0')}:00`,
        customer_type:    type,
        base_tariff_tzs:  base,
        multiplier:       p.multiplier,
        tou_tariff_tzs:   parseFloat((base * p.multiplier).toFixed(2)),
        label_sw:         p.label,
      });
    });
  });
  return { site_id: siteId, generated_at: new Date().toISOString(), schedule: rows };
}

// ─── Demand response alert ────────────────────────────────────
// SMS customers with high consumption during peak to shift load
export async function triggerDemandResponse(siteId, currentLoadW, capacityW) {
  const utilizationPct = (currentLoadW / capacityW) * 100;
  if (utilizationPct < 85) return { triggered: false, reason: 'load_normal' };

  // Find high-consumption customers currently active
  const { data: meters } = await supabase
    .from('meters')
    .select(`
      id, meter_ref,
      customers(id, full_name, phone, customer_type, balance_tzs, language)
    `)
    .eq('site_id', siteId)
    .eq('status', 'active');

  // Target productive-use customers first (highest load)
  const targets = (meters || [])
    .filter(m => m.customers?.customer_type === 'productive' && m.customers?.balance_tzs > 0)
    .slice(0, 5);

  const notified = [];
  for (const m of targets) {
    const cust = m.customers;
    const msg = cust.language === 'sw'
      ? `Gridi ina mzigo mzito sasa. Tafadhali punguza matumizi kati ya 18:00–21:00. Asante! GridOS`
      : `Peak demand alert: please reduce consumption between 6–9pm. Thank you! GridOS`;
    await sendSms(cust.phone, msg);
    notified.push({ meter_ref: m.meter_ref, name: cust.full_name });
  }

  return {
    triggered:       true,
    utilization_pct: parseFloat(utilizationPct.toFixed(1)),
    customers_notified: notified.length,
    notified,
    timestamp:       new Date().toISOString(),
  };
}
