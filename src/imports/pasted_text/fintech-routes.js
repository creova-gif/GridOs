// ============================================================
// routes/fintech.js
// ============================================================
import { Router } from 'express';
import {
  getRbfMilestones, getLiveCarbonRevenue,
  createPaygInstallmentPlan, getMfiPortfolio,
  getReceivablesPortfolio, buildBlendedFinanceModel,
} from '../services/fintech/fintechServices.js';
import { supabase } from '../db.js';

export const fintechRouter = Router();

fintechRouter.get('/rbf/:site_id',             async (req, res, next) => { try { res.json(await getRbfMilestones(req.params.site_id, req.query.program)); } catch(e){next(e);} });
fintechRouter.get('/carbon/:site_id',          async (req, res, next) => { try { res.json(await getLiveCarbonRevenue(req.params.site_id)); } catch(e){next(e);} });
fintechRouter.get('/mfi/:site_id',             async (req, res, next) => { try { res.json(await getMfiPortfolio(req.params.site_id)); } catch(e){next(e);} });
fintechRouter.get('/receivables/:operator_id', async (req, res, next) => { try { res.json(await getReceivablesPortfolio(req.params.operator_id)); } catch(e){next(e);} });

fintechRouter.post('/payg/plan', async (req, res, next) => {
  try {
    const { customer_id, connection_fee_tzs, weeks } = req.body;
    res.json(await createPaygInstallmentPlan(customer_id, connection_fee_tzs, weeks));
  } catch(e){next(e);}
});

fintechRouter.post('/payg/payment', async (req, res, next) => {
  try {
    const { customer_id, amount_tzs } = req.body;
    const { recordInstallmentPayment } = await import('../services/fintech/fintechServices.js');
    res.json(await recordInstallmentPayment(customer_id, amount_tzs));
  } catch(e){next(e);}
});

fintechRouter.post('/blended-finance', async (req, res, next) => {
  try { res.json(buildBlendedFinanceModel(req.body)); } catch(e){next(e);}
});

// MFI export (JSON download)
fintechRouter.get('/mfi/export/:site_id', async (req, res, next) => {
  try {
    const data = await getMfiPortfolio(req.params.site_id);
    res.setHeader('Content-Disposition', `attachment; filename="gridios_mfi_scores_${req.params.site_id}.json"`);
    res.json(data.customers);
  } catch(e){next(e);}
});


// ============================================================
// routes/operations.js
// ============================================================
import { Router as ORouter } from 'express';
import {
  getAnomalyFeed, getAgriculturalIntelligence,
  getMaintenanceSchedule, getRegulatoryCalendar,
  getSdg7Impact, createApiKey,
} from '../services/operations/operationsServices.js';

export const operationsRouter = ORouter();

operationsRouter.get('/anomalies/:site_id',      async (req, res, next) => { try { res.json(await getAnomalyFeed(req.params.site_id, req.query.hours)); } catch(e){next(e);} });
operationsRouter.get('/agriculture/:site_id',    async (req, res, next) => { try { res.json(getAgriculturalIntelligence(req.params.site_id)); } catch(e){next(e);} });
operationsRouter.get('/maintenance/:site_id',    async (req, res, next) => { try { res.json(await getMaintenanceSchedule(req.params.site_id)); } catch(e){next(e);} });
operationsRouter.get('/regulatory/:operator_id', async (req, res, next) => { try { res.json(await getRegulatoryCalendar(req.params.operator_id)); } catch(e){next(e);} });
operationsRouter.get('/impact/:operator_id',     async (req, res, next) => { try { res.json(await getSdg7Impact(req.params.operator_id)); } catch(e){next(e);} });

operationsRouter.post('/api-keys', async (req, res, next) => {
  try {
    const { operator_id, label, scopes } = req.body;
    res.json(await createApiKey(operator_id, label, scopes));
  } catch(e){next(e);}
});

// Maintenance task completion
operationsRouter.patch('/maintenance/:site_id/tasks/:meter_id/complete', async (req, res, next) => {
  try {
    const { agent_id, notes, photos } = req.body;
    const { data, error } = await supabase.from('maintenance_logs').insert({
      operator_id:  req.body.operator_id,
      site_id:      req.params.site_id,
      meter_id:     req.params.meter_id,
      agent_id,
      type:         req.body.task_type || 'inspection',
      description:  notes || 'Routine inspection completed',
      photos:       photos || [],
      completed_at: new Date().toISOString(),
    }).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true, log: data });
  } catch(e){next(e);}
});


// ============================================================
// routes/portfolio.js — Multi-site portfolio view
// ============================================================
import { Router as PfRouter } from 'express';
import { computeSiteHealth } from '../services/ai/digitalTwin.js';

export const portfolioRouter = PfRouter();

