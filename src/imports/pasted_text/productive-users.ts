/**
 * GridOS — Productive Use & Grid Arrival Services
 */

import { supabase } from '../db.js';
import { scoreSingleCustomer } from '../ai/creditScore.js';

// ─────────────────────────────────────────────────────────────
// PRODUCTIVE USE APPLIANCE TRACKING
// Identifies customers with productive-use consumption signatures
// and generates financing referrals to CLASP / ENGIE catalogs.
// ─────────────────────────────────────────────────────────────

const PRODUCTIVE_SIGNATURES = {
  grain_mill:      { min_w: 1500, peak_hours: [8,18], daily_kwh_min: 8 },
  cold_storage:    { min_w: 200,  peak_hours: [0, 24], daily_kwh_min: 4, continuous: true },
  water_pump:      { min_w: 750,  peak_hours: [6, 18], daily_kwh_min: 3 },
  welding:         { min_w: 3000, peak_hours: [8, 17], sporadic: true },
  barbershop:      { min_w: 300,  peak_hours: [8, 20], daily_kwh_min: 1.5 },
};

export async function identifyProductiveUsers(siteId) {
  const { data: meters } = await supabase
    .from('meters')
    .select(`id, meter_ref, customers(id, full_name, phone, customer_type, balance_tzs)`)
    .eq('site_id', siteId);

  const results = [];

  for (const meter of (meters || [])) {
    const cust = meter.customers;
    if (!cust) continue;

    // Pull hourly averages for this meter
    const { data: hourly } = await supabase
      .from('meter_readings_hourly')
      .select('bucket, avg_power_w, total_kwh')
      .eq('meter_id', meter.id)
      .order('bucket', { ascending: false })
      .limit(168);  // 7 days × 24 hours

    if (!hourly?.length) continue;

    const dailyKwh  = hourly.reduce((s, r) => s + parseFloat(r.total_kwh || 0), 0) / 7;
    const peakPower = Math.max(...hourly.map(r => parseFloat(r.avg_power_w || 0)));
    const avgPower  = hourly.reduce((s, r) => s + parseFloat(r.avg_power_w || 0), 0) / hourly.length;

    // Score productive-use likelihood
    let productiveScore = 0;
    const detectedEquipment = [];

    if (peakPower > 1500) { productiveScore += 30; detectedEquipment.push('mill_or_pump'); }
    if (peakPower > 200 && avgPower > 150) { productiveScore += 25; detectedEquipment.push('cold_storage'); }
    if (dailyKwh > 8) { productiveScore += 20; }
    if (dailyKwh > 4 && cust.customer_type === 'business') { productiveScore += 15; }

    if (productiveScore >= 40) {
      const creditScore = await scoreSingleCustomer(cust.id);
      results.push({
        customer_id:       cust.id,
        meter_ref:         meter.meter_ref,
        name:              cust.full_name,
        phone:             cust.phone,
        productive_score:  productiveScore,
        daily_kwh:         parseFloat(dailyKwh.toFixed(2)),
        peak_power_w:      Math.round(peakPower),
        detected_equipment: detectedEquipment,
        credit_score:      creditScore?.score,
        credit_tier:       creditScore?.tier,
        recommended_appliances: getApplianceRecommendations(peakPower, dailyKwh),
        financing_eligible: (creditScore?.score || 0) >= 50,
      });
    }
  }

  return results.sort((a, b) => b.productive_score - a.productive_score);
}

function getApplianceRecommendations(peakW, dailyKwh) {
  const recs = [];
  if (dailyKwh > 4 && peakW < 500)  recs.push({ type:'Solar fridge', brand:'Sunridge SF-100', est_kwh_day: 1.2, clasp_url: 'https://www.clasp.ngo/research/solar-powered-refrigerators/' });
  if (peakW > 200 && dailyKwh < 4)  recs.push({ type:'Efficient fan + lighting kit', brand:'d.light D30', est_kwh_day: 0.3 });
  if (dailyKwh > 8)                  recs.push({ type:'Grain mill (AC)', brand:'Posho Mill 7.5kW', est_kwh_day: 12, financing_url: 'https://www.energizing-development.org/' });
  return recs;
}


