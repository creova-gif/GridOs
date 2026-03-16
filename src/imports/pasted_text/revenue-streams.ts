/**
 * GridOS — Fintech Services
 * All 6 research-validated revenue streams in one file.
 */

import { supabase } from '../db.js';
import { sendSms }  from '../services/sms.js';

// ═══════════════════════════════════════════════════════════════
// 1. RBF MILESTONE TRACKER
// Tracks connections vs REA grant thresholds.
// Nigeria benchmark: $350–$600 per verified connection.
// Tanzania REA: ~TZS 875K–1.5M per connection (World Bank RBF).
// ═══════════════════════════════════════════════════════════════

const RBF_PROGRAMS = {
  REA_TZ: {
    name: 'REA Tanzania Results-Based Financing',
    grant_per_connection_usd: 400,
    min_connections: 50,
    min_collection_rate_pct: 70,
    eligible_customer_types: ['residential', 'business', 'productive'],
    reporting_cycle: 'quarterly',
    funder: 'World Bank / REA Tanzania',
  },
  BGFA: {
    name: 'Beyond the Grid Fund for Africa',
    grant_per_connection_usd: 350,
    min_connections: 40,
    min_collection_rate_pct: 65,
    eligible_customer_types: ['residential', 'business', 'productive', 'institutional'],
    reporting_cycle: 'biannual',
    funder: 'Nefco / EU / SIDA',
  },
  NEP_NG: {
    name: 'Nigeria Electrification Project (reference)',
    grant_per_connection_usd: 500,
    min_connections: 100,
    min_collection_rate_pct: 75,
    reporting_cycle: 'quarterly',
    funder: 'World Bank / REA Nigeria',
  },
};

export async function getRbfMilestones(siteId, programKey = 'REA_TZ') {
  const program = RBF_PROGRAMS[programKey];
  const { data: customers } = await supabase.from('customers')
    .select('id, customer_type, balance_tzs, created_at, active')
    .eq('site_id', siteId);

  const now = new Date();
  const quarter_start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);

  const total       = (customers || []).length;
  const active      = (customers || []).filter(c => c.active && c.balance_tzs > 0);
  const new_this_q  = (customers || []).filter(c => new Date(c.created_at) >= quarter_start);
  const collection_rate = total > 0 ? (active.length / total) * 100 : 0;

  const eligible    = total >= program.min_connections && collection_rate >= program.min_collection_rate_pct;
  const est_grant   = eligible ? total * program.grant_per_connection_usd : 0;
  const gap_connections = Math.max(0, program.min_connections - total);
  const gap_collection  = Math.max(0, program.min_collection_rate_pct - collection_rate);

  const milestones = [
    { label: `${program.min_connections} verified connections`, target: program.min_connections, current: total, met: total >= program.min_connections },
    { label: `${program.min_collection_rate_pct}% collection rate`, target: program.min_collection_rate_pct, current: parseFloat(collection_rate.toFixed(1)), unit: '%', met: collection_rate >= program.min_collection_rate_pct },
    { label: 'LOIS/EWURA registration', target: 1, current: 1, met: true },  // operator confirms this
    { label: 'Smart meter data available', target: 1, current: 1, met: true },
    { label: 'Quarterly report submitted', target: 1, current: 0, met: false },
  ];

  return {
    site_id: siteId,
    program,
    connections: { total, active: active.length, new_this_quarter: new_this_q.length },
    collection_rate_pct: parseFloat(collection_rate.toFixed(1)),
    eligible,
    estimated_grant_usd: est_grant,
    estimated_grant_tzs: est_grant * 2500,
    gaps: {
      connections_needed: gap_connections,
      collection_rate_needed: parseFloat(gap_collection.toFixed(1)),
    },
    milestones,
    next_submission: getNextQuarterDate(),
    generated_at: now.toISOString(),
  };
}

function getNextQuarterDate() {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3);
  return new Date(now.getFullYear(), (q + 1) * 3, 1).toISOString().slice(0, 10);
}

// ═══════════════════════════════════════════════════════════════
// 2. CARBON REVENUE TRACKER (live accumulation)
// ═══════════════════════════════════════════════════════════════

const CARBON_PRICES = {
  otc_africa:     3,   // USD/tCO2e — OTC voluntary renewable energy Africa
  gold_standard:  13,  // USD/tCO2e — Gold Standard certified
  compliance:     25,  // USD/tCO2e — compliance market (Article 6)
};
const EMISSION_FACTOR = 0.8; // tCO2e/MWh — IPCC East Africa diesel baseline

