/**
 * GridOS — WhatsApp Notifications (Twilio Business API)
 * + Daily/Weekly operator digest (cron job)
 *
 * Why WhatsApp: In Tanzania, 89% of smartphone users use WhatsApp daily.
 * Operators and agents check WhatsApp before email, before SMS, before anything.
 * This is the retention hook that keeps GridOS open every morning.
 */

import axios from 'axios';
import { supabase } from '../../db.js';

const TWILIO_SID   = process.env.TWILIO_SID;
const TWILIO_TOKEN = process.env.TWILIO_TOKEN;
const WA_FROM      = process.env.TWILIO_WA_FROM || 'whatsapp:+14155238886'; // Twilio sandbox

// ── Core WhatsApp send ────────────────────────────────────────
export async function sendWhatsApp(to, message) {
  const toWA = to.startsWith('whatsapp:') ? to : `whatsapp:${normalizePhone(to)}`;
  try {
    const { data } = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
      new URLSearchParams({ From: WA_FROM, To: toWA, Body: message }),
      {
        auth: { username: TWILIO_SID, password: TWILIO_TOKEN },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );
    console.log(`[WhatsApp] Sent to ${to}: ${data.sid}`);
    return { success: true, sid: data.sid };
  } catch (err) {
    console.error(`[WhatsApp] Failed: ${err.response?.data?.message || err.message}`);
    return { success: false, error: err.message };
  }
}

// ── Alert notification (fires on critical events) ─────────────
export async function notifyOperatorAlert(alert) {
  const { data: op } = await supabase.from('operators')
    .select('contact_phone, name').eq('id', alert.operator_id).single();
  if (!op?.contact_phone) return;

  const severityEmoji = {
    critical: '🔴', high: '🟠', medium: '🟡', low: '⚪'
  }[alert.severity] || '⚠️';

  const message =
    `${severityEmoji} *GridOS Alert*\n` +
    `${alert.alert_type.replace(/_/g, ' ')}\n\n` +
    `📍 Site: ${alert.site_name || 'Unknown'}\n` +
    `⚡ Meter: ${alert.meter_ref || '—'}\n` +
    `👤 Customer: ${alert.customer_name || '—'}\n\n` +
    `${alert.message}\n\n` +
    `🕐 ${new Date().toLocaleTimeString('en-TZ', { timeZone: 'Africa/Dar_es_Salaam' })}\n` +
    `_Reply RESOLVE to acknowledge_`;

  await sendWhatsApp(op.contact_phone, message);
}

// ── Low credit warning to customer ───────────────────────────
export async function notifyLowCredit(customer, balanceTzs) {
  if (!customer.phone) return;
  const message =
    `⚡ *GridOS - Salio Chini*\n\n` +
    `Habari ${customer.full_name?.split(' ')[0]},\n\n` +
    `Salio lako ni *TZS ${balanceTzs.toLocaleString()}*\n\n` +
    `Nunua tokeni sasa:\n` +
    `📞 Piga *150*00# kwenye simu yako\n` +
    `au\n` +
    `💰 Lipa kupitia M-Pesa: ${process.env.MPESA_PAYBILL || '400200'}\n` +
    `Akaunti: ${customer.account_number}\n\n` +
    `_GridOS - Nguvu ya akili_`;
  await sendWhatsApp(customer.phone, message);
}

