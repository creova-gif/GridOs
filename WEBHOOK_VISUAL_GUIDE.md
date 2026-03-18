# 🎨 ClickPesa Webhook - Visual Guide

## 📍 **STEP 1: FIND YOUR WEBHOOK URL**

```
┌────────────────────────────────────────────────────────────────┐
│  Your Webhook URL (Copy This)                                  │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  https://YOUR_PROJECT_ID.supabase.co/functions/v1/             │
│         make-server-4719aee2/webhooks/clickpesa/callback       │
│                                                                 │
│  [📋 Copy URL]                                                 │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Replace `YOUR_PROJECT_ID` with your actual Supabase project ID.**

---

## 🔧 **STEP 2: CONFIGURE IN CLICKPESA DASHBOARD**

### A. Login to ClickPesa
```
┌─────────────────────────────────────┐
│  🌐 https://clickpesa.com/dashboard │
│                                      │
│  Email:    [________________]       │
│  Password: [________________]       │
│                                      │
│  [ Login ]                          │
└─────────────────────────────────────┘
```

### B. Navigate to Webhooks
```
Dashboard
  ├── Overview
  ├── Transactions
  ├── Settings  ← Click here
  │   ├── Profile
  │   ├── API Keys
  │   └── Webhooks  ← Then click here
  └── Reports
```

### C. Add New Webhook
```
┌────────────────────────────────────────────────────────────────┐
│  Add Webhook                                                    │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Webhook URL *                                                  │
│  [_________________________________________________________]   │
│   Paste your webhook URL here                                  │
│                                                                 │
│  Events *                                                       │
│  ☑ payment.success    Payment completed successfully          │
│  ☑ payment.completed  Alternative success event               │
│  ☑ payment.failed     Payment failed                          │
│  ☑ payment.cancelled  Customer cancelled payment              │
│  ☐ payment.pending    (Optional)                              │
│                                                                 │
│  [ Cancel ]  [ Save Webhook ]                                  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔄 **STEP 3: WEBHOOK FLOW VISUALIZATION**

```
┌──────────────┐
│   CUSTOMER   │
│              │
│  Pays via    │
│  M-Pesa      │
└──────┬───────┘
       │
       │ 1. Enters PIN on phone
       ↓
┌──────────────────────────────────────────────────────┐
│                   CLICKPESA                          │
│                                                       │
│  • Processes payment                                 │
│  • Generates webhook payload                         │
│  • Signs with HMAC-SHA256                            │
└──────┬───────────────────────────────────────────────┘
       │
       │ 2. Sends webhook POST request
       │    Header: X-Signature: 3a4b5c...
       ↓
┌──────────────────────────────────────────────────────┐
│              YOUR GRIDOS WEBHOOK                     │
│   /webhooks/clickpesa/callback                       │
│                                                       │
│  ✓ Verify signature (HMAC-SHA256)                   │
│  ✓ Find payment record by reference                 │
│  ✓ Update payment status                            │
└──────┬───────────────────────────────────────────────┘
       │
       │ 3. If status = "success"
       ↓
┌──────────────────────────────────────────────────────┐
│            PAYMENT SUCCESS ACTIONS                   │
│                                                       │
│  1. Generate STS Token                               │
│     ┌──────────────────────────────┐                │
│     │ 1234-5678-9012-3456-7890    │                │
│     └──────────────────────────────┘                │
│                                                       │
│  2. Calculate kWh                                    │
│     TZS 5,000 ÷ 400 = 12.50 kWh                     │
│                                                       │
│  3. Update Customer Balance                          │
│     Old: TZS 2,000                                   │
│     New: TZS 7,000 (+5,000)                         │
│                                                       │
│  4. Create Transaction Record                        │
│     txn_1710611234567_abc123                        │
│                                                       │
│  5. [TODO] Send SMS Token                           │
│     → Africa's Talking integration                   │
└──────┬───────────────────────────────────────────────┘
       │
       │ 4. Return 200 OK
       ↓
┌──────────────────────────────────────────────────────┐
│              CLICKPESA RECEIVES                      │
│                                                       │
│  { "success": true,                                  │
│    "message": "Webhook processed successfully" }     │
│                                                       │
│  ✓ Marks webhook as delivered                       │
└──────────────────────────────────────────────────────┘
```

