/**
 * GridOS — AI Load Forecasting Service
 *
 * Generates 24-hour and 7-day load forecasts per site using:
 *   - Historical hourly averages from meter_readings_hourly (TimescaleDB continuous aggregate)
 *   - Time-of-day seasonality (24-hour cycle)
 *   - Day-of-week seasonality
 *   - Agricultural season index (EA-specific: planting Mar-May, harvest Jul-Sep)
 *
 * In production: swap the JS implementation below for a Python FastAPI
 * microservice using Prophet or LightGBM trained on the full hypertable.
 * The API contract stays identical — REST endpoint, same JSON shape.
 *
 * Python service entrypoint: gridios-ml/src/forecast_service.py
 */

import { supabase } from '../db.js';

// ─── East Africa agricultural season index ────────────────────
// Drives demand multipliers — planting season = pump irrigation load,
// harvest = processing equipment, dry season = lowest consumption
const EA_SEASON = {
  1: 0.92,   // Jan  — dry
  2: 0.90,   // Feb  — dry
  3: 1.08,   // Mar  — long rains / planting
  4: 1.12,   // Apr  — long rains peak
  5: 1.10,   // May  — long rains end
  6: 1.00,   // Jun  — cool dry
  7: 1.15,   // Jul  — harvest begins
  8: 1.18,   // Aug  — harvest peak
  9: 1.14,   // Sep  — harvest end
  10: 0.98,  // Oct  — short rains start
  11: 1.02,  // Nov  — short rains
  12: 0.95,  // Dec  — dry
};

// ─── Fetch historical hourly averages for a site ──────────────
async function getHourlyBaseline(siteId, days = 14) {
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const { data, error } = await supabase
    .from('meter_readings_hourly')
    .select('bucket, avg_power_w, total_kwh')
    .eq('site_id', siteId)
    .gte('bucket', since)
    .order('bucket', { ascending: true });

  if (error || !data?.length) return null;

  // Build hour-of-day average profile (24 buckets)
  const hourSums   = new Array(24).fill(0);
  const hourCounts = new Array(24).fill(0);

  data.forEach(row => {
    const h = new Date(row.bucket).getHours();
    hourSums[h]   += parseFloat(row.avg_power_w || 0);
    hourCounts[h] += 1;
  });

  return hourSums.map((s, h) => (hourCounts[h] > 0 ? s / hourCounts[h] : 0));
}

// ─── Fallback profile when no historical data available ───────
// Based on AMDA BAM 2024 typical East Africa rural mini-grid load curve
const FALLBACK_PROFILE_W = [
  120, 95, 80, 70, 65, 90,       // 0–5   midnight to dawn
  180, 320, 450, 520, 540, 530,  // 6–11  morning rise
  510, 490, 470, 460, 510, 680,  // 12–17 afternoon + school out
  820, 940, 880, 720, 520, 310,  // 18–23 evening peak
];

// ─── Core forecast function ───────────────────────────────────
export async function forecastSite(siteId, horizonHours = 24) {
  const baseline = await getHourlyBaseline(siteId) || FALLBACK_PROFILE_W;
  const now      = new Date();
  const month    = now.getMonth() + 1;
  const seasonIdx = EA_SEASON[month] || 1.0;

  // Day-of-week multipliers (Fri/Sat market days = higher productive use)
  const DOW_MULT = [0.95, 0.98, 1.00, 1.00, 1.02, 1.10, 1.05];

  const forecast = [];
  for (let h = 0; h < horizonHours; h++) {
    const ts      = new Date(now.getTime() + h * 3600000);
    const hour    = ts.getHours();
    const dow     = ts.getDay();
    const base    = baseline[hour] || 0;
    const pred_w  = base * seasonIdx * DOW_MULT[dow];
    const noise   = pred_w * (Math.random() - 0.5) * 0.06;  // ±3% stochastic noise

    forecast.push({
      timestamp:    ts.toISOString(),
      hour_of_day:  hour,
      predicted_w:  Math.max(0, Math.round(pred_w + noise)),
      predicted_kwh: parseFloat(((pred_w + noise) / 1000).toFixed(4)),
      season_index: seasonIdx,
      confidence:   baseline === FALLBACK_PROFILE_W ? 'low' : 'high',
    });
  }

  // Summary stats
  const totalKwh     = forecast.reduce((s, f) => s + f.predicted_kwh, 0);
  const peakEntry    = forecast.reduce((a, b) => a.predicted_w > b.predicted_w ? a : b);
  const valleyEntry  = forecast.reduce((a, b) => a.predicted_w < b.predicted_w ? a : b);

  return {
    site_id:         siteId,
    generated_at:    now.toISOString(),
    horizon_hours:   horizonHours,
    season:          month,
    season_index:    seasonIdx,
    total_kwh_24h:   parseFloat(totalKwh.toFixed(2)),
    peak_w:          peakEntry.predicted_w,
    peak_at:         peakEntry.timestamp,
    valley_w:        valleyEntry.predicted_w,
    valley_at:       valleyEntry.timestamp,
    confidence:      baseline === FALLBACK_PROFILE_W ? 'low' : 'high',
    model:           'hourly_baseline_v1',
    forecast,
  };
}

// ─── Weekly energy demand forecast ───────────────────────────
export async function forecastWeek(siteId) {
  const daily = [];
  const now   = new Date();

  for (let d = 0; d < 7; d++) {
    const dayForecast = await forecastSite(siteId, 24);
    const date = new Date(now.getTime() + d * 86400000);
    daily.push({
      date:           date.toISOString().slice(0, 10),
      day_of_week:    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getDay()],
      predicted_kwh:  dayForecast.total_kwh_24h,
      predicted_peak_w: dayForecast.peak_w,
    });
  }

  return {
    site_id:      siteId,
    generated_at: now.toISOString(),
    week_total_kwh: parseFloat(daily.reduce((s, d) => s + d.predicted_kwh, 0).toFixed(2)),
    days: daily,
  };
}
