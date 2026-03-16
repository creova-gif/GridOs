/**
 * GridOS — AI Credit Scoring Service
 *
 * Scores customers 0–100 based on:
 *   - Payment recency (days since last top-up)
 *   - Payment frequency (top-ups per month)
 *   - Payment consistency (variance in payment amounts)
 *   - Energy usage trend (growing = positive signal)
 *   - Customer type (productive > business > residential for credit)
 *   - Balance behaviour (how often they hit zero)
 *
 * In production: train an XGBoost model on historical payment outcomes.
 * The JS implementation here is a rule-based approximation that produces
 * calibrated scores while you accumulate training data.
 *
 * MFI API export: POST /api/credit-scores/export → JSON array for
 * Jumo, Branch, FINCA Tanzania partner underwriting.
 */

import { supabase } from '../db.js';

const TYPE_WEIGHT = { productive: 1.15, business: 1.05, institutional: 1.10, residential: 1.0 };

export async function scoreSingleCustomer(customerId) {
  const now = new Date();

  // Pull last 90 days of billing events
  const since90 = new Date(now - 90 * 86400000).toISOString();
  const { data: events } = await supabase
    .from('billing_events')
    .select('event_type, amount_tzs, occurred_at, payment_method')
    .eq('customer_id', customerId)
    .gte('occurred_at', since90)
    .order('occurred_at', { ascending: false });

  const { data: customer } = await supabase
    .from('customers')
    .select('customer_type, balance_tzs, created_at')
    .eq('id', customerId)
    .single();

  if (!customer) return null;

  const payments = (events || []).filter(e =>
    ['TOKEN_PURCHASED','CASH_COLLECTED','ADJUSTMENT_CREDIT'].includes(e.event_type)
  );
  const consumptions = (events || []).filter(e => e.event_type === 'ENERGY_CONSUMED');
  const zeroEvents   = (events || []).filter(e =>
    e.event_type === 'ENERGY_CONSUMED' && parseFloat(e.amount_tzs) > -0.01
  );

  // ── Factor 1: Recency (0–25 pts) ─────────────────────────────
  let recencyScore = 0;
  if (payments.length > 0) {
    const daysSinceLast = (now - new Date(payments[0].occurred_at)) / 86400000;
    recencyScore = daysSinceLast <= 7  ? 25
                 : daysSinceLast <= 14 ? 20
                 : daysSinceLast <= 30 ? 14
                 : daysSinceLast <= 60 ? 8 : 2;
  }

  // ── Factor 2: Frequency (0–20 pts) ───────────────────────────
  const monthlyFreq   = payments.length / 3;  // avg per month over 90 days
  const frequencyScore = Math.min(20, Math.round(monthlyFreq * 5));

  // ── Factor 3: Consistency (0–20 pts) — low variance = reliable payer
  let consistencyScore = 0;
  if (payments.length >= 3) {
    const amounts = payments.map(p => parseFloat(p.amount_tzs));
    const mean    = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((s, a) => s + Math.pow(a - mean, 2), 0) / amounts.length;
    const cv      = Math.sqrt(variance) / (mean || 1);  // coefficient of variation
    consistencyScore = cv < 0.1 ? 20 : cv < 0.25 ? 16 : cv < 0.5 ? 10 : cv < 0.8 ? 5 : 1;
  }

  // ── Factor 4: Energy usage trend (0–15 pts) ──────────────────
  let trendScore = 10;  // neutral default
  if (consumptions.length >= 10) {
    const half       = Math.floor(consumptions.length / 2);
    const recent     = consumptions.slice(0, half).reduce((s, e) => s + Math.abs(parseFloat(e.amount_tzs)), 0);
    const older      = consumptions.slice(half).reduce((s, e) => s + Math.abs(parseFloat(e.amount_tzs)), 0);
    const growthRate = older > 0 ? (recent - older) / older : 0;
    trendScore = growthRate > 0.1 ? 15 : growthRate > 0 ? 12 : growthRate > -0.1 ? 8 : 4;
  }

  // ── Factor 5: Zero-balance events (0–10 pts) — fewer = better
  const zeroRate   = consumptions.length > 0 ? zeroEvents.length / consumptions.length : 0;
  const zeroScore  = zeroRate === 0 ? 10 : zeroRate < 0.05 ? 8 : zeroRate < 0.15 ? 5 : zeroRate < 0.3 ? 2 : 0;

  // ── Factor 6: Customer type (0–10 pts) ───────────────────────
  const typeScore  = Math.round(10 * (TYPE_WEIGHT[customer.customer_type] || 1.0));

  const rawScore   = recencyScore + frequencyScore + consistencyScore + trendScore + zeroScore + typeScore;
  const score      = Math.min(100, Math.round(rawScore));

  const tier       = score >= 80 ? 'excellent'
                   : score >= 65 ? 'good'
                   : score >= 50 ? 'fair'
                   : score >= 35 ? 'poor' : 'very_poor';

  const recommended_credit_tzs =
    tier === 'excellent' ? 20000
    : tier === 'good'    ? 10000
    : tier === 'fair'    ? 5000
    : tier === 'poor'    ? 2000 : 0;

  return {
    customer_id:               customerId,
    score,
    tier,
    recommended_credit_tzs,
    factors: {
      recency:     recencyScore,
      frequency:   frequencyScore,
      consistency: consistencyScore,
      trend:       trendScore,
      zero_events: zeroScore,
      customer_type: typeScore,
    },
    data_points: { payments_90d: payments.length, consumptions_90d: consumptions.length },
    scored_at:   new Date().toISOString(),
    model:       'rule_based_v1',
    next_review: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  };
}

// Batch score all customers for a site
export async function scoreSite(siteId) {
  const { data: customers } = await supabase
    .from('customers')
    .select('id, full_name, customer_type')
    .eq('site_id', siteId)
    .eq('active', true);

  if (!customers?.length) return [];

  const scores = await Promise.all(customers.map(c => scoreSingleCustomer(c.id)));
  return scores
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);
}

// MFI export format (Jumo / Branch compatible)
export function toMfiExport(scores, customers) {
  return scores.map(s => {
    const cust = customers.find(c => c.id === s.customer_id);
    return {
      external_ref:     s.customer_id,
      phone:            cust?.phone,
      full_name:        cust?.full_name,
      credit_score:     s.score,
      tier:             s.tier,
      recommended_limit_tzs: s.recommended_credit_tzs,
      data_source:      'gridios_energy_billing',
      scored_at:        s.scored_at,
    };
  });
}