export async function getLiveCarbonRevenue(siteId) {
  const yearStart = `${new Date().getFullYear()}-01-01T00:00:00Z`;

  const { data: readings } = await supabase.from('meter_readings_hourly')
    .select('total_kwh, bucket')
    .eq('site_id', siteId)
    .gte('bucket', yearStart);

  const kwh_ytd      = (readings || []).reduce((s, r) => s + parseFloat(r.total_kwh || 0), 0);
  const mwh_ytd      = kwh_ytd / 1000;
  const tco2e_ytd    = mwh_ytd * EMISSION_FACTOR;
  const days_elapsed = Math.max(1, (Date.now() - new Date(yearStart)) / 86400000);
  const daily_rate   = tco2e_ytd / days_elapsed;
  const projected_yr = daily_rate * 365;

  return {
    site_id:       siteId,
    period:        'year-to-date',
    kwh_generated: parseFloat(kwh_ytd.toFixed(2)),
    mwh_generated: parseFloat(mwh_ytd.toFixed(4)),
    tco2e_avoided: parseFloat(tco2e_ytd.toFixed(4)),
    credits_issued: Math.floor(tco2e_ytd),
    revenue: {
      otc_usd:          parseFloat((tco2e_ytd * CARBON_PRICES.otc_africa).toFixed(2)),
      gold_standard_usd: parseFloat((tco2e_ytd * CARBON_PRICES.gold_standard).toFixed(2)),
      compliance_usd:   parseFloat((tco2e_ytd * CARBON_PRICES.compliance).toFixed(2)),
    },
    projected_annual: {
      tco2e:           parseFloat(projected_yr.toFixed(2)),
      otc_usd:         parseFloat((projected_yr * CARBON_PRICES.otc_africa).toFixed(2)),
      gold_standard_usd: parseFloat((projected_yr * CARBON_PRICES.gold_standard).toFixed(2)),
    },
    registry_status: 'pending_registration',
    verra_project_id: null,
    prices: CARBON_PRICES,
    generated_at: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════
// 3. PAYG CONNECTION INSTALLMENTS
// New customers pay TZS 50K–150K connection fee over 12–24 weeks
// ═══════════════════════════════════════════════════════════════

export async function createPaygInstallmentPlan(customerId, connectionFeeTzs, weeks = 16) {
  const { data: customer } = await supabase.from('customers')
    .select('*').eq('id', customerId).single();
  if (!customer) return { error: 'Customer not found' };

  const weekly_amount = Math.ceil(connectionFeeTzs / weeks);
  const plan = {
    customer_id:       customerId,
    total_fee_tzs:     connectionFeeTzs,
    weekly_amount_tzs: weekly_amount,
    weeks_total:       weeks,
    weeks_paid:        0,
    amount_paid_tzs:   0,
    amount_remaining:  connectionFeeTzs,
    status:            'active',
    next_due:          getNextWeekDate(),
    created_at:        new Date().toISOString(),
  };

  // Store as billing note (full table would be added in schema v2)
  await supabase.from('billing_events').insert({
    customer_id:  customerId,
    operator_id:  customer.operator_id,
    site_id:      customer.site_id,
    event_type:   'ADJUSTMENT_DEBIT',
    amount_tzs:   -connectionFeeTzs,
    balance_after: customer.balance_tzs,
    notes:        `PAYG connection fee plan: TZS ${connectionFeeTzs.toLocaleString()} over ${weeks} weeks`,
  });

  await sendSms(customer.phone,
    `Habari ${customer.full_name.split(' ')[0]}! Mpango wako wa malipo: ` +
    `TZS ${weekly_amount.toLocaleString()} kwa wiki ${weeks} wiki. ` +
    `Malipo ya kwanza: ${getNextWeekDate()}. Piga *150*00# kulipia.`
  );

  return { success: true, plan };
}

export async function recordInstallmentPayment(customerId, amountTzs) {
  const { data: cust } = await supabase.from('customers').select('*').eq('id', customerId).single();
  if (!cust) return { error: 'Not found' };
  const balanceAfter = cust.balance_tzs + (amountTzs * 0.1); // 10% of payment adds to energy credit
  await supabase.from('billing_events').insert({
    customer_id:  customerId,
    operator_id:  cust.operator_id,
    site_id:      cust.site_id,
    event_type:   'TOKEN_PURCHASED',
    amount_tzs:   amountTzs * 0.1,
    balance_after: balanceAfter,
    notes:        `Installment payment — TZS ${amountTzs.toLocaleString()} received`,
    payment_method: 'mpesa',
  });
  return { success: true, energy_credit_tzs: amountTzs * 0.1, balance_after: balanceAfter };
}

function getNextWeekDate() {
  return new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
}

// ═══════════════════════════════════════════════════════════════
// 4. MFI LENDING PORTAL
// Aggregates credit scores for MFI partner consumption
// ═══════════════════════════════════════════════════════════════

export async function getMfiPortfolio(siteId) {
  const { data: customers } = await supabase.from('customers')
    .select(`id, full_name, phone, customer_type, balance_tzs,
             meters(meter_ref)`)
    .eq('site_id', siteId)
    .eq('active', true);

  // Pull last 90 days billing events per customer in one query
  const since90 = new Date(Date.now() - 90 * 86400000).toISOString();
  const { data: events } = await supabase.from('billing_events')
    .select('customer_id, event_type, amount_tzs, occurred_at')
    .eq('site_id', siteId)
    .gte('occurred_at', since90);

  const eventsByCustomer = {};
  (events || []).forEach(e => {
    if (!eventsByCustomer[e.customer_id]) eventsByCustomer[e.customer_id] = [];
    eventsByCustomer[e.customer_id].push(e);
  });

  const scores = (customers || []).map(c => {
    const evts    = eventsByCustomer[c.id] || [];
    const payments = evts.filter(e => ['TOKEN_PURCHASED','CASH_COLLECTED'].includes(e.event_type));
    const freq     = payments.length / 3;
    const lastDays = payments.length > 0
      ? (Date.now() - new Date(payments[0].occurred_at)) / 86400000 : 90;
    const recency  = lastDays <= 7 ? 25 : lastDays <= 14 ? 20 : lastDays <= 30 ? 14 : lastDays <= 60 ? 8 : 2;
    const typeW    = { productive:1.15, business:1.05, institutional:1.1, residential:1.0 };
    const rawScore = recency + Math.min(20, freq * 5) + Math.round(10 * (typeW[c.customer_type]||1));
    const score    = Math.min(100, Math.round(rawScore));
    const tier     = score>=80?'excellent':score>=65?'good':score>=50?'fair':score>=35?'poor':'very_poor';

    return {
      customer_id:             c.id,
      full_name:               c.full_name,
      phone:                   c.phone,
      meter_ref:               c.meters?.meter_ref,
      customer_type:           c.customer_type,
      credit_score:            score,
      tier,
      recommended_limit_tzs:   tier==='excellent'?20000:tier==='good'?10000:tier==='fair'?5000:tier==='poor'?2000:0,
      payments_90d:            payments.length,
      current_balance_tzs:     c.balance_tzs,
    };
  });

  const portfolio_stats = {
    total_customers:   scores.length,
    excellent:         scores.filter(s=>s.tier==='excellent').length,
    good:              scores.filter(s=>s.tier==='good').length,
    fair:              scores.filter(s=>s.tier==='fair').length,
    poor:              scores.filter(s=>s.tier==='poor'||s.tier==='very_poor').length,
    avg_score:         Math.round(scores.reduce((s,c)=>s+c.credit_score,0)/Math.max(1,scores.length)),
    total_recommended_limit_tzs: scores.reduce((s,c)=>s+c.recommended_limit_tzs,0),
  };

  return {
    site_id:   siteId,
    portfolio: portfolio_stats,
    customers: scores.sort((a,b)=>b.credit_score-a.credit_score),
    mfi_export_url:  `/api/fintech/mfi/export/${siteId}`,
    generated_at: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════
// 5. RECEIVABLES PORTFOLIO (for DFI asset-backed lending)
// ═══════════════════════════════════════════════════════════════

export async function getReceivablesPortfolio(operatorId) {
  const { data: sites } = await supabase.from('sites')
    .select('id, name, capacity_kw').eq('operator_id', operatorId);

  const portfolioSites = await Promise.all((sites || []).map(async site => {
    const since90 = new Date(Date.now() - 90 * 86400000).toISOString();
    const { data: revenue } = await supabase.from('billing_events')
      .select('amount_tzs').eq('site_id', site.id)
      .gte('occurred_at', since90).gt('amount_tzs', 0);

    const { count: customers } = await supabase.from('customers')
      .select('*', { count:'exact', head:true }).eq('site_id', site.id).gt('balance_tzs', 0);

    const revenue_90d = (revenue || []).reduce((s,r) => s + parseFloat(r.amount_tzs||0), 0);
    const monthly_run_rate = (revenue_90d / 90) * 30;

    return {
      site_id:         site.id,
      site_name:       site.name,
      active_customers: customers || 0,
      revenue_90d_tzs: Math.round(revenue_90d),
      monthly_run_rate_tzs: Math.round(monthly_run_rate),
      annual_projection_tzs: Math.round(monthly_run_rate * 12),
      annual_projection_usd: Math.round((monthly_run_rate * 12) / 2500),
    };
  }));

  const totals = {
    sites: portfolioSites.length,
    total_active_customers: portfolioSites.reduce((s,x)=>s+x.active_customers,0),
    total_revenue_90d_tzs:  portfolioSites.reduce((s,x)=>s+x.revenue_90d_tzs,0),
    total_annual_usd:       portfolioSites.reduce((s,x)=>s+x.annual_projection_usd,0),
  };

  return {
    operator_id:   operatorId,
    portfolio:     totals,
    sites:         portfolioSites,
    dfi_suitability: totals.total_annual_usd >= 50000 ? 'eligible' : 'developing',
    suggested_instruments: [
      'Revenue-based financing (drawdown-on-demand)',
      'Receivables securitisation (DFI off-balance-sheet)',
      'Asset-backed lending (meter hardware as collateral)',
    ],
    generated_at: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════
// 6. BLENDED FINANCE BUILDER
// Calculates optimal grant + equity + debt mix for a new site
// ═══════════════════════════════════════════════════════════════

export function buildBlendedFinanceModel({
  capacity_kw,
  expected_connections,
  country = 'TZ',
  has_lois = true,
  has_ewura = false,
}) {
  // CAPEX model (Tanzania 2024 benchmarks from AMDA BAM report, 20% CAPEX decline since 2020)
  const capex_per_kw_usd = 4500 * 0.80; // 20% cheaper vs 2020
  const connection_cost_usd = 250; // avg connection hardware + labour
  const total_capex_usd = (capacity_kw * capex_per_kw_usd) + (expected_connections * connection_cost_usd);

  // Revenue model
  const avg_monthly_kwh_per_customer = 45; // AMDA BAM 2024: 6.1 kWh/month avg, but 45 kWh for connected households
  const tariff_usd_per_kwh = 0.68; // Tanzania residential mid-point
  const monthly_revenue_usd = expected_connections * avg_monthly_kwh_per_customer * tariff_usd_per_kwh;
  const annual_revenue_usd = monthly_revenue_usd * 12;

  // RBF grant
  const rbf_per_connection = country === 'TZ' ? 400 : 350;
  const rbf_grant_usd = has_lois && expected_connections >= 50
    ? expected_connections * rbf_per_connection : 0;

  // Blended finance structure
  const grant_share     = Math.min(0.40, rbf_grant_usd / total_capex_usd);
  const equity_share    = 0.25;
  const debt_share      = 1 - grant_share - equity_share;
  const debt_amount_usd = total_capex_usd * debt_share;
  const debt_service_yr = debt_amount_usd * 0.12; // 12% blended rate (concessional mix)

  const ebitda_usd     = annual_revenue_usd * 0.65; // 35% opex ratio
  const dscr           = ebitda_usd / Math.max(1, debt_service_yr);
  const payback_years  = total_capex_usd / Math.max(1, annual_revenue_usd);

  return {
    inputs: { capacity_kw, expected_connections, country },
    capex: {
      total_usd:          Math.round(total_capex_usd),
      per_kw_usd:         Math.round(capex_per_kw_usd),
      per_connection_usd: Math.round(total_capex_usd / expected_connections),
    },
    revenue: {
      monthly_usd:  Math.round(monthly_revenue_usd),
      annual_usd:   Math.round(annual_revenue_usd),
      arpu_monthly: Math.round(monthly_revenue_usd / expected_connections),
    },
    financing_structure: {
      rbf_grant:    { amount_usd: Math.round(rbf_grant_usd),                  share_pct: Math.round(grant_share*100),  source: 'REA Tanzania / World Bank' },
      equity:       { amount_usd: Math.round(total_capex_usd * equity_share), share_pct: Math.round(equity_share*100), source: 'Impact investor / developer' },
      conc_debt:    { amount_usd: Math.round(debt_amount_usd),                share_pct: Math.round(debt_share*100),   source: 'DFI (AFDB, IFC, FMO)' },
    },
    financial_metrics: {
      dscr:            parseFloat(dscr.toFixed(2)),
      payback_years:   parseFloat(payback_years.toFixed(1)),
      irr_estimate_pct: dscr >= 1.5 ? '18–22%' : dscr >= 1.2 ? '12–16%' : '<10%',
      bankable:        dscr >= 1.2,
    },
    carbon_upside_usd_yr: Math.round((capacity_kw * 8760 * 0.2 * 0.8) / 1000 * 13), // Gold Standard
    generated_at: new Date().toISOString(),
  };
}