portfolioRouter.get('/:operator_id', async (req, res, next) => {
  try {
    const { data: sites } = await supabase.from('sites')
      .select('id, name, capacity_kw, status, region, latitude, longitude')
      .eq('operator_id', req.params.operator_id)
      .order('name');

    const portfolio = await Promise.all((sites||[]).map(async site => {
      const [health, { count: meters }, { count: customers }, revenue] = await Promise.all([
        computeSiteHealth(site.id).catch(() => ({ health_score: null })),
        supabase.from('meters').select('*',{count:'exact',head:true}).eq('site_id',site.id),
        supabase.from('customers').select('*',{count:'exact',head:true}).eq('site_id',site.id).gt('balance_tzs',0),
        supabase.from('billing_events').select('amount_tzs')
          .eq('site_id',site.id)
          .gte('occurred_at', new Date(Date.now()-30*86400000).toISOString())
          .gt('amount_tzs',0),
      ]);

      const monthly_revenue_tzs = (revenue.data||[]).reduce((s,r)=>s+parseFloat(r.amount_tzs||0),0);
      const { count: alert_count } = await supabase.from('alerts')
        .select('*',{count:'exact',head:true}).eq('site_id',site.id).eq('resolved',false);

      return {
        ...site,
        health_score:        health?.health_score || 0,
        health_status:       health?.status || 'unknown',
        meters_total:        meters || 0,
        active_customers:    customers || 0,
        monthly_revenue_tzs: Math.round(monthly_revenue_tzs),
        monthly_revenue_usd: Math.round(monthly_revenue_tzs / 2500),
        unresolved_alerts:   alert_count || 0,
      };
    }));

    const totals = {
      sites:           portfolio.length,
      total_meters:    portfolio.reduce((s,x)=>s+x.meters_total,0),
      total_customers: portfolio.reduce((s,x)=>s+x.active_customers,0),
      total_revenue_usd_mo: portfolio.reduce((s,x)=>s+x.monthly_revenue_usd,0),
      avg_health:      Math.round(portfolio.reduce((s,x)=>s+(x.health_score||0),0)/Math.max(1,portfolio.length)),
      total_alerts:    portfolio.reduce((s,x)=>s+x.unresolved_alerts,0),
    };

    res.json({ operator_id: req.params.operator_id, totals, sites: portfolio });
  } catch(e){next(e);}
});


// ============================================================
// routes/customerProfile.js — Full customer profile
// ============================================================
import { Router as CpRouter } from 'express';
import { scoreSingleCustomer } from '../services/ai/creditScore.js';
import { generateStsToken } from '../services/sts.js';

export const customerProfileRouter = CpRouter();

customerProfileRouter.get('/:id/full', async (req, res, next) => {
  try {
    const { data: customer } = await supabase.from('customers').select(`
      *, meters(id, meter_ref, serial_number, brand, status, load_limit_w)
    `).eq('id', req.params.id).single();
    if (!customer) return res.status(404).json({ error: 'Not found' });

    const [creditScore, billingHistory, tokenHistory, readings] = await Promise.all([
      scoreSingleCustomer(req.params.id),
      supabase.from('billing_events').select('*')
        .eq('customer_id', req.params.id)
        .order('occurred_at', { ascending: false }).limit(30),
      supabase.from('tokens').select('*')
        .eq('customer_id', req.params.id)
        .order('created_at', { ascending: false }).limit(10),
      customer.meter_id ? supabase.from('meter_readings_hourly').select('bucket,avg_power_w,total_kwh')
        .eq('meter_id', customer.meter_id)
        .order('bucket', { ascending: false }).limit(48) : { data: [] },
    ]);

    // Balance trend from billing events
    let running = 0;
    const balance_trend = (billingHistory.data||[]).slice().reverse().map(e => {
      running += parseFloat(e.amount_tzs || 0);
      return { date: e.occurred_at, balance: parseFloat(running.toFixed(2)) };
    });

    res.json({
      customer,
      credit_score:   creditScore,
      billing_history: billingHistory.data || [],
      token_history:  tokenHistory.data || [],
      meter_readings:  readings.data || [],
      balance_trend,
    });
  } catch(e){next(e);}
});

// Edit customer contact details
customerProfileRouter.patch('/:id', async (req, res, next) => {
  try {
    const allowed = ['full_name','phone','email','language','customer_type','low_credit_threshold_tzs'];
    const update  = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const { data, error } = await supabase.from('customers')
      .update(update).eq('id', req.params.id).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch(e){next(e);}
});

// Quick top-up from customer profile
customerProfileRouter.post('/:id/topup', async (req, res, next) => {
  try {
    const { amount_tzs, payment_method = 'cash' } = req.body;
    const { data: cust } = await supabase.from('customers').select('*, meters(id, meter_ref, sts_meter_no)').eq('id', req.params.id).single();
    const tariff = cust.customer_type === 'business' ? 1560 : cust.customer_type === 'productive' ? 1310 : 1710;
    const energy_kwh   = parseFloat(amount_tzs) / tariff;
    const token_value  = generateStsToken({ meterNo: cust.meters?.meter_ref, amount: energy_kwh });
    const balance_after = (cust.balance_tzs || 0) + parseFloat(amount_tzs);
    await supabase.from('billing_events').insert({
      customer_id: req.params.id, operator_id: cust.operator_id,
      site_id: cust.site_id, meter_id: cust.meter_id,
      event_type: 'TOKEN_PURCHASED', amount_tzs: parseFloat(amount_tzs),
      balance_after, energy_kwh, tariff_tzs_per_kwh: tariff,
      token_issued: token_value, payment_method,
    });
    res.json({ success: true, token: token_value, energy_kwh, balance_after });
  } catch(e){next(e);}
});