---

## 📊 **WEBHOOK PAYLOAD EXAMPLES**

### ✅ Success Webhook
```
┌────────────────────────────────────────────────────────┐
│  POST /webhooks/clickpesa/callback                     │
├────────────────────────────────────────────────────────┤
│  Headers:                                              │
│    Content-Type: application/json                      │
│    X-Signature: 3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d...   │
│                                                         │
│  Body:                                                  │
│  {                                                      │
│    "reference": "GRIDOS-1710611234567-ABC123",        │
│    "transaction_id": "CP-TXN-123456789",              │
│    "status": "success",           ← Success!          │
│    "amount": 5050,                                     │
│    "currency": "TZS",                                  │
│    "provider": "MPESA",                                │
│    "phone": "+255712345678",                           │
│    "timestamp": "2026-03-16T14:30:00Z"                │
│  }                                                      │
└────────────────────────────────────────────────────────┘
           ↓
    ✅ RESULT:
    • STS Token: 1234-5678-9012-3456-7890
    • kWh: 12.50
    • Balance: +TZS 5,000
```

### ❌ Failed Webhook
```
┌────────────────────────────────────────────────────────┐
│  POST /webhooks/clickpesa/callback                     │
├────────────────────────────────────────────────────────┤
│  Body:                                                  │
│  {                                                      │
│    "reference": "GRIDOS-1710611234567-ABC123",        │
│    "transaction_id": "CP-TXN-123456789",              │
│    "status": "failed",            ← Failed            │
│    "amount": 5050,                                     │
│    "error_code": "INSUFFICIENT_FUNDS",                │
│    "error_message": "Insufficient balance"            │
│  }                                                      │
└────────────────────────────────────────────────────────┘
           ↓
    ❌ RESULT:
    • No STS Token
    • No kWh credited
    • Balance unchanged
    • Payment marked as failed
```

---

## 🔐 **SECURITY VISUALIZATION**

### HMAC-SHA256 Signature Verification
```
┌─────────────────────────────────────────────────────┐
│  CLICKPESA SIDE (Signing)                           │
├─────────────────────────────────────────────────────┤
│                                                      │
│  1. Sort payload keys alphabetically:               │
│     amount=5050&currency=TZS&phone=+255712345678... │
│                                                      │
│  2. Generate HMAC with SECRET_KEY:                  │
│     HMAC-SHA256(payload, SECRET_KEY)                │
│                                                      │
│  3. Result: 3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d...     │
│                                                      │
│  4. Send in X-Signature header                      │
│                                                      │
└─────────────────────────────────────────────────────┘
               ↓  Webhook HTTP Request  ↓
┌─────────────────────────────────────────────────────┐
│  GRIDOS SIDE (Verifying)                            │
├─────────────────────────────────────────────────────┤
│                                                      │
│  1. Receive webhook with X-Signature header         │
│                                                      │
│  2. Re-generate signature with same method:         │
│     HMAC-SHA256(payload, SECRET_KEY)                │
│                                                      │
│  3. Compare signatures:                             │
│     Received:  3a4b5c6d7e8f9a0b1c2d3e4f...          │
│     Generated: 3a4b5c6d7e8f9a0b1c2d3e4f...          │
│                                                      │
│  4. If match → ✅ Process webhook                   │
│     If no match → ❌ Reject (401 Unauthorized)      │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 📈 **MONITORING DASHBOARD**

### What to Watch
```
┌─────────────────────────────────────────────────────────┐
│  WEBHOOK HEALTH DASHBOARD                               │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Today                                                   │
│  ├─ Total Webhooks:     247                            │
│  ├─ Successful:         243 (98.4%)  ✅                │
│  ├─ Failed:               4 (1.6%)   ⚠️                │
│  └─ Avg Response Time:  287ms                          │
│                                                          │
│  This Week                                               │
│  ├─ Total Payments:   1,834                            │
│  ├─ Success Rate:      97.8%  ✅                       │
│  ├─ Failed Payments:     40                            │
│  └─ Retry Success:       35 (87.5%)                    │
│                                                          │
│  Recent Webhooks (Live)                                  │
│  ├─ 14:32:15  ✅  GRIDOS-...ABC123  TZS 5,000         │
│  ├─ 14:31:48  ✅  GRIDOS-...XYZ789  TZS 3,500         │
│  ├─ 14:30:22  ❌  GRIDOS-...DEF456  Failed (timeout)  │
│  └─ 14:29:01  ✅  GRIDOS-...GHI012  TZS 7,200         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 **TESTING CHECKLIST**

