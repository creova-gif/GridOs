# ⚡ ClickPesa Webhook - Quick Start (2 Minutes)

## 🎯 **YOUR WEBHOOK URL**

```
https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-4719aee2/webhooks/clickpesa/callback
```

*Replace `YOUR_PROJECT_ID` with your actual Supabase project ID.*

---

## ✅ **3-STEP SETUP**

### Step 1: Copy Your Webhook URL
Click the URL above and copy it to your clipboard.

### Step 2: Add to ClickPesa Dashboard
1. Log in: https://clickpesa.com/dashboard
2. Go to: **Settings** → **Webhooks** → **Add Webhook**
3. Paste your webhook URL
4. Select events: `payment.success`, `payment.failed`, `payment.cancelled`
5. Click **Save**

### Step 3: Test It
ClickPesa will automatically send a test webhook. You should see:
```json
{ "success": true, "message": "Webhook processed successfully" }
```

---

## ✅ **WHAT HAPPENS AUTOMATICALLY**

When a customer pays:

1. ✅ **ClickPesa sends webhook** → Your endpoint receives it
2. ✅ **Signature verified** → HMAC-SHA256 authentication
3. ✅ **Payment updated** → Database record marked as complete
4. ✅ **STS token generated** → 20-digit token created
5. ✅ **Balance credited** → Customer balance updated
6. ✅ **Transaction logged** → Audit trail created
7. ⏭️ **SMS sent** → Token delivery (next: Africa's Talking)

---

## 🔐 **SECURITY - ALREADY HANDLED**

Your webhook automatically:
- ✅ Verifies HMAC-SHA256 signatures
- ✅ Validates payload integrity
- ✅ Rejects unauthorized requests
- ✅ Logs all webhook events
- ✅ Handles duplicate webhooks

**You don't need to write any code - it's all built!**

---

## 🧪 **TEST YOUR WEBHOOK**

### Option 1: ClickPesa Dashboard (Easiest)
1. Go to **Settings** → **Webhooks**
2. Click **Test Webhook** next to your webhook
3. Check logs for success message

### Option 2: Curl Command (Advanced)
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/make-server-4719aee2/webhooks/clickpesa/callback \
  -H "Content-Type: application/json" \
  -H "X-Signature: test-sig-12345" \
  -d '{
    "reference": "GRIDOS-TEST-001",
    "status": "success",
    "amount": 5000
  }'
```

### Option 3: Testing UI (In Your App)
Navigate to **Webhook Test** page (if added to navigation).

---

## 📊 **VERIFY IT'S WORKING**

Check your Supabase Edge Function logs:

```bash
# Look for these success messages:
✅ [ClickPesa Webhook] Received callback
✅ [ClickPesa Webhook] Payment successful for [Customer]
✅ [ClickPesa Webhook] STS token generated: XXXX-XXXX-...
```

---

## 🐛 **COMMON ISSUES**

### "401 Unauthorized"
**Fix:** Check `CLICKPESA_SECRET_KEY` environment variable matches ClickPesa dashboard

### "404 Payment not found"
**Fix:** Ensure payment was initiated via `/payments/clickpesa/initiate` first

### "Webhook times out"
**Fix:** Check Supabase Edge Function logs for errors

---

## 🎓 **FULL DOCUMENTATION**

For detailed documentation, see:
- **[WEBHOOK_SETUP.md](/WEBHOOK_SETUP.md)** - Complete guide
- **[CLICKPESA_INTEGRATION.md](/CLICKPESA_INTEGRATION.md)** - API reference

---

## ✅ **CHECKLIST**

- [ ] Webhook URL copied
- [ ] Added to ClickPesa dashboard
- [ ] Events selected (success, failed, cancelled)
- [ ] Test webhook sent successfully
- [ ] `CLICKPESA_SECRET_KEY` environment variable set
- [ ] Logs show successful webhook processing

---

## 🚀 **YOU'RE DONE!**

```
╔═══════════════════════════════════════════╗
║                                           ║
║   ✅  Webhook Configured                 ║
║   ✅  Payments Will Process Automatically ║
║   ✅  Production Ready                    ║
║                                           ║
╚═══════════════════════════════════════════╝
```

**Next:** Test a real payment and watch the magic happen! 🎉
