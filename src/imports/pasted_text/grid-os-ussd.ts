/**
 * GridOS USSD Handler
 * Africa's Talking posts form-encoded data to this endpoint.
 * Customers dial e.g. *150*00# on any GSM phone — no smartphone needed.
 *
 * Menu structure:
 *   1. Angalia salio (Check balance)
 *   2. Nunua tokeni (Buy tokens)
 *   3. Ripoti tatizo (Report fault)
 *   4. Malipo ya mwisho (Last payment)
 */

import { Router } from 'express';
import { supabase } from '../db.js';
import { sendSms }  from '../services/sms.js';
import { generateStsToken } from '../services/sts.js';

export const ussdRouter = Router();

// Session state (in-memory for MVP; use Redis in production)
const sessions = new Map();

ussdRouter.post('/', async (req, res) => {
  const { sessionId, serviceCode, phoneNumber, text } = req.body;

  // text is cumulative: "" → "1" → "1*500" etc.
  const parts  = text ? text.split('*') : [];
  const level  = parts.length;
  const last   = parts[level - 1] || '';

  let response = '';

  try {
    // Lookup customer by phone
    const { data: customer } = await supabase
      .from('customers')
      .select(`*, meters(meter_ref, status)`)
      .eq('phone', phoneNumber)
      .single();

    // ── Level 0: Main menu ─────────────────────────────────────
    if (text === '') {
      const greeting = customer
        ? `Habari ${customer.full_name.split(' ')[0]}! Salio: TZS ${customer.balance_tzs?.toFixed(0)}`
        : 'Habari! GridOS Huduma za Umeme';

      response = `CON ${greeting}

1. Angalia salio
2. Nunua tokeni
3. Ripoti tatizo
4. Malipo ya mwisho
5. Wasiliana na wakala`;

    // ── Level 1: Submenu ───────────────────────────────────────
    } else if (level === 1) {
      switch (last) {
        case '1': // Check balance
          if (!customer) {
            response = `END Nambari hii haijasajiliwa. Wasiliana na GridOS: 0800 000 000`;
          } else {
            const status = customer.balance_tzs <= 0 ? '❌ Imezimwa'
                         : customer.balance_tzs < 3000 ? '⚠ Salio chini' : '✓ Imeunganishwa';
            response = `END Salio lako: TZS ${customer.balance_tzs?.toFixed(0)}
Hali: ${status}
Mita: ${customer.meters?.meter_ref || 'N/A'}

Nunua tokeni piga: *150*00*2#`;
          }
          break;

        case '2': // Buy tokens — prompt amount
          if (!customer) {
            response = `END Nambari hii haijasajiliwa. Piga simu: 0800 000 000`;
          } else {
            response = `CON Weka kiasi cha kununua (TZS):
Mfano: 2000, 5000, 10000

(Andika kiasi)`;
          }
          break;

        case '3': // Report fault
          response = `CON Chagua aina ya tatizo:
1. Hakuna umeme
2. Mita haiendi
3. Tatizo la malipo
4. Nyingine`;
          break;

        case '4': // Last payment
          if (!customer) {
            response = `END Nambari hii haijasajiliwa.`;
          } else {
            const { data: last_evt } = await supabase
              .from('billing_events')
              .select('*')
              .eq('customer_id', customer.id)
              .in('event_type', ['TOKEN_PURCHASED','CASH_COLLECTED'])
              .order('occurred_at', { ascending: false })
              .limit(1)
              .single();

            if (!last_evt) {
              response = `END Hakuna malipo yaliyorekodiwa.`;
            } else {
              const date = new Date(last_evt.occurred_at).toLocaleDateString('sw-TZ');
              response = `END Malipo ya mwisho:
TZS ${last_evt.amount_tzs?.toFixed(0)}
Tarehe: ${date}
Njia: ${last_evt.payment_method || 'wakala'}`;
            }
          }
          break;

        case '5': // Contact agent
          response = `END Wakala wa karibu:
Piga: 0755 000 000
Au tuma SMS: "MSAADA" kwenda 15100`;
          break;

        default:
          response = `END Chaguo lisilo sahihi. Jaribu tena.`;
      }

    // ── Level 2: Token purchase — process amount ───────────────
    } else if (level === 2 && parts[0] === '2') {
      const amount = parseFloat(last);

      if (isNaN(amount) || amount < 500) {
        response = `END Kiasi kisicho sahihi. Kiasi cha chini ni TZS 500.`;
      } else if (!customer) {
        response = `END Nambari hii haijasajiliwa.`;
      } else {
        // Confirm purchase
        const tariff = customer.customer_type === 'business' ? 1560
                     : customer.customer_type === 'productive' ? 1310 : 1710;
        const kwh = (amount / tariff).toFixed(2);
        sessions.set(sessionId, { amount, customer_id: customer.id });

        response = `CON Thibitisha ununuzi:
TZS ${amount.toFixed(0)} = ${kwh} kWh

1. Thibitisha (Confirm)
2. Ghairi (Cancel)`;
      }

    // ── Level 3: Confirm token purchase ───────────────────────
    } else if (level === 3 && parts[0] === '2') {
      const sess = sessions.get(sessionId);

      if (last !== '1' || !sess) {
        sessions.delete(sessionId);
        response = `END Umeghairi. Asante.`;
      } else {
        const { amount, customer_id } = sess;
        sessions.delete(sessionId);

        const { data: cust } = await supabase
          .from('customers')
          .select('*, meters(id, sts_meter_no, meter_ref)')
          .eq('id', customer_id).single();

        const tariff     = cust.customer_type === 'business' ? 1560
                         : cust.customer_type === 'productive' ? 1310 : 1710;
        const energy_kwh = amount / tariff;
        const token_value = generateStsToken({
          meterNo: cust.meters?.sts_meter_no || cust.meters?.meter_ref,
          amount:  energy_kwh,
        });
        const balance_after = (cust.balance_tzs || 0) + amount;

        // Record billing event
        await supabase.from('billing_events').insert({
          customer_id: cust.id,
          operator_id: cust.operator_id,
          site_id:     cust.site_id,
          meter_id:    cust.meter_id,
          event_type:  'TOKEN_PURCHASED',
          amount_tzs:  amount,
          balance_after,
          energy_kwh,
          tariff_tzs_per_kwh: tariff,
          token_issued: token_value,
          payment_method: 'ussd',
        });

        // SMS delivery of token
        await sendSms(cust.phone,
          `Tokeni: ${token_value}\nKWh: ${energy_kwh.toFixed(2)}\nSalio jipya: TZS ${balance_after.toFixed(0)}\nAsante! GridOS`
        );

        response = `END Tokeni yako:
${token_value}

Ingiza kwenye mita yako.
SMS imetumwa kwa ${cust.phone.slice(-4).padStart(cust.phone.length, '*')}`;
      }

    // ── Level 2: Fault report ──────────────────────────────────
    } else if (level === 2 && parts[0] === '3') {
      const faultTypes = { '1':'SITE_OUTAGE','2':'METER_OFFLINE','3':'DISCONNECTED','4':'SITE_OUTAGE' };
      const faultLabels = { '1':'Hakuna umeme','2':'Mita haiendi','3':'Tatizo la malipo','4':'Tatizo lingine' };
      const faultType = faultTypes[last] || 'SITE_OUTAGE';

      if (customer) {
        await supabase.from('alerts').insert({
          operator_id: customer.operator_id,
          site_id:     customer.site_id,
          meter_id:    customer.meter_id,
          customer_id: customer.id,
          alert_type:  faultType,
          severity:    'medium',
          message:     `Ripoti ya mteja (USSD): ${faultLabels[last] || 'Tatizo'} — ${customer.full_name}`,
          metadata:    { source: 'ussd', phone: phoneNumber },
        });
      }

      response = `END Tatizo lako limerekodiwa. Timu yetu itashughulikia haraka.

Namba ya dharura: 0800 000 000`;

    } else {
      response = `END Kuna hitilafu. Jaribu tena au piga simu: 0800 000 000`;
    }

  } catch (err) {
    console.error('USSD error:', err);
    response = `END Hitilafu ya mfumo. Jaribu tena baadaye. (${err.message})`;
  }

  // Africa's Talking expects plain text response
  res.set('Content-Type', 'text/plain');
  res.send(response);
});