// ── Daily digest (fires at 7am Tanzania time) ─────────────────
export async function sendDailyDigest(operatorId) {
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  const now       = new Date().toISOString();

  // Revenue yesterday
  const { data: revenue } = await supabase.from('billing_events')
    .select('amount_tzs').eq('operator_id', operatorId)
    .gte('occurred_at', yesterday).gt('amount_tzs', 0);

  // Active customers
  const { count: active } = await supabase.from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('operator_id', operatorId).gt('balance_tzs', 0);

  // Low credit
  const { count: lowCredit } = await supabase.from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('operator_id', operatorId).gt('balance_tzs', 0).lt('balance_tzs', 3000);

  // Zero balance
  const { count: zero } = await supabase.from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('operator_id', operatorId).eq('balance_tzs', 0);

  // Open alerts
  const { count: openAlerts } = await supabase.from('alerts')
    .select('*', { count: 'exact', head: true })
    .eq('operator_id', operatorId).eq('resolved', false);

  const revYesterday = (revenue || []).reduce((s, r) => s + parseFloat(r.amount_tzs || 0), 0);

  // Smart recommendation
  let recommendation = '';
  if (zero > 0)      recommendation = `🔴 ${zero} customers have zero balance — agents should visit today.`;
  else if (lowCredit > 0) recommendation = `🟡 ${lowCredit} customers have low credit — send reminder SMS.`;
  else if (openAlerts > 0) recommendation = `🟠 ${openAlerts} unresolved alerts — check dashboard.`;
  else                recommendation = `✅ All systems healthy. Great day ahead!`;

  // Get operator details
  const { data: op } = await supabase.from('operators')
    .select('name, contact_phone').eq('id', operatorId).single();
  if (!op?.contact_phone) return;

  const tzTime = new Date().toLocaleDateString('en-TZ', {
    timeZone: 'Africa/Dar_es_Salaam', weekday:'long', day:'numeric', month:'long'
  });

  const message =
    `☀️ *GridOS Morning Digest*\n` +
    `_${tzTime}_\n\n` +
    `💰 Revenue yesterday: *TZS ${Math.round(revYesterday).toLocaleString()}*\n` +
    `👥 Active customers: *${active || 0}*\n` +
    `🟡 Low credit: *${lowCredit || 0}*\n` +
    `🔴 Zero balance: *${zero || 0}*\n` +
    `🔔 Open alerts: *${openAlerts || 0}*\n\n` +
    `📋 *Today's recommendation:*\n${recommendation}\n\n` +
    `🔗 Dashboard: https://gridios.app\n` +
    `_GridOS · ${op.name}_`;

  await sendWhatsApp(op.contact_phone, message);
  console.log(`[Digest] Sent to ${op.name} (${op.contact_phone})`);
}

// ── Weekly summary ────────────────────────────────────────────
export async function sendWeeklyDigest(operatorId) {
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const { data: weekRevenue } = await supabase.from('billing_events')
    .select('amount_tzs').eq('operator_id', operatorId)
    .gte('occurred_at', weekAgo).gt('amount_tzs', 0);

  const { count: newCustomers } = await supabase.from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('operator_id', operatorId).gte('created_at', weekAgo);

  const { count: totalTokens } = await supabase.from('billing_events')
    .select('*', { count: 'exact', head: true })
    .eq('operator_id', operatorId).eq('event_type', 'TOKEN_PURCHASED')
    .gte('occurred_at', weekAgo);

  const weekRev = (weekRevenue || []).reduce((s, r) => s + parseFloat(r.amount_tzs || 0), 0);

  const { data: op } = await supabase.from('operators')
    .select('name, contact_phone').eq('id', operatorId).single();
  if (!op?.contact_phone) return;

  const message =
    `📊 *GridOS Weekly Summary*\n\n` +
    `💰 Week revenue: *TZS ${Math.round(weekRev).toLocaleString()}*\n` +
    `🎟️ Tokens issued: *${totalTokens || 0}*\n` +
    `🆕 New customers: *${newCustomers || 0}*\n\n` +
    `📈 Full report: https://gridios.app/reports\n` +
    `_GridOS · ${op.name}_`;

  await sendWhatsApp(op.contact_phone, message);
}

// ── Cron scheduler (call from server.js) ──────────────────────
export async function startDigestCron() {
  // Run at 7:00 AM Tanzania time (UTC+3 = 04:00 UTC)
  const now   = new Date();
  const tzHour = (now.getUTCHours() + 3) % 24;
  const msToNextRun = ((4 - now.getUTCHours() + 24) % 24) * 3600000;

  console.log(`[Digest] Next daily digest in ${Math.round(msToNextRun/3600000)}h`);

  setTimeout(async () => {
    await runAllDigests();
    setInterval(runAllDigests, 24 * 3600000);
  }, msToNextRun);
}

async function runAllDigests() {
  const { data: operators } = await supabase.from('operators').select('id').eq('plan', 'growth').or('plan.eq.scale,plan.eq.starter');
  for (const op of (operators || [])) {
    try { await sendDailyDigest(op.id); } catch (e) { console.error(e); }
  }
}

function normalizePhone(phone) {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('0'))   return `+255${digits.slice(1)}`;
  if (digits.startsWith('255')) return `+${digits}`;
  if (digits.startsWith('+'))   return digits;
  return `+${digits}`;
}