```
┌─────────────────────────────────────────────────────────┐
│  WEBHOOK TESTING CHECKLIST                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Initial Setup                                           │
│  [ ] Webhook URL added to ClickPesa dashboard          │
│  [ ] Events selected (success, failed, cancelled)      │
│  [ ] CLICKPESA_SECRET_KEY environment variable set     │
│  [ ] Test webhook sent from ClickPesa dashboard        │
│                                                          │
│  Success Flow                                            │
│  [ ] Send success webhook                               │
│  [ ] Verify signature validated                         │
│  [ ] Check STS token generated                          │
│  [ ] Confirm customer balance updated                   │
│  [ ] Verify transaction logged                          │
│                                                          │
│  Failure Flows                                           │
│  [ ] Send failed webhook → no balance change           │
│  [ ] Send cancelled webhook → no balance change        │
│  [ ] Send invalid signature → 401 error                │
│  [ ] Send unknown reference → 404 error                │
│                                                          │
│  Edge Cases                                              │
│  [ ] Duplicate webhook → idempotent                    │
│  [ ] Malformed payload → error logged                  │
│  [ ] Missing fields → validation error                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 **DEPLOYMENT CHECKLIST**

```
┌─────────────────────────────────────────────────────────┐
│  PRODUCTION DEPLOYMENT                                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Pre-Deployment                                          │
│  [ ] All tests passing                                  │
│  [ ] Webhook URL uses HTTPS (not HTTP)                 │
│  [ ] Environment variables set                         │
│  [ ] Signature verification enabled                    │
│  [ ] Error logging configured                          │
│                                                          │
│  ClickPesa Configuration                                 │
│  [ ] Production API credentials obtained               │
│  [ ] Webhook URL configured in production dashboard    │
│  [ ] Events configured correctly                       │
│  [ ] Test webhook successful                           │
│                                                          │
│  Monitoring Setup                                        │
│  [ ] Webhook logs monitored                            │
│  [ ] Alerts for webhook failures                       │
│  [ ] Dashboard for success rates                       │
│  [ ] Retry logic documented                            │
│                                                          │
│  Post-Deployment                                         │
│  [ ] Process first real payment                        │
│  [ ] Verify webhook received                           │
│  [ ] Confirm STS token generated                       │
│  [ ] Customer balance updated                          │
│  [ ] SMS sent (when Africa's Talking integrated)       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ **SUCCESS INDICATORS**

### You'll know it's working when you see:

```
✅ ClickPesa Dashboard:
   └─ Webhook status: Active (green checkmark)

✅ Edge Function Logs:
   └─ [ClickPesa Webhook] Payment successful for [Customer]
   └─ [ClickPesa Webhook] STS token generated: XXXX-XXXX-...

✅ Database:
   └─ payment:payment_... → status: "success"
   └─ transaction:txn_... → stsToken: "1234-5678-..."
   └─ customer:cust_... → balance: +TZS 5,000

✅ Customer Experience:
   └─ Payment on phone → Token received → Power turned on
```

---

## 🎉 **YOU'RE ALL SET!**

```
╔═════════════════════════════════════════════════════════╗
║                                                         ║
║   🎯 Webhook URL: Ready                                ║
║   🔐 Security: HMAC-SHA256 Verified                    ║
║   ⚡ Processing: Automatic                             ║
║   📊 Monitoring: Logs Available                        ║
║   ✅ Status: PRODUCTION READY                          ║
║                                                         ║
║   Next: Test with real payment!                        ║
║                                                         ║
╚═════════════════════════════════════════════════════════╝
```

**Your webhook is configured and ready to process payments!** 🚀