// ─────────────────────────────────────────────────────────────
// GRID ARRIVAL TRANSITION MANAGER
// When TANESCO/KPLC extends grid to a mini-grid site, this service:
//   1. Generates EWURA compensation claim (asset valuation)
//   2. Exports customer records in TANESCO import format
//   3. Calculates final billing settlement
//   4. Archives site to read-only mode
// ─────────────────────────────────────────────────────────────

export async function generateGridArrivalPackage(siteId) {
  const { data: site }      = await supabase.from('sites').select('*').eq('id', siteId).single();
  const { data: meters }    = await supabase.from('meters').select('*').eq('site_id', siteId);
  const { data: customers } = await supabase.from('customers').select('*').eq('site_id', siteId);
  const { data: readings }  = await supabase.from('meter_readings_hourly').select('total_kwh').eq('site_id', siteId);

  const totalKwh        = (readings || []).reduce((s, r) => s + parseFloat(r.total_kwh || 0), 0);
  const yearsOperating  = site?.commissioned_at
    ? (Date.now() - new Date(site.commissioned_at)) / (365.25 * 86400000) : 2;

  // EWURA asset valuation (Rule 18 compensation framework)
  const original_capex_usd  = (site?.capacity_kw || 50) * 4500;
  const depreciation_pct    = Math.min(0.7, yearsOperating * 0.1);  // 10%/yr max 70%
  const net_asset_value_usd = original_capex_usd * (1 - depreciation_pct);

  // Customer data in TANESCO import format
  const tanesco_customers = (customers || []).map(c => ({
    tanesco_account:    null,  // assigned by TANESCO on import
    full_name:          c.full_name,
    phone:              c.phone,
    national_id:        c.national_id,
    meter_serial:       (meters || []).find(m => m.id === c.meter_id)?.serial_number,
    meter_brand:        (meters || []).find(m => m.id === c.meter_id)?.brand,
    customer_type:      c.customer_type,
    address:            c.installation_address,
    final_balance_tzs:  c.balance_tzs,
    history_kwh:        null,  // would pull from meter readings
  }));

  // Final billing settlement report
  const { data: finalEvents } = await supabase
    .from('billing_events')
    .select('amount_tzs, event_type')
    .eq('site_id', siteId);

  const totalRevenue   = (finalEvents || []).filter(e => e.amount_tzs > 0)
    .reduce((s, e) => s + parseFloat(e.amount_tzs), 0);
  const totalBalances  = (customers || []).reduce((s, c) => s + parseFloat(c.balance_tzs || 0), 0);

  return {
    package_type:          'GRID_ARRIVAL_TRANSITION',
    generated_at:          new Date().toISOString(),
    site:                  { id: siteId, name: site?.name, capacity_kw: site?.capacity_kw },

    ewura_compensation: {
      original_capex_usd:     parseFloat(original_capex_usd.toFixed(2)),
      years_operating:        parseFloat(yearsOperating.toFixed(1)),
      depreciation_pct:       parseFloat((depreciation_pct * 100).toFixed(1)),
      net_asset_value_usd:    parseFloat(net_asset_value_usd.toFixed(2)),
      total_kwh_delivered:    parseFloat(totalKwh.toFixed(2)),
      ewura_rule:             'Rule 18 — Grid Arrival Compensation Framework',
      submission_to:          'EWURA Dar es Salaam',
    },

    customer_handover: {
      total_customers:        customers?.length || 0,
      total_outstanding_balance_tzs: parseFloat(totalBalances.toFixed(2)),
      tanesco_import_file:    tanesco_customers,
      format:                 'TANESCO_CSV_v3',
    },

    financial_summary: {
      lifetime_revenue_tzs:   parseFloat(totalRevenue.toFixed(2)),
      outstanding_credits_tzs: parseFloat(totalBalances.toFixed(2)),
      gridios_transition_fee: 1000,  // $1,000 per site transition
    },

    next_steps: [
      '1. Submit EWURA compensation claim with this package',
      '2. Export tanesco_import_file.csv to TANESCO customer migration team',
      '3. Refund outstanding customer balances via mobile money',
      '4. Archive site in GridOS (read-only mode)',
      '5. Retain 7 years of billing records per EWURA data retention rules',
    ],
  };
}
