import { useState, useEffect } from 'react';
import { CreditCard, Smartphone, Check, X, Loader2, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface Provider {
  id: string;
  name: string;
  logo: string;
  color: string;
  operator: string;
  marketShare: string;
}

export default function PaymentTest() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('mpesa');
  const [phone, setPhone] = useState('+255712345678');
  const [amount, setAmount] = useState('5000');
  const [customerId, setCustomerId] = useState('customer:cust_001');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-4719aee2`;

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch(`${API_URL}/payments/providers`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();
      if (data.success) {
        setProviders(data.providers);
      }
    } catch (err) {
      console.error('Failed to fetch providers:', err);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/payments/clickpesa/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          customerId,
          amount: parseInt(amount),
          provider: selectedProvider,
          phone
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        // Start polling for payment status
        if (data.paymentId) {
          pollPaymentStatus(data.paymentId);
        }
      } else {
        setError(data.error || 'Payment initiation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = async (paymentId: string) => {
    let attempts = 0;
    const maxAttempts = 20; // Poll for 2 minutes (20 × 6 seconds)

    const interval = setInterval(async () => {
      attempts++;

      try {
        const response = await fetch(`${API_URL}/payments/clickpesa/status/${paymentId}`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        });
        const data = await response.json();

        if (data.success && data.payment) {
          if (data.payment.status !== 'pending') {
            // Payment completed/failed
            setResult((prev: any) => ({ ...prev, status: data.payment.status }));
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error('Failed to check payment status:', err);
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 6000); // Poll every 6 seconds
  };

  const calculateFee = (amt: number) => Math.round(amt * 0.01);
  const calculateTotal = (amt: number) => amt + calculateFee(amt);

  return (
    <div className=\"p-8 space-y-6\">
      {/* Header */}
      <div>
        <h1 className=\"text-2xl font-bold flex items-center gap-3\" style={{ color: 'var(--text-primary)' }}>
          <CreditCard className=\"w-7 h-7\" style={{ color: 'var(--brand-emerald)' }} />
          ClickPesa Payment Testing
        </h1>
        <p className=\"mt-1\" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-body)' }}>
          Test mobile money payments for all Tanzania providers • M-Pesa, Airtel, Tigo, Halopesa
        </p>
      </div>

      {/* Warning Banner */}
      <div className=\"rounded-lg border p-4\" style={{
        backgroundColor: 'rgba(239, 159, 39, 0.1)',
        borderColor: 'rgba(239, 159, 39, 0.3)'
      }}>
        <div className=\"flex items-start gap-3\">
          <AlertCircle className=\"w-5 h-5 mt-0.5\" style={{ color: '#EF9F27' }} />
          <div>
            <div className=\"font-medium\" style={{ color: '#EF9F27' }}>
              Configuration Required
            </div>
            <div className=\"text-sm mt-1\" style={{ color: 'var(--text-muted)' }}>
              Add <code style={{ backgroundColor: 'var(--bg-surface)', padding: '2px 6px', borderRadius: '4px' }}>CLICKPESA_API_KEY</code>, 
              <code style={{ backgroundColor: 'var(--bg-surface)', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px' }}>CLICKPESA_SECRET_KEY</code>, and 
              <code style={{ backgroundColor: 'var(--bg-surface)', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px' }}>CLICKPESA_MERCHANT_ID</code> to your environment variables.
              <br />
              See <a href=\"/CLICKPESA_INTEGRATION.md\" target=\"_blank\" rel=\"noopener noreferrer\" style={{ color: 'var(--brand-emerald)', textDecoration: 'underline' }}>CLICKPESA_INTEGRATION.md</a> for setup instructions.
            </div>
          </div>
        </div>
      </div>

      <div className=\"grid grid-cols-2 gap-6\">
        {/* Payment Form */}
        <div className=\"rounded-lg border p-6 space-y-6\" style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--bg-border-subtle)'
        }}>
          <h2 className=\"font-semibold text-lg\" style={{ color: 'var(--text-primary)' }}>
            Payment Details
          </h2>

          {/* Provider Selection */}
          <div>
            <label className=\"block text-sm font-medium mb-3\" style={{ color: 'var(--text-muted)' }}>
              Mobile Money Provider
            </label>
            <div className=\"grid grid-cols-2 gap-3\">
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider.id)}
                  className=\"p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2\"
                  style={{
                    borderColor: selectedProvider === provider.id ? provider.color : 'var(--bg-border-subtle)',
                    backgroundColor: selectedProvider === provider.id ? `${provider.color}15` : 'var(--bg-surface)'
                  }}
                >
                  <span className=\"text-3xl\">{provider.logo}</span>
                  <div className=\"text-sm font-medium\" style={{ color: 'var(--text-primary)' }}>
                    {provider.name}
                  </div>
                  <div className=\"text-xs\" style={{ color: 'var(--text-faint)' }}>
                    {provider.marketShare} share
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Customer ID */}
          <div>
            <label className=\"block text-sm font-medium mb-2\" style={{ color: 'var(--text-muted)' }}>
              Customer ID
            </label>
            <input
              type=\"text\"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className=\"w-full px-4 py-2 rounded-lg border\"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--bg-border-subtle)',
                color: 'var(--text-primary)'
              }}
              placeholder=\"customer:cust_001\"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className=\"block text-sm font-medium mb-2\" style={{ color: 'var(--text-muted)' }}>
              Phone Number
            </label>
            <input
              type=\"tel\"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className=\"w-full px-4 py-2 rounded-lg border\"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--bg-border-subtle)',
                color: 'var(--text-primary)'
              }}
              placeholder=\"+255712345678\"
            />
            <div className=\"text-xs mt-1\" style={{ color: 'var(--text-faint)' }}>
              Format: +255XXXXXXXXX or 0XXXXXXXXX
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className=\"block text-sm font-medium mb-2\" style={{ color: 'var(--text-muted)' }}>
              Amount (TZS)
            </label>
            <input
              type=\"number\"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className=\"w-full px-4 py-2 rounded-lg border\"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--bg-border-subtle)',
                color: 'var(--text-primary)'
              }}
              placeholder=\"5000\"
            />
            <div className=\"mt-3 p-3 rounded\" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <div className=\"flex justify-between text-sm mb-1\">
                <span style={{ color: 'var(--text-muted)' }}>Amount:</span>
                <span style={{ color: 'var(--text-primary)' }}>TZS {parseInt(amount || '0').toLocaleString()}</span>
              </div>
              <div className=\"flex justify-between text-sm mb-1\">
                <span style={{ color: 'var(--text-muted)' }}>Fee (1%):</span>
                <span style={{ color: 'var(--text-muted)' }}>TZS {calculateFee(parseInt(amount || '0')).toLocaleString()}</span>
              </div>
              <div className=\"flex justify-between text-sm font-medium pt-2 border-t\" style={{ borderColor: 'var(--bg-border-subtle)' }}>
                <span style={{ color: 'var(--text-primary)' }}>Total:</span>
                <span style={{ color: 'var(--brand-emerald)' }}>TZS {calculateTotal(parseInt(amount || '0')).toLocaleString()}</span>
              </div>
              <div className=\"text-xs mt-2\" style={{ color: 'var(--text-faint)' }}>
                kWh: {(parseInt(amount || '0') / 400).toFixed(2)} (@ 400 TZS/kWh)
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handlePayment}
            disabled={loading}
            className=\"w-full px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2\"
            style={{
              backgroundColor: loading ? 'var(--bg-surface)' : 'var(--brand-emerald)',
              color: loading ? 'var(--text-muted)' : '#ffffff',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? (
              <>
                <Loader2 className=\"w-5 h-5 animate-spin\" />
                Initiating Payment...
              </>
            ) : (
              <>
                <Smartphone className=\"w-5 h-5\" />
                Initiate Payment
              </>
            )}
          </button>
        </div>

        {/* Results */}
        <div className=\"rounded-lg border p-6 space-y-6\" style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--bg-border-subtle)'
        }}>
          <h2 className=\"font-semibold text-lg\" style={{ color: 'var(--text-primary)' }}>
            Payment Status
          </h2>

          {error && (
            <div className=\"rounded-lg border p-4\" style={{
              backgroundColor: 'rgba(226, 75, 74, 0.1)',
              borderColor: 'rgba(226, 75, 74, 0.3)'
            }}>
              <div className=\"flex items-start gap-3\">
                <X className=\"w-5 h-5 mt-0.5\" style={{ color: '#E24B4A' }} />
                <div>
                  <div className=\"font-medium\" style={{ color: '#E24B4A' }}>Payment Failed</div>
                  <div className=\"text-sm mt-1\" style={{ color: 'var(--text-muted)' }}>{error}</div>
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className=\"space-y-4\">
              {/* Status Badge */}
              <div className=\"flex items-center gap-2\">
                {result.status === 'pending' && (
                  <>
                    <Loader2 className=\"w-5 h-5 animate-spin\" style={{ color: '#EF9F27' }} />
                    <span className=\"font-medium\" style={{ color: '#EF9F27' }}>Pending...</span>
                  </>
                )}
                {result.status === 'success' && (
                  <>
                    <Check className=\"w-5 h-5\" style={{ color: 'var(--brand-emerald)' }} />
                    <span className=\"font-medium\" style={{ color: 'var(--brand-emerald)' }}>Payment Successful!</span>
                  </>
                )}
                {result.status === 'failed' && (
                  <>
                    <X className=\"w-5 h-5\" style={{ color: '#E24B4A' }} />
                    <span className=\"font-medium\" style={{ color: '#E24B4A' }}>Payment Failed</span>
                  </>
                )}
              </div>

              {/* Payment Details */}
              <div className=\"rounded-lg border p-4 space-y-3\" style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--bg-border-subtle)'
              }}>
                <div className=\"flex justify-between text-sm\">
                  <span style={{ color: 'var(--text-muted)' }}>Payment ID:</span>
                  <code className=\"text-xs\" style={{ color: 'var(--text-primary)' }}>{result.paymentId}</code>
                </div>
                <div className=\"flex justify-between text-sm\">
                  <span style={{ color: 'var(--text-muted)' }}>Reference:</span>
                  <code className=\"text-xs\" style={{ color: 'var(--text-primary)' }}>{result.reference}</code>
                </div>
                {result.transactionId && (
                  <div className=\"flex justify-between text-sm\">
                    <span style={{ color: 'var(--text-muted)' }}>ClickPesa TX ID:</span>
                    <code className=\"text-xs\" style={{ color: 'var(--text-primary)' }}>{result.transactionId}</code>
                  </div>
                )}
                <div className=\"flex justify-between text-sm\">
                  <span style={{ color: 'var(--text-muted)' }}>Amount:</span>
                  <span style={{ color: 'var(--text-primary)' }}>TZS {result.amount?.toLocaleString()}</span>
                </div>
                <div className=\"flex justify-between text-sm\">
                  <span style={{ color: 'var(--text-muted)' }}>Fee:</span>
                  <span style={{ color: 'var(--text-muted)' }}>TZS {result.fee?.toLocaleString()}</span>
                </div>
                <div className=\"flex justify-between text-sm font-medium pt-2 border-t\" style={{ borderColor: 'var(--bg-border-subtle)' }}>
                  <span style={{ color: 'var(--text-primary)' }}>Total:</span>
                  <span style={{ color: 'var(--brand-emerald)' }}>TZS {result.totalAmount?.toLocaleString()}</span>
                </div>
              </div>

              {/* Message */}
              {result.message && (
                <div className=\"text-sm p-3 rounded\" style={{
                  backgroundColor: 'rgba(0, 217, 126, 0.1)',
                  color: 'var(--text-muted)'
                }}>
                  {result.message}
                </div>
              )}

              {result.status === 'pending' && (
                <div className=\"text-xs\" style={{ color: 'var(--text-faint)' }}>
                  Waiting for customer to complete payment on their phone...
                </div>
              )}
            </div>
          )}

          {!result && !error && (
            <div className=\"text-center py-8\" style={{ color: 'var(--text-faint)' }}>
              <CreditCard className=\"w-12 h-12 mx-auto mb-3\" style={{ opacity: 0.3 }} />
              <div className=\"text-sm\">No payment initiated yet</div>
            </div>
          )}
        </div>
      </div>

      {/* Documentation */}
      <div className=\"rounded-lg border p-6\" style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--bg-border-subtle)'
      }}>
        <h3 className=\"font-semibold mb-3\" style={{ color: 'var(--text-primary)' }}>
          API Endpoints
        </h3>
        <div className=\"space-y-2 text-sm font-mono\" style={{ color: 'var(--text-muted)' }}>
          <div>
            <span style={{ color: 'var(--brand-emerald)' }}>POST</span> /payments/clickpesa/initiate
          </div>
          <div>
            <span style={{ color: 'var(--status-info)' }}>GET</span> /payments/clickpesa/status/:paymentId
          </div>
          <div>
            <span style={{ color: 'var(--status-info)' }}>GET</span> /payments/providers
          </div>
          <div>
            <span style={{ color: 'var(--brand-emerald)' }}>POST</span> /webhooks/clickpesa/callback
          </div>
        </div>
        <div className=\"mt-4 text-xs\" style={{ color: 'var(--text-faint)' }}>
          Full documentation: <a href=\"/CLICKPESA_INTEGRATION.md\" target=\"_blank\" rel=\"noopener noreferrer\" style={{ color: 'var(--brand-emerald)' }}>CLICKPESA_INTEGRATION.md</a>
        </div>
      </div>
    </div>
  );
}
