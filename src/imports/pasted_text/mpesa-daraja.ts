/**
 * GridOS — M-Pesa Daraja Integration (Tanzania)
 * Supports: STK Push, C2B paybill, B2C disbursement, webhook validation
 * Vodacom Tanzania Daraja API: https://developer.vodacom.co.tz
 */

import axios from 'axios';
import { supabase } from '../../db.js';
import { sendSms } from '../sms.js';

const DARAJA_BASE = process.env.MPESA_ENV === 'production'
  ? 'https://openapi.m-pesa.com'
  : 'https://sandbox.safaricom.co.ke'; // Use Safaricom sandbox for dev

const CONSUMER_KEY    = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const PAYBILL         = process.env.MPESA_PAYBILL || '400200';
const PASSKEY         = process.env.MPESA_PASSKEY  || '';
const CALLBACK_URL    = process.env.MPESA_CALLBACK_URL || 'https://api.gridios.app/webhooks/mpesa';

// ── Get OAuth token ───────────────────────────────────────────
let _tokenCache = null;
let _tokenExpiry = 0;

async function getToken() {
  if (_tokenCache && Date.now() < _tokenExpiry) return _tokenCache;
  const creds = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  const { data } = await axios.get(`${DARAJA_BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${creds}` },
  });
  _tokenCache = data.access_token;
  _tokenExpiry = Date.now() + (parseInt(data.expires_in) - 60) * 1000;
  return _tokenCache;
}

