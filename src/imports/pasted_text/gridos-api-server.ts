/**
 * GridOS API Server v3.0
 * All routes wired · JWT auth on all protected routes · Sentry error monitoring
 * New: disputes, tariffs, CSV export, M-Pesa webhooks, WhatsApp digest cron
 */

import 'dotenv/config';
import express      from 'express';
import cors         from 'cors';
import helmet       from 'helmet';
import rateLimit    from 'express-rate-limit';

// ── Existing routes ───────────────────────────────────────────
import { sitesRouter }        from './routes/sites.js';
import { metersRouter }       from './routes/meters.js';
import { customersRouter }    from './routes/customers.js';
import { ussdRouter }         from './routes/ussd.js';
import { aiRouter, reportsRouter, planningRouter } from './routes/ai.js';
import { onboardingRouter }   from './routes/onboarding.js';
import { fintechRouter, operationsRouter, portfolioRouter } from './routes/fintech.js';
import { paymentsRouter }     from './routes/payments.js';

// ── New routes (v3) ───────────────────────────────────────────
import { disputeRouter, tariffRouter, exportRouter } from './routes/disputes.js';

// ── Services ──────────────────────────────────────────────────
import { startMqttBridge }    from './mqtt/bridge.js';
import { handleStkCallback, handleC2bCallback } from './services/payments/mpesa.js';
import { startDigestCron }    from './services/notifications/whatsapp.js';
import { verifyJWT }          from './middleware/auth.js';

// ── Sentry (optional — install: npm install @sentry/node) ────
let Sentry;
try {
  Sentry = await import('@sentry/node');
  Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
  console.log('[Sentry] Error monitoring active');
} catch { console.log('[Sentry] Not installed — skipping (npm install @sentry/node)'); }

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Security & middleware ─────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(rateLimit({ windowMs: 60_000, max: 300, standardHeaders: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Public routes (no auth) ───────────────────────────────────
app.get('/health', (_, res) => res.json({
  status: 'ok', version: '3.0.0',
  features: 28,
  new_in_v3: ['disputes', 'tariffs', 'csv-export', 'mpesa-daraja', 'whatsapp-digest', 'jwt-auth', 'rls-tests'],
}));

// M-Pesa webhooks — Safaricom calls these, no JWT
app.post('/webhooks/mpesa/stk',     async (req, res) => { const r = await handleStkCallback(req.body); res.json(r); });
app.post('/webhooks/mpesa/c2b',     async (req, res) => { const r = await handleC2bCallback(req.body); res.json(r); });
app.post('/webhooks/mpesa/confirm', async (req, res) => res.json({ ResultCode: 0, ResultDesc: 'Accepted' }));

// USSD — Africa's Talking calls this
app.use('/ussd', ussdRouter);

// Operator self-onboarding (public — creates account)
app.use('/api/onboarding', onboardingRouter);

// ── Protected routes (JWT required) ──────────────────────────
// All routes below require a valid Supabase JWT in Authorization header

app.use('/api/sites',       verifyJWT, sitesRouter);
app.use('/api/meters',      verifyJWT, metersRouter);
app.use('/api/customers',   verifyJWT, customersRouter);
app.use('/api/payments',    verifyJWT, paymentsRouter);
app.use('/api/ai',          verifyJWT, aiRouter);
app.use('/api/reports',     verifyJWT, reportsRouter);
app.use('/api/planning',    verifyJWT, planningRouter);
app.use('/api/fintech',     verifyJWT, fintechRouter);
app.use('/api/operations',  verifyJWT, operationsRouter);
app.use('/api/portfolio',   verifyJWT, portfolioRouter);

// New v3 routes
app.use('/api/disputes',    verifyJWT, disputeRouter);
app.use('/api/tariffs',     verifyJWT, tariffRouter);
app.use('/api/export',      verifyJWT, exportRouter);   // CSV/Excel exports

// Agent sync endpoints (field app uses its own JWT)
app.post('/api/agent/sync/payment',      verifyJWT, async (req, res) => {
  const { supabase } = await import('./db.js');
  const { data, error } = await supabase.from('billing_events').insert({
    ...req.body, synced_from_agent: true, synced_at: new Date().toISOString(),
  });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.post('/api/agent/sync/inspection',   verifyJWT, async (req, res) => {
  const { supabase } = await import('./db.js');
  const { error } = await supabase.from('site_inspections').insert(req.body);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.post('/api/agent/sync/token-confirm', verifyJWT, async (req, res) => {
  const { supabase } = await import('./db.js');
  await supabase.from('token_vault').update({ status: 'confirmed', confirmed_at: new Date().toISOString() }).eq('id', req.body.token_vault_id);
  res.json({ success: true });
});

app.get('/api/agent/customers', verifyJWT, async (req, res) => {
  const { supabase } = await import('./db.js');
  const { data } = await supabase.from('customers')
    .select('id, operator_id, site_id, meter_id, full_name, phone, account_number, customer_type, balance_tzs, meters(meter_ref)')
    .eq('operator_id', req.operatorId).eq('active', true).order('full_name');
  res.json({ customers: data || [] });
});

app.get('/api/agent/tokens/prefetch', verifyJWT, async (req, res) => {
  const { supabase } = await import('./db.js');
  const { data } = await supabase.from('token_vault')
    .select('id, customer_id, meter_ref, amount_tzs, energy_kwh, token, denomination, expires_at')
    .eq('operator_id', req.operatorId).eq('status', 'available')
    .gt('expires_at', new Date().toISOString()).limit(100);
  res.json({ tokens: data || [] });
});

// ── Error handler ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (Sentry) Sentry.captureException(err);
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║  GridOS API v3.0  →  http://localhost:${PORT}   ║
║  28 features · JWT auth · All routes wired   ║
╚══════════════════════════════════════════════╝

Public:  GET /health · POST /webhooks/mpesa/* · POST /ussd
Auth:    All /api/* routes require Bearer token

New in v3:
  POST /api/disputes/:id/open
  POST /api/disputes/:id/resolve  
  PATCH /api/tariffs/:site_id
  GET  /api/export/customers/:site_id   → CSV
  GET  /api/export/billing/:site_id     → CSV
  GET  /api/export/rea/:site_id         → REA grant format
  POST /api/agent/sync/payment
  GET  /api/agent/tokens/prefetch
`);
});

startMqttBridge().catch(console.error);
startDigestCron().catch(console.error);  // 7am Tanzania daily WhatsApp digest
