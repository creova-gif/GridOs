// ============================================================
// components/modals/TopUpModal.jsx
// Full in-dashboard token purchase flow
// ============================================================
import { useState } from 'react';
import axios from 'axios';

export function TopUpModal({ customer, onClose, onSuccess }) {
  const [amount, setAmount]   = useState('');
  const [method, setMethod]   = useState('mpesa');
  const [loading, setLoading] = useState(false);
  const [token, setToken]     = useState(null);
  const [error, setError]     = useState('');

  const PRESETS = [1000, 2000, 5000, 10000, 20000];
  const tariff  = customer?.customer_type === 'business' ? 1560
                : customer?.customer_type === 'productive' ? 1310 : 1710;
  const kwh     = amount ? (parseFloat(amount) / tariff).toFixed(2) : '0';

  const submit = async () => {
    if (!amount || parseFloat(amount) < 500) { setError('Minimum TZS 500'); return; }
    setLoading(true); setError('');
    try {
      const r = await axios.post(`/api/customers/${customer.id}/topup`, {
        amount_tzs: parseFloat(amount), payment_method: method,
      });
      setToken(r.data.token);
      onSuccess?.();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to generate token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'400px', background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'var(--color-background-primary)', borderRadius:'var(--border-radius-lg)', border:'0.5px solid var(--color-border-tertiary)', width:'100%', maxWidth:'420px', padding:'1.5rem' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
          <div>
            <div style={{ fontSize:'15px', fontWeight:500, color:'var(--color-text-primary)' }}>Top up — {customer?.full_name}</div>
            <div style={{ fontSize:'12px', color:'var(--color-text-tertiary)', marginTop:'2px' }}>
              {customer?.meters?.meter_ref} · Balance: TZS {(customer?.balance_tzs||0).toLocaleString()}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'transparent', border:'none', cursor:'pointer', fontSize:'18px', color:'var(--color-text-tertiary)', padding:'0 4px' }}>×</button>
        </div>

        {token ? (
          /* Token display */
          <div>
            <div style={{ background:'var(--color-background-success)', borderRadius:'var(--border-radius-md)', padding:'1rem', textAlign:'center', marginBottom:'1rem' }}>
              <div style={{ fontSize:'12px', color:'var(--color-text-success)', marginBottom:'8px', fontWeight:500 }}>Token generated successfully</div>
              <div style={{ fontSize:'22px', fontWeight:500, color:'var(--color-text-primary)', letterSpacing:'.1em', fontFamily:'var(--font-mono)' }}>{token}</div>
              <div style={{ fontSize:'11px', color:'var(--color-text-tertiary)', marginTop:'8px' }}>Sent via SMS · Enter on meter keypad</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'1rem', fontSize:'12px' }}>
              <div style={{ background:'var(--color-background-secondary)', borderRadius:'var(--border-radius-md)', padding:'10px' }}>
                <div style={{ color:'var(--color-text-tertiary)', marginBottom:'3px' }}>Amount paid</div>
                <div style={{ fontWeight:500 }}>TZS {parseFloat(amount).toLocaleString()}</div>
              </div>
              <div style={{ background:'var(--color-background-secondary)', borderRadius:'var(--border-radius-md)', padding:'10px' }}>
                <div style={{ color:'var(--color-text-tertiary)', marginBottom:'3px' }}>Energy credit</div>
                <div style={{ fontWeight:500 }}>{kwh} kWh</div>
              </div>
            </div>
            <button onClick={onClose} style={{ width:'100%', padding:'10px', borderRadius:'var(--border-radius-md)', border:'0.5px solid var(--color-border-secondary)', cursor:'pointer', background:'transparent', fontSize:'13px', color:'var(--color-text-primary)' }}>Done</button>
          </div>
        ) : (
          /* Purchase form */
          <div>
            {/* Preset amounts */}
            <div style={{ fontSize:'11px', color:'var(--color-text-tertiary)', marginBottom:'6px' }}>Quick amounts</div>
            <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'1rem' }}>
              {PRESETS.map(p => (
                <button key={p} onClick={() => setAmount(String(p))}
                  style={{ padding:'5px 12px', borderRadius:'20px', border:`0.5px solid ${amount===String(p)?'var(--color-border-info)':'var(--color-border-secondary)'}`, cursor:'pointer', fontSize:'12px', background: amount===String(p)?'var(--color-background-info)':'transparent', color: amount===String(p)?'var(--color-text-info)':'var(--color-text-secondary)' }}>
                  {p.toLocaleString()}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div style={{ marginBottom:'1rem' }}>
              <label style={{ fontSize:'11px', color:'var(--color-text-tertiary)', display:'block', marginBottom:'5px' }}>Amount (TZS)</label>
              <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Enter amount..." style={{ width:'100%', fontSize:'15px' }}/>
              {amount && parseFloat(amount) >= 500 && (
                <div style={{ fontSize:'11px', color:'var(--color-text-success)', marginTop:'5px' }}>
                  = {kwh} kWh · tariff TZS {tariff}/kWh
                </div>
              )}
            </div>

            {/* Payment method */}
            <div style={{ marginBottom:'1.25rem' }}>
              <label style={{ fontSize:'11px', color:'var(--color-text-tertiary)', display:'block', marginBottom:'6px' }}>Payment method</label>
              <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                {['mpesa','airtel','tigocash','cash'].map(m => (
                  <button key={m} onClick={()=>setMethod(m)}
                    style={{ padding:'6px 14px', borderRadius:'20px', border:`0.5px solid ${method===m?'var(--color-border-info)':'var(--color-border-secondary)'}`, cursor:'pointer', fontSize:'12px', background:method===m?'var(--color-background-info)':'transparent', color:method===m?'var(--color-text-info)':'var(--color-text-secondary)', textTransform:'capitalize' }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {error && <div style={{ color:'var(--color-text-danger)', fontSize:'12px', marginBottom:'10px' }}>{error}</div>}

            <button onClick={submit} disabled={loading || !amount}
              style={{ width:'100%', padding:'11px', borderRadius:'var(--border-radius-md)', border:'none', cursor: loading||!amount?'not-allowed':'pointer', background:'var(--color-background-info)', color:'var(--color-text-info)', fontSize:'14px', fontWeight:500, opacity: loading||!amount?0.6:1 }}>
              {loading ? 'Generating...' : `Issue token — TZS ${parseFloat(amount||0).toLocaleString()}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


// ============================================================
// components/modals/AlertModal.jsx
// Alert detail + resolution workflow
// ============================================================
import { useState as useS2 } from 'react';
import axios from 'axios';

export function AlertModal({ alert, onClose, onResolved }) {
  const [notes, setNotes]     = useS2('');
  const [loading, setLoading] = useS2(false);

  const resolve = async () => {
    setLoading(true);
    await axios.patch(`/api/alerts/${alert.id}/resolve`, {
      notes, agent_id: 'agent-001',
    });
    setLoading(false);
    onResolved?.();
    onClose();
  };

  const SEVERITY_COLOR = {
    critical: 'var(--color-text-danger)',
    high:     'var(--color-text-warning)',
    medium:   'var(--color-text-warning)',
    low:      'var(--color-text-tertiary)',
  };

  return (
    <div style={{ minHeight:'360px', background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'var(--color-background-primary)', borderRadius:'var(--border-radius-lg)', border:'0.5px solid var(--color-border-tertiary)', width:'100%', maxWidth:'400px', padding:'1.5rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1rem' }}>
          <div>
            <span style={{ fontSize:'10px', fontWeight:500, color:SEVERITY_COLOR[alert?.severity], textTransform:'uppercase', letterSpacing:'.05em' }}>{alert?.severity}</span>
            <div style={{ fontSize:'15px', fontWeight:500, color:'var(--color-text-primary)', marginTop:'3px' }}>{alert?.alert_type?.replace('_',' ')}</div>
          </div>
          <button onClick={onClose} style={{ background:'transparent', border:'none', cursor:'pointer', fontSize:'18px', color:'var(--color-text-tertiary)' }}>×</button>
        </div>

        <div style={{ background:'var(--color-background-secondary)', borderRadius:'var(--border-radius-md)', padding:'10px 12px', marginBottom:'1rem', fontSize:'13px', color:'var(--color-text-secondary)' }}>
          {alert?.message}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'1rem', fontSize:'12px' }}>
          <div><span style={{ color:'var(--color-text-tertiary)' }}>Meter: </span>{alert?.meters?.meter_ref || '—'}</div>
          <div><span style={{ color:'var(--color-text-tertiary)' }}>Customer: </span>{alert?.customers?.full_name || '—'}</div>
          <div><span style={{ color:'var(--color-text-tertiary)' }}>Occurred: </span>{alert?.occurred_at ? new Date(alert.occurred_at).toLocaleString() : '—'}</div>
          <div><span style={{ color:'var(--color-text-tertiary)' }}>Site: </span>Ukerewe Island</div>
        </div>

        <div style={{ marginBottom:'1rem' }}>
          <label style={{ fontSize:'11px', color:'var(--color-text-tertiary)', display:'block', marginBottom:'5px' }}>Resolution notes</label>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)}
            placeholder="Describe what action was taken..." rows={3}
            style={{ width:'100%', fontSize:'13px', padding:'8px', borderRadius:'var(--border-radius-md)', border:'0.5px solid var(--color-border-secondary)', background:'var(--color-background-secondary)', color:'var(--color-text-primary)', resize:'none' }}/>
        </div>

        <div style={{ display:'flex', gap:'8px' }}>
          <button onClick={onClose} style={{ flex:1, padding:'9px', borderRadius:'var(--border-radius-md)', border:'0.5px solid var(--color-border-secondary)', cursor:'pointer', background:'transparent', fontSize:'13px', color:'var(--color-text-secondary)' }}>
            Cancel
          </button>
          <button onClick={resolve} disabled={loading}
            style={{ flex:2, padding:'9px', borderRadius:'var(--border-radius-md)', border:'none', cursor:loading?'not-allowed':'pointer', background:'var(--color-background-success)', color:'var(--color-text-success)', fontSize:'13px', fontWeight:500, opacity:loading?0.7:1 }}>
            {loading ? 'Resolving...' : 'Mark resolved'}
          </button>
        </div>
      </div>
    </div>
  );
}


// ============================================================
// components/widgets/OnboardingChecklist.jsx
// ============================================================
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export function OnboardingChecklist({ operatorId }) {
  const { data } = useQuery({
    queryKey: ['checklist', operatorId],
    queryFn: () => axios.get(`/api/onboarding/checklist/${operatorId}`).then(r=>r.data),
  });

  if (!data || data.progress_pct >= 100) return null;

  return (
    <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-info)', borderRadius:'var(--border-radius-lg)', padding:'14px 16px', marginBottom:'1.5rem' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
        <div style={{ fontSize:'13px', fontWeight:500 }}>Setup progress</div>
        <div style={{ fontSize:'12px', color:'var(--color-text-info)', fontWeight:500 }}>{data.progress_pct}% complete</div>
      </div>
      <div style={{ height:'4px', background:'var(--color-background-secondary)', borderRadius:'2px', marginBottom:'12px' }}>
        <div style={{ height:'4px', background:'var(--color-text-info)', borderRadius:'2px', width:`${data.progress_pct}%`, transition:'width .4s' }}/>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
        {(data.steps||[]).map(step => (
          <div key={step.id} style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'12px' }}>
            <span style={{ width:'16px', height:'16px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:step.done?'var(--color-background-success)':'var(--color-background-secondary)', border:`0.5px solid ${step.done?'var(--color-border-success)':'var(--color-border-secondary)'}` }}>
              {step.done && <span style={{ fontSize:'8px', color:'var(--color-text-success)' }}>✓</span>}
            </span>
            <span style={{ color:step.done?'var(--color-text-secondary)':'var(--color-text-primary)', flex:1, textDecoration:step.done?'line-through':'' }}>{step.label}</span>
            {!step.done && step.link && (
              <a href={step.link} target="_blank" rel="noreferrer" style={{ fontSize:'10px', color:'var(--color-text-info)' }}>Start →</a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
