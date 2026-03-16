/**
 * GridOS — Billing Disputes, Tariff Management, CSV Export
 */

import { Router } from 'express';
import { supabase } from '../db.js';
import { verifyJWT } from '../middleware/auth.js';

// ============================================================
// BILLING DISPUTES
// ============================================================
export const disputeRouter = Router();

// GET all disputes for an operator
disputeRouter.get('/', verifyJWT, async (req, res, next) => {
  try {
    const { status } = req.query; // open | resolved | all
    let query = supabase.from('billing_events')
      .select(`
        id, occurred_at, event_type, amount_tzs, balance_after,
        token_issued, payment_method, dispute_status, dispute_notes,
        dispute_opened_at, dispute_resolved_at,
        customers(id, full_name, phone, account_number),
        meters(meter_ref)
      `)
      .eq('operator_id', req.operatorId)
      .not('dispute_status', 'is', null)
      .order('occurred_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('dispute_status', status);
    }

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json({ disputes: data, count: data?.length || 0 });
  } catch (e) { next(e); }
});

// POST — open a dispute on a billing event
disputeRouter.post('/:billing_event_id/open', verifyJWT, async (req, res, next) => {
  try {
    const { billing_event_id } = req.params;
    const { reason, customer_claim, reported_by = 'operator' } = req.body;

    if (!reason) return res.status(400).json({ error: 'reason required' });

    // Verify the billing event belongs to this operator
    const { data: event } = await supabase.from('billing_events')
      .select('id, operator_id, customer_id, amount_tzs')
      .eq('id', billing_event_id).single();

    if (!event || event.operator_id !== req.operatorId) {
      return res.status(404).json({ error: 'Billing event not found' });
    }

    const { data, error } = await supabase.from('billing_events').update({
      dispute_status:     'open',
      dispute_notes:      reason,
      dispute_opened_at:  new Date().toISOString(),
      dispute_metadata:   { customer_claim, reported_by },
    }).eq('id', billing_event_id).select().single();

    if (error) return res.status(400).json({ error: error.message });

    // Create audit trail entry
    await supabase.from('audit_log').insert({
      operator_id: req.operatorId,
      action:      'DISPUTE_OPENED',
      entity_type: 'billing_event',
      entity_id:   billing_event_id,
      user_id:     req.userId,
      metadata:    { reason, customer_claim },
    });

    res.status(201).json({ success: true, dispute: data });
  } catch (e) { next(e); }
});

// PATCH — resolve a dispute
disputeRouter.patch('/:billing_event_id/resolve', verifyJWT, async (req, res, next) => {
  try {
    const { billing_event_id } = req.params;
    const { resolution, resolution_action, credit_adjustment_tzs } = req.body;
    // resolution_action: 'credit_customer' | 'no_action' | 'reissue_token' | 'refund'

    const { data: event } = await supabase.from('billing_events')
      .select('id, operator_id, customer_id, amount_tzs, token_issued')
      .eq('id', billing_event_id).single();

    if (!event || event.operator_id !== req.operatorId) {
      return res.status(404).json({ error: 'Billing event not found' });
    }

    const update = {
      dispute_status:       'resolved',
      dispute_resolved_at:  new Date().toISOString(),
      dispute_resolution:   resolution,
      dispute_metadata:     { ...(event.dispute_metadata || {}), resolution_action },
    };

    await supabase.from('billing_events').update(update).eq('id', billing_event_id);

    // Apply resolution
    if (resolution_action === 'credit_customer' && credit_adjustment_tzs) {
      const { data: customer } = await supabase.from('customers')
        .select('balance_tzs').eq('id', event.customer_id).single();
      const newBalance = (customer.balance_tzs || 0) + parseFloat(credit_adjustment_tzs);
      await supabase.from('customers').update({ balance_tzs: newBalance }).eq('id', event.customer_id);
      await supabase.from('billing_events').insert({
        customer_id:   event.customer_id,
        operator_id:   req.operatorId,
        event_type:    'ADJUSTMENT_CREDIT',
        amount_tzs:    parseFloat(credit_adjustment_tzs),
        balance_after: newBalance,
        notes:         `Dispute resolution credit — ref: ${billing_event_id}`,
      });
    }

    // Audit trail
    await supabase.from('audit_log').insert({
      operator_id: req.operatorId,
      action:      'DISPUTE_RESOLVED',
      entity_type: 'billing_event',
      entity_id:   billing_event_id,
      user_id:     req.userId,
      metadata:    { resolution, resolution_action, credit_adjustment_tzs },
    });

    res.json({ success: true, resolution_action });
  } catch (e) { next(e); }
});


