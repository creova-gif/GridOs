/**
 * GridOS — All New Feature Routes
 * Add to server.js:
 *   import { aiRouter }         from './routes/ai.js';
 *   import { reportsRouter }    from './routes/reports.js';
 *   import { planningRouter }   from './routes/planning.js';
 *   app.use('/api/ai',          aiRouter);
 *   app.use('/api/reports',     reportsRouter);
 *   app.use('/api/planning',    planningRouter);
 */

// ============================================================
// routes/ai.js
// ============================================================
import { Router } from 'express';
import { forecastSite, forecastWeek }   from '../services/ai/forecast.js';
import { scoreSingleCustomer, scoreSite, toMfiExport } from '../services/ai/creditScore.js';
import { computeSiteHealth }            from '../services/ai/digitalTwin.js';
import { getCurrentTariff, generateEwuraSchedule, triggerDemandResponse } from '../services/ai/tou.js';
import { supabase }                     from '../db.js';

export const aiRouter = Router();

// Load forecast — 24h or 7-day
aiRouter.get('/forecast/:site_id', async (req, res, next) => {
  try {
    const horizon = req.query.days === '7' ? 168 : 24;
    const result  = req.query.days === '7'
      ? await forecastWeek(req.params.site_id)
      : await forecastSite(req.params.site_id, horizon);
    res.json(result);
  } catch (e) { next(e); }
});

// Credit score — single customer
aiRouter.get('/credit-score/:customer_id', async (req, res, next) => {
  try {
    const score = await scoreSingleCustomer(req.params.customer_id);
    if (!score) return res.status(404).json({ error: 'Customer not found' });
    res.json(score);
  } catch (e) { next(e); }
});

// Credit scores — all customers for a site
aiRouter.get('/credit-scores/site/:site_id', async (req, res, next) => {
  try {
    const scores = await scoreSite(req.params.site_id);
    res.json(scores);
  } catch (e) { next(e); }
});

// Credit score export for MFI partners
aiRouter.get('/credit-scores/site/:site_id/export', async (req, res, next) => {
  try {
    const scores = await scoreSite(req.params.site_id);
    const { data: customers } = await supabase.from('customers').select('id, full_name, phone').eq('site_id', req.params.site_id);
    const exported = toMfiExport(scores, customers || []);
    res.setHeader('Content-Disposition', 'attachment; filename="gridios_credit_scores.json"');
    res.json(exported);
  } catch (e) { next(e); }
});

// Digital twin / site health
aiRouter.get('/site-health/:site_id', async (req, res, next) => {
  try {
    const health = await computeSiteHealth(req.params.site_id);
    if (!health) return res.status(404).json({ error: 'Site not found' });
    res.json(health);
  } catch (e) { next(e); }
});

// Current TOU tariff
aiRouter.get('/tou/:site_id/current', async (req, res, next) => {
  try {
    const { data: site } = await supabase.from('sites').select('tariff_residential, tariff_business, tariff_productive').eq('id', req.params.site_id).single();
    const tariffType = req.query.customer_type || 'residential';
    const base = tariffType === 'business' ? site?.tariff_business : tariffType === 'productive' ? site?.tariff_productive : site?.tariff_residential;
    res.json(getCurrentTariff(base || 1710));
  } catch (e) { next(e); }
});

// EWURA tariff schedule export
aiRouter.get('/tou/:site_id/schedule', async (req, res, next) => {
  try {
    const { data: site } = await supabase.from('sites').select('*').eq('id', req.params.site_id).single();
    const schedule = generateEwuraSchedule(req.params.site_id, {
      residential: site?.tariff_residential || 1710,
      business:    site?.tariff_business    || 1560,
      productive:  site?.tariff_productive  || 1310,
    });
    res.json(schedule);
  } catch (e) { next(e); }
});

// Trigger demand response
aiRouter.post('/demand-response/:site_id', async (req, res, next) => {
  try {
    const { current_load_w, capacity_w } = req.body;
    const result = await triggerDemandResponse(req.params.site_id, current_load_w, capacity_w);
    res.json(result);
  } catch (e) { next(e); }
});


// ============================================================
// routes/reports.js
// ============================================================
import { Router as RRouter } from 'express';
import {
  generateReaReport,
  generateWorldBankReport,
  generateEwuraSubmission,
  generateCarbonReport,
} from '../services/rbf/reportGenerator.js';
import {
  identifyProductiveUsers,
  generateGridArrivalPackage,
} from '../services/rbf/productiveUse.js';

export const reportsRouter = RRouter();

// REA Tanzania RBF verification report
reportsRouter.get('/rea/:site_id', async (req, res, next) => {
  try {
    const report = await generateReaReport(req.params.site_id, {
      start: req.query.start,
      end:   req.query.end,
    });
    if (req.query.format === 'json-download') {
      res.setHeader('Content-Disposition', `attachment; filename="rea_rbf_${req.params.site_id}_${new Date().toISOString().slice(0,10)}.json"`);
    }
    res.json(report);
  } catch (e) { next(e); }
});

// World Bank / ESMAP format
reportsRouter.get('/worldbank/:site_id', async (req, res, next) => {
  try {
    res.json(await generateWorldBankReport(req.params.site_id));
  } catch (e) { next(e); }
});

// EWURA submission
reportsRouter.get('/ewura/:site_id', async (req, res, next) => {
  try {
    res.json(await generateEwuraSubmission(req.params.site_id));
  } catch (e) { next(e); }
});

// Carbon credits report (Verra/Gold Standard)
reportsRouter.get('/carbon/:site_id', async (req, res, next) => {
  try {
    const year = parseInt(req.query.year || new Date().getFullYear());
    res.json(await generateCarbonReport(req.params.site_id, year));
  } catch (e) { next(e); }
});

// Productive use identification
reportsRouter.get('/productive-use/:site_id', async (req, res, next) => {
  try {
    res.json(await identifyProductiveUsers(req.params.site_id));
  } catch (e) { next(e); }
});

// Grid arrival transition package
reportsRouter.post('/grid-arrival/:site_id', async (req, res, next) => {
  try {
    res.json(await generateGridArrivalPackage(req.params.site_id));
  } catch (e) { next(e); }
});


// ============================================================
// routes/planning.js
// ============================================================
import { Router as PRouter } from 'express';
import { scoreLocation, screenRegion } from '../services/geospatial/sitePlanning.js';

export const planningRouter = PRouter();

// Score a single candidate location
planningRouter.get('/score', async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });
    res.json(await scoreLocation(parseFloat(lat), parseFloat(lng)));
  } catch (e) { next(e); }
});

// Screen multiple candidate locations (batch)
planningRouter.post('/screen', async (req, res, next) => {
  try {
    const { locations } = req.body;
    if (!Array.isArray(locations)) return res.status(400).json({ error: 'locations array required' });
    res.json(await screenRegion(locations));
  } catch (e) { next(e); }
});
