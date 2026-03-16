/**
 * GridOS — Operator Onboarding Routes
 * POST /api/onboarding/signup        → create operator + Supabase auth user
 * POST /api/onboarding/site          → add first site
 * POST /api/onboarding/meters/bulk   → register meters in bulk (CSV or array)
 * POST /api/onboarding/agents/invite → invite field agent via SMS
 * GET  /api/onboarding/checklist/:op → onboarding progress checklist
 */

import { Router } from 'express';
import { supabase } from '../db.js';
import { sendSms }  from '../services/sms.js';
import { v4 as uuidv4 } from 'uuid';

export const onboardingRouter = Router();

// ── Step 1: Create operator account ──────────────────────────
onboardingRouter.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password, country = 'TZ', phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password required' });
    }

    // Create Supabase auth user
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { full_name: name },
    });
    if (authErr) return res.status(400).json({ error: authErr.message });

    // Create operator record
    const { data: op, error: opErr } = await supabase.from('operators').insert({
      name, country, contact_email: email,
      contact_phone: phone, plan: 'starter',
    }).select().single();
    if (opErr) return res.status(400).json({ error: opErr.message });

    res.status(201).json({
      operator_id: op.id,
      auth_user_id: authData.user.id,
      message: 'Account created. Add your first site to continue.',
      next_step: '/api/onboarding/site',
    });
  } catch (e) { next(e); }
});

// ── Step 2: Add first site ────────────────────────────────────
onboardingRouter.post('/site', async (req, res, next) => {
  try {
    const {
      operator_id, name, country = 'TZ', region,
      latitude, longitude, capacity_kw,
      tariff_residential = 1710, tariff_business = 1560,
      tariff_productive = 1310, ewura_license_no, lois_registration,
    } = req.body;

    const { data: site, error } = await supabase.from('sites').insert({
      operator_id, name, country, region,
      latitude, longitude, capacity_kw,
      tariff_residential, tariff_business, tariff_productive,
      ewura_license_no, lois_registration, status: 'active',
    }).select().single();

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json({
      site_id: site.id,
      message: `Site "${name}" created. Now register your meters.`,
      next_step: '/api/onboarding/meters/bulk',
    });
  } catch (e) { next(e); }
});

// ── Step 3: Bulk meter + customer registration ────────────────
onboardingRouter.post('/meters/bulk', async (req, res, next) => {
  try {
    const { operator_id, site_id, meters } = req.body;
    // meters = [{ serial, brand, model, customer_name, customer_phone, customer_type, load_limit_w }]
    if (!Array.isArray(meters) || meters.length === 0) {
      return res.status(400).json({ error: 'meters array required' });
    }

    const results = [], errors = [];
    let index = 1;

    for (const m of meters) {
      try {
        const meter_ref = `MTR-${String(index).padStart(3, '0')}`;
        const { data: meter, error: mErr } = await supabase.from('meters').insert({
          site_id, operator_id, meter_ref,
          serial_number: m.serial, brand: m.brand,
          model: m.model || null,
          load_limit_w: m.load_limit_w || 500,
          phase: 'single', status: 'active',
        }).select('id').single();

        if (mErr) { errors.push({ serial: m.serial, error: mErr.message }); continue; }

        const accountNum = `ACC-${uuidv4().slice(0, 8).toUpperCase()}`;
        await supabase.from('customers').insert({
          operator_id, site_id, meter_id: meter.id,
          full_name: m.customer_name, phone: m.customer_phone,
          customer_type: m.customer_type || 'residential',
          account_number: accountNum, balance_tzs: 0,
          language: 'sw', active: true,
        });

        results.push({ meter_ref, serial: m.serial, customer: m.customer_name });
        index++;
      } catch (err) {
        errors.push({ serial: m.serial, error: err.message });
      }
    }

    res.status(201).json({
      registered: results.length,
      failed: errors.length,
      meters: results,
      errors: errors.length > 0 ? errors : undefined,
      message: `${results.length} meters registered.`,
      next_step: '/api/onboarding/agents/invite',
    });
  } catch (e) { next(e); }
});

// ── Step 4: Invite field agent ────────────────────────────────
onboardingRouter.post('/agents/invite', async (req, res, next) => {
  try {
    const { operator_id, full_name, phone, site_ids = [] } = req.body;

    const { data: agent, error } = await supabase.from('agents').insert({
      operator_id, full_name, phone,
      sites: site_ids, active: true,
    }).select().single();

    if (error) return res.status(400).json({ error: error.message });

    // SMS invite to agent
    await sendSms(phone,
      `Habari ${full_name}! Umealikwa kuwa wakala wa GridOS. ` +
      `Pakua programu: gridios.app/agent au piga simu: 0800 000 000 kwa usaidizi.`
    );

    res.status(201).json({
      agent_id: agent.id,
      message: `Agent ${full_name} invited via SMS.`,
    });
  } catch (e) { next(e); }
});

// ── Onboarding checklist ──────────────────────────────────────
onboardingRouter.get('/checklist/:operator_id', async (req, res, next) => {
  try {
    const { operator_id } = req.params;

    const [
      { data: op },
      { count: siteCount },
      { count: meterCount },
      { count: agentCount },
      { count: paymentCount },
    ] = await Promise.all([
      supabase.from('operators').select('name, plan').eq('id', operator_id).single(),
      supabase.from('sites').select('*', { count:'exact', head:true }).eq('operator_id', operator_id),
      supabase.from('meters').select('*', { count:'exact', head:true }).eq('operator_id', operator_id),
      supabase.from('agents').select('*', { count:'exact', head:true }).eq('operator_id', operator_id),
      supabase.from('payment_transactions').select('*', { count:'exact', head:true }).eq('operator_id', operator_id),
    ]);

    const steps = [
      { id:'account',  label:'Create operator account',  done: !!op,              link: null },
      { id:'site',     label:'Add first site',           done: siteCount > 0,     link: '/api/onboarding/site' },
      { id:'meters',   label:'Register meters',          done: meterCount > 0,    link: '/api/onboarding/meters/bulk' },
      { id:'agent',    label:'Invite field agent',       done: agentCount > 0,    link: '/api/onboarding/agents/invite' },
      { id:'payment',  label:'First payment collected',  done: paymentCount > 0,  link: null },
      { id:'sts',      label:'STS certification',        done: false,             link: 'https://www.sts.org.za' },
      { id:'ewura',    label:'EWURA/LOIS registration',  done: false,             link: 'https://www.ewura.go.tz' },
    ];

    const completed = steps.filter(s => s.done).length;
    res.json({
      operator: op?.name,
      progress_pct: Math.round((completed / steps.length) * 100),
      completed, total: steps.length,
      steps,
    });
  } catch (e) { next(e); }
});