// ============================================================
// TARIFF MANAGEMENT
// ============================================================
export const tariffRouter = Router();

// GET current tariffs for a site
tariffRouter.get('/:site_id', verifyJWT, async (req, res, next) => {
  try {
    const { data: site } = await supabase.from('sites')
      .select('id, name, tariff_residential, tariff_business, tariff_productive, currency, tariff_history')
      .eq('id', req.params.site_id).eq('operator_id', req.operatorId).single();

    if (!site) return res.status(404).json({ error: 'Site not found' });
    res.json(site);
  } catch (e) { next(e); }
});

// PATCH — update tariffs (with history tracking)
tariffRouter.patch('/:site_id', verifyJWT, async (req, res, next) => {
  try {
    const { tariff_residential, tariff_business, tariff_productive, effective_date, reason } = req.body;
    const { site_id } = req.params;

    // Validate — must have EWURA justification for tariff changes
    if (!reason) return res.status(400).json({ error: 'reason required for tariff changes (EWURA compliance)' });

    // Get current tariffs
    const { data: current } = await supabase.from('sites')
      .select('tariff_residential, tariff_business, tariff_productive, tariff_history')
      .eq('id', site_id).eq('operator_id', req.operatorId).single();

    if (!current) return res.status(404).json({ error: 'Site not found' });

    // Append to history
    const history = current.tariff_history || [];
    history.push({
      changed_at:          new Date().toISOString(),
      effective_date:      effective_date || new Date().toISOString().slice(0, 10),
      previous_residential: current.tariff_residential,
      previous_business:    current.tariff_business,
      previous_productive:  current.tariff_productive,
      new_residential:     tariff_residential,
      new_business:        tariff_business,
      new_productive:      tariff_productive,
      reason,
      changed_by:          req.userId,
    });

    const update = { tariff_history: history };
    if (tariff_residential) update.tariff_residential = tariff_residential;
    if (tariff_business)    update.tariff_business    = tariff_business;
    if (tariff_productive)  update.tariff_productive  = tariff_productive;

    const { data, error } = await supabase.from('sites').update(update)
      .eq('id', site_id).select().single();
    if (error) return res.status(400).json({ error: error.message });

    // Audit log
    await supabase.from('audit_log').insert({
      operator_id: req.operatorId, action: 'TARIFF_UPDATED',
      entity_type: 'site', entity_id: site_id,
      user_id: req.userId, metadata: { reason, tariff_residential, tariff_business, tariff_productive },
    });

    res.json({ success: true, site: data, history_entries: history.length });
  } catch (e) { next(e); }
});


// ============================================================
// CSV / EXCEL EXPORT (all major tables)
// ============================================================
export const exportRouter = Router();

