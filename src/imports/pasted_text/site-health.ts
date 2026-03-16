/**
 * GridOS — Digital Twin / Site Health Engine
 *
 * Models expected solar generation vs actual meter readings.
 * Divergence = technical losses, panel degradation, shading, or theft.
 *
 * Solar model inputs:
 *   - Global Horizontal Irradiance (GHI) from Global Solar Atlas API
 *   - Panel rated capacity (site.capacity_kw)
 *   - System efficiency factor (0.78 typical for SSA off-grid)
 *   - Panel degradation rate (0.5%/year)
 *
 * Site health score (0–100):
 *   100 = no losses detected, full generation, all meters reporting
 *   0   = severe losses, generation far below model, multiple tamper events
 */

import { supabase } from '../db.js';
import axios from 'axios';

const SYSTEM_EFFICIENCY    = 0.78;   // inverter + wiring + battery losses
const PANEL_DEGRADATION_YR = 0.005; // 0.5% per year
const TECHNICAL_LOSS_NORM  = 0.08;  // 8% technical losses = healthy baseline

// ─── Solar irradiance estimate (fallback when no API key) ──────
// Based on Global Solar Atlas averages for East Africa (Tanzania ~5.5 kWh/m²/day)
function estimateGHI(lat, lon, month) {
  // Monthly GHI index for equatorial East Africa (relative to annual avg)
  const EA_MONTHLY_GHI = [1.05, 1.08, 1.00, 0.92, 0.88, 0.90, 0.93, 0.98, 1.02, 1.05, 1.00, 1.02];
  const BASE_GHI_KWH   = 5.5;  // kWh/m²/day annual average (Tanzania)
  return BASE_GHI_KWH * (EA_MONTHLY_GHI[month - 1] || 1.0);
}

// ─── Fetch actual generation from meter readings ───────────────
async function getActualGeneration(siteId, date) {
  const start = `${date}T00:00:00Z`;
  const end   = `${date}T23:59:59Z`;

  const { data } = await supabase
    .from('meter_readings_hourly')
    .select('total_kwh')
    .eq('site_id', siteId)
    .gte('bucket', start)
    .lte('bucket', end);

  return (data || []).reduce((s, r) => s + parseFloat(r.total_kwh || 0), 0);
}

// ─── Core digital twin calculation ────────────────────────────
export async function computeSiteHealth(siteId) {
  const { data: site } = await supabase
    .from('sites')
    .select('capacity_kw, latitude, longitude, commissioned_at, name')
    .eq('id', siteId)
    .single();

  if (!site) return null;

  const now         = new Date();
  const month       = now.getMonth() + 1;
  const yearsOld    = site.commissioned_at
    ? (now - new Date(site.commissioned_at)) / (365.25 * 86400000)
    : 1;

  // Expected daily generation (kWh)
  const ghi               = estimateGHI(site.latitude, site.longitude, month);
  const degradationFactor = 1 - (PANEL_DEGRADATION_YR * yearsOld);
  const expected_kwh_day  = site.capacity_kw * ghi * SYSTEM_EFFICIENCY * degradationFactor;

  // Actual generation (last 7 days average)
  const actualDays = [];
  for (let d = 1; d <= 7; d++) {
    const date = new Date(now - d * 86400000).toISOString().slice(0, 10);
    const kwh  = await getActualGeneration(siteId, date);
    if (kwh > 0) actualDays.push(kwh);
  }
  const actual_kwh_avg = actualDays.length > 0
    ? actualDays.reduce((a, b) => a + b, 0) / actualDays.length
    : expected_kwh_day * (1 - TECHNICAL_LOSS_NORM);  // fallback estimate

  // Loss calculation
  const loss_kwh      = Math.max(0, expected_kwh_day - actual_kwh_avg);
  const loss_pct      = expected_kwh_day > 0 ? (loss_kwh / expected_kwh_day) * 100 : 0;
  const excess_loss   = Math.max(0, loss_pct - TECHNICAL_LOSS_NORM * 100);

  // Meter health sub-score
  const { data: meters } = await supabase
    .from('meters')
    .select('status')
    .eq('site_id', siteId);

  const totalMeters  = (meters || []).length;
  const activeMeters = (meters || []).filter(m => m.status === 'active').length;
  const tamperCount  = (meters || []).filter(m => m.status === 'tampered').length;
  const meterHealth  = totalMeters > 0 ? (activeMeters / totalMeters) * 100 : 100;

  // Active alerts sub-score
  const { count: alertCount } = await supabase
    .from('alerts')
    .select('id', { count: 'exact', head: true })
    .eq('site_id', siteId)
    .eq('resolved', false)
    .in('severity', ['high', 'critical']);

  // Composite health score
  const generationScore = Math.max(0, 100 - excess_loss * 3);
  const meterScore      = meterHealth;
  const alertScore      = Math.max(0, 100 - (alertCount || 0) * 10);
  const health_score    = Math.round(
    generationScore * 0.45 +
    meterScore      * 0.35 +
    alertScore      * 0.20
  );

  const status = health_score >= 85 ? 'healthy'
               : health_score >= 65 ? 'attention'
               : health_score >= 40 ? 'warning' : 'critical';

  const recommendations = [];
  if (excess_loss > 15) recommendations.push('Technical losses above 15% — inspect distribution lines and meter seals');
  if (tamperCount > 0)  recommendations.push(`${tamperCount} tamper event(s) detected — field inspection required`);
  if (meterHealth < 80) recommendations.push(`${totalMeters - activeMeters} meters offline — check GPRS connectivity`);
  if (yearsOld > 5)     recommendations.push('Panel degradation accumulating — consider performance assessment');

  return {
    site_id:              siteId,
    site_name:            site.name,
    computed_at:          now.toISOString(),
    health_score,
    status,
    generation: {
      expected_kwh_day:   parseFloat(expected_kwh_day.toFixed(2)),
      actual_kwh_avg:     parseFloat(actual_kwh_avg.toFixed(2)),
      loss_kwh:           parseFloat(loss_kwh.toFixed(2)),
      loss_pct:           parseFloat(loss_pct.toFixed(1)),
      excess_loss_pct:    parseFloat(excess_loss.toFixed(1)),
      ghi_estimate:       ghi,
      system_efficiency:  SYSTEM_EFFICIENCY,
    },
    meters: {
      total: totalMeters,
      active: activeMeters,
      tampered: tamperCount,
      health_pct: parseFloat(meterHealth.toFixed(1)),
    },
    active_critical_alerts: alertCount || 0,
    recommendations,
    score_breakdown: {
      generation: parseFloat(generationScore.toFixed(1)),
      meter_health: parseFloat(meterScore.toFixed(1)),
      alert_status: parseFloat(alertScore.toFixed(1)),
    },
  };
}