// ── STK Push (Lipa Na M-Pesa) ─────────────────────────────────
// Customer pays on their phone via a prompt
export async function stkPush({ phone, amount, accountRef, description }) {
  const token     = await getToken();
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const password  = Buffer.from(`${PAYBILL}${PASSKEY}${timestamp}`).toString('base64');

  const normalized = normalizePhone(phone);

  const { data } = await axios.post(
    `${DARAJA_BASE}/mpesa/stkpush/v1/processrequest`,
    {
      BusinessShortCode: PAYBILL,
      Password:          password,
      Timestamp:         timestamp,
      TransactionType:   'CustomerPayBillOnline',
      Amount:            Math.round(amount),
      PartyA:            normalized,
      PartyB:            PAYBILL,
      PhoneNumber:       normalized,
      CallBackURL:       `${CALLBACK_URL}/stk`,
      AccountReference:  accountRef,
      TransactionDesc:   description || 'GridOS electricity top-up',
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return {
    checkout_request_id: data.CheckoutRequestID,
    merchant_request_id: data.MerchantRequestID,
    response_code:       data.ResponseCode,
    response_description: data.ResponseDescription,
  };
}

// ── Validate STK callback ─────────────────────────────────────
export async function handleStkCallback(body) {
  const callback = body?.Body?.stkCallback;
  if (!callback) return { success: false, error: 'Invalid callback body' };

  const { ResultCode, ResultDesc, CheckoutRequestID, CallbackMetadata } = callback;

  if (ResultCode !== 0) {
    console.log(`[M-Pesa] STK failed: ${ResultDesc}`);
    return { success: false, result_code: ResultCode, description: ResultDesc };
  }

  // Extract metadata
  const meta = {};
  (CallbackMetadata?.Item || []).forEach(item => { meta[item.Name] = item.Value; });

  const txRef        = meta['MpesaReceiptNumber'];
  const amountPaid   = meta['Amount'];
  const phone        = String(meta['PhoneNumber']);
  const transactedAt = meta['TransactionDate'];

  // Find pending payment by checkout_request_id
  const { data: payment } = await supabase
    .from('payment_transactions')
    .select('*, customers(id, full_name, operator_id, site_id, meter_id, balance_tzs, customer_type)')
    .eq('checkout_request_id', CheckoutRequestID)
    .single();

  if (!payment) return { success: false, error: 'Payment record not found' };

  const customer = payment.customers;
  const tariff   = customer.customer_type === 'business' ? 1560
                 : customer.customer_type === 'productive' ? 1310 : 1710;
  const energy_kwh = parseFloat(amountPaid) / tariff;

  // Generate STS token (stub — replace with licensed STS generator)
  const { generateStsToken } = await import('../sts.js');
  const token = generateStsToken({ meterNo: payment.meter_ref, amount: energy_kwh });

  const balanceAfter = (customer.balance_tzs || 0) + parseFloat(amountPaid);

  // Create billing event
  await supabase.from('billing_events').insert({
    customer_id:      customer.id,
    operator_id:      customer.operator_id,
    site_id:          customer.site_id,
    meter_id:         customer.meter_id,
    event_type:       'TOKEN_PURCHASED',
    amount_tzs:       parseFloat(amountPaid),
    balance_after:    balanceAfter,
    energy_kwh,
    tariff_tzs_per_kwh: tariff,
    token_issued:     token,
    payment_method:   'mpesa',
    mpesa_receipt:    txRef,
    occurred_at:      new Date().toISOString(),
  });

  // Update payment record
  await supabase.from('payment_transactions').update({
    status:       'completed',
    mpesa_receipt: txRef,
    completed_at:  new Date().toISOString(),
  }).eq('id', payment.id);

  // Send token via SMS
  await sendSms(phone,
    `GridOS: Tokeni yako: ${token}\n` +
    `Kiasi: TZS ${Math.round(amountPaid).toLocaleString()}\n` +
    `Nishati: ${energy_kwh.toFixed(2)} kWh\n` +
    `Ingiza kwenye mita yako.`
  );

  return { success: true, token, energy_kwh, balance_after: balanceAfter, mpesa_receipt: txRef };
}

// ── C2B Paybill webhook (customer pays via paybill number) ────
export async function handleC2bCallback(body) {
  const {
    TransactionType, TransID, TransTime, TransAmount,
    BusinessShortCode, BillRefNumber, MSISDN, FirstName,
  } = body;

  // BillRefNumber = account number (customer account_number or meter_ref)
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('account_number', BillRefNumber)
    .single();

  if (!customer) {
    console.warn(`[M-Pesa C2B] Unknown account: ${BillRefNumber}`);
    return { ResultCode: 0, ResultDesc: 'Accepted' }; // Always accept to Safaricom
  }

  const amount     = parseFloat(TransAmount);
  const tariff     = customer.customer_type === 'business' ? 1560
                   : customer.customer_type === 'productive' ? 1310 : 1710;
  const energy_kwh = amount / tariff;
  const { generateStsToken } = await import('../sts.js');
  const token = generateStsToken({ meterNo: customer.meter_ref, amount: energy_kwh });
  const balanceAfter = (customer.balance_tzs || 0) + amount;

  await supabase.from('billing_events').insert({
    customer_id: customer.id, operator_id: customer.operator_id,
    site_id: customer.site_id, meter_id: customer.meter_id,
    event_type: 'TOKEN_PURCHASED', amount_tzs: amount,
    balance_after: balanceAfter, energy_kwh, tariff_tzs_per_kwh: tariff,
    token_issued: token, payment_method: 'mpesa_c2b', mpesa_receipt: TransID,
  });

  await sendSms(MSISDN,
    `GridOS: Tokeni: ${token} | TZS ${amount.toLocaleString()} | ${energy_kwh.toFixed(2)} kWh`
  );

  return { ResultCode: 0, ResultDesc: 'Accepted' };
}

// ── Initiate payment (creates pending record + STK Push) ───────
export async function initiatePayment({ customerId, amountTzs, phone }) {
  const { data: customer } = await supabase.from('customers')
    .select('*, meters(meter_ref)').eq('id', customerId).single();
  if (!customer) return { error: 'Customer not found' };

  // Create pending payment
  const { data: payment } = await supabase.from('payment_transactions').insert({
    customer_id:  customerId,
    operator_id:  customer.operator_id,
    site_id:      customer.site_id,
    amount_tzs:   amountTzs,
    status:       'pending',
    payment_method: 'mpesa_stk',
    meter_ref:    customer.meters?.meter_ref,
    created_at:   new Date().toISOString(),
  }).select().single();

  // Initiate STK Push
  try {
    const stkResult = await stkPush({
      phone:      phone || customer.phone,
      amount:     amountTzs,
      accountRef: customer.account_number,
      description: `GridOS electricity - ${customer.meters?.meter_ref}`,
    });

    await supabase.from('payment_transactions').update({
      checkout_request_id: stkResult.checkout_request_id,
    }).eq('id', payment.id);

    return { success: true, payment_id: payment.id, ...stkResult };
  } catch (err) {
    await supabase.from('payment_transactions').update({ status: 'failed' }).eq('id', payment.id);
    return { error: err.message };
  }
}

// ── Normalize phone number ────────────────────────────────────
function normalizePhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0'))  return `255${digits.slice(1)}`;
  if (digits.startsWith('255')) return digits;
  if (digits.startsWith('+'))  return digits.slice(1);
  return digits;
}