function toCsv(rows, columns) {
  const header = columns.map(c => c.label).join(',');
  const body   = rows.map(row =>
    columns.map(c => {
      const val = c.fn ? c.fn(row) : (row[c.key] ?? '');
      const str = String(val).replace(/"/g, '""');
      return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
    }).join(',')
  ).join('\n');
  return `${header}\n${body}`;
}

// Export customers
exportRouter.get('/customers/:site_id', verifyJWT, async (req, res, next) => {
  try {
    const { data } = await supabase.from('customers')
      .select('full_name, phone, customer_type, account_number, balance_tzs, active, created_at, meters(meter_ref)')
      .eq('site_id', req.params.site_id).eq('operator_id', req.operatorId);

    const csv = toCsv(data || [], [
      { label: 'Name',         key: 'full_name' },
      { label: 'Phone',        key: 'phone' },
      { label: 'Type',         key: 'customer_type' },
      { label: 'Account',      key: 'account_number' },
      { label: 'Meter Ref',    fn: r => r.meters?.meter_ref || '' },
      { label: 'Balance (TZS)',key: 'balance_tzs' },
      { label: 'Active',       fn: r => r.active ? 'Yes' : 'No' },
      { label: 'Joined',       fn: r => r.created_at?.slice(0, 10) || '' },
    ]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="gridios_customers_${req.params.site_id}.csv"`);
    res.send(csv);
  } catch (e) { next(e); }
});

// Export billing events
exportRouter.get('/billing/:site_id', verifyJWT, async (req, res, next) => {
  try {
    const { from, to } = req.query;
    let query = supabase.from('billing_events')
      .select('occurred_at, event_type, amount_tzs, balance_after, energy_kwh, payment_method, token_issued, customers(full_name, account_number), meters(meter_ref)')
      .eq('site_id', req.params.site_id).eq('operator_id', req.operatorId)
      .order('occurred_at', { ascending: false });

    if (from) query = query.gte('occurred_at', from);
    if (to)   query = query.lte('occurred_at', to);

    const { data } = await query;

    const csv = toCsv(data || [], [
      { label: 'Date',         fn: r => r.occurred_at?.slice(0, 16) || '' },
      { label: 'Customer',     fn: r => r.customers?.full_name || '' },
      { label: 'Account',      fn: r => r.customers?.account_number || '' },
      { label: 'Meter',        fn: r => r.meters?.meter_ref || '' },
      { label: 'Event Type',   key: 'event_type' },
      { label: 'Amount (TZS)', key: 'amount_tzs' },
      { label: 'Balance After',key: 'balance_after' },
      { label: 'kWh',          fn: r => r.energy_kwh ? parseFloat(r.energy_kwh).toFixed(3) : '' },
      { label: 'Payment',      key: 'payment_method' },
      { label: 'Token',        key: 'token_issued' },
    ]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="gridios_billing_${req.params.site_id}.csv"`);
    res.send(csv);
  } catch (e) { next(e); }
});

// Export meters
exportRouter.get('/meters/:site_id', verifyJWT, async (req, res, next) => {
  try {
    const { data } = await supabase.from('meters')
      .select('meter_ref, serial_number, brand, model, status, commissioned_at, load_limit_w')
      .eq('site_id', req.params.site_id).eq('operator_id', req.operatorId);

    const csv = toCsv(data || [], [
      { label: 'Meter Ref',     key: 'meter_ref' },
      { label: 'Serial No.',    key: 'serial_number' },
      { label: 'Brand',         key: 'brand' },
      { label: 'Model',         key: 'model' },
      { label: 'Status',        key: 'status' },
      { label: 'Load Limit (W)',key: 'load_limit_w' },
      { label: 'Commissioned',  fn: r => r.commissioned_at?.slice(0, 10) || '' },
    ]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="gridios_meters_${req.params.site_id}.csv"`);
    res.send(csv);
  } catch (e) { next(e); }
});

// Export REA RBF report (CSV format for REA submission)
exportRouter.get('/rea/:site_id', verifyJWT, async (req, res, next) => {
  try {
    const { data: customers } = await supabase.from('customers')
      .select('full_name, phone, customer_type, account_number, created_at, balance_tzs, meters(meter_ref, serial_number, brand)')
      .eq('site_id', req.params.site_id).eq('operator_id', req.operatorId).eq('active', true);

    const csv = toCsv(customers || [], [
      { label: 'Customer Name',     key: 'full_name' },
      { label: 'Phone',             key: 'phone' },
      { label: 'Connection Type',   key: 'customer_type' },
      { label: 'Account Number',    key: 'account_number' },
      { label: 'Meter Reference',   fn: r => r.meters?.meter_ref || '' },
      { label: 'Meter Serial',      fn: r => r.meters?.serial_number || '' },
      { label: 'Meter Brand',       fn: r => r.meters?.brand || '' },
      { label: 'Connection Date',   fn: r => r.created_at?.slice(0, 10) || '' },
      { label: 'Current Balance',   key: 'balance_tzs' },
      { label: 'Active',            fn: () => 'Yes' },
    ]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="gridios_rea_report_${req.params.site_id}.csv"`);
    res.send(csv);
  } catch (e) { next(e); }
});
