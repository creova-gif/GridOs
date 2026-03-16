// ============================================================
// pages/Portfolio.jsx — Multi-site portfolio view
// ============================================================
import { useQuery }       from '@tanstack/react-query';
import { useState }       from 'react';
import axios              from 'axios';

const OP_ID = '00000000-0000-0000-0000-000000000001';

function HealthRing({ score }) {
  const color = score >= 85 ? '#10b981' : score >= 65 ? '#f59e0b' : '#ef4444';
  const r = 22, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r={r} fill="none" stroke="#1e293b" strokeWidth="4"/>
      <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 28 28)"/>
      <text x="28" y="33" textAnchor="middle" fontSize="13" fontWeight="600" fill={color}>{score}</text>
    </svg>
  );
}

export function PortfolioPage() {
  const [sort, setSort] = useState('health');
  const { data, isLoading } = useQuery({
    queryKey: ['portfolio', OP_ID],
    queryFn: () => axios.get(`/api/portfolio/${OP_ID}`).then(r => r.data),
    refetchInterval: 30000,
  });

  const sites = [...(data?.sites || [])].sort((a, b) => {
    if (sort === 'health')   return b.health_score - a.health_score;
    if (sort === 'revenue')  return b.monthly_revenue_usd - a.monthly_revenue_usd;
    if (sort === 'alerts')   return b.unresolved_alerts - a.unresolved_alerts;
    return a.site_name < b.site_name ? -1 : 1;
  });

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:500 }}>Portfolio</h1>
          <p style={{ fontSize:'13px', color:'var(--color-text-secondary)', marginTop:'4px' }}>
            {data?.totals?.sites || 0} sites · {data?.totals?.total_customers || 0} active customers · ${(data?.totals?.total_revenue_usd_mo||0).toLocaleString()}/mo
          </p>
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)}
          style={{ fontSize:'13px', padding:'6px 10px' }}>
          <option value="health">Sort: health score</option>
          <option value="revenue">Sort: revenue</option>
          <option value="alerts">Sort: alerts</option>
          <option value="name">Sort: name</option>
        </select>
      </div>

      {/* Summary KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:'10px', marginBottom:'1.5rem' }}>
        {[
          { label:'Total sites',      value: data?.totals?.sites || 0,            color:'var(--color-text-primary)' },
          { label:'Active customers', value: data?.totals?.total_customers || 0,  color:'var(--color-text-success)' },
          { label:'Monthly revenue',  value: `$${(data?.totals?.total_revenue_usd_mo||0).toLocaleString()}`, color:'var(--color-text-success)' },
          { label:'Open alerts',      value: data?.totals?.total_alerts || 0,     color: data?.totals?.total_alerts > 0 ? 'var(--color-text-danger)' : 'var(--color-text-success)' },
        ].map(k => (
          <div key={k.label} style={{ background:'var(--color-background-secondary)', borderRadius:'var(--border-radius-md)', padding:'12px 14px' }}>
            <div style={{ fontSize:'11px', color:'var(--color-text-tertiary)', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'.05em' }}>{k.label}</div>
            <div style={{ fontSize:'22px', fontWeight:500, color:k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Sites table */}
      <div style={{ border:'0.5px solid var(--color-border-tertiary)', borderRadius:'var(--border-radius-lg)', overflow:'hidden' }}>
        <table style={{ width:'100%', fontSize:'12px', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:'0.5px solid var(--color-border-tertiary)', background:'var(--color-background-secondary)' }}>
              {['Site','Health','Meters','Customers','Revenue/mo','Alerts','Status'].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'8px 12px', fontSize:'10px', color:'var(--color-text-tertiary)', fontWeight:500, textTransform:'uppercase', letterSpacing:'.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ padding:'2rem', textAlign:'center', color:'var(--color-text-tertiary)' }}>Loading portfolio...</td></tr>
            ) : sites.map(site => (
              <tr key={site.id} style={{ borderBottom:'0.5px solid var(--color-border-tertiary)', cursor:'pointer' }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--color-background-secondary)'}
                onMouseLeave={e=>e.currentTarget.style.background=''}>
                <td style={{ padding:'10px 12px', fontWeight:500, color:'var(--color-text-primary)' }}>
                  <div>{site.name}</div>
                  <div style={{ fontSize:'11px', color:'var(--color-text-tertiary)', marginTop:'2px' }}>{site.region} · {site.capacity_kw}kW</div>
                </td>
                <td style={{ padding:'10px 12px' }}><HealthRing score={site.health_score || 0}/></td>
                <td style={{ padding:'10px 12px', color:'var(--color-text-secondary)' }}>{site.meters_total}</td>
                <td style={{ padding:'10px 12px', color:'var(--color-text-secondary)' }}>{site.active_customers}</td>
                <td style={{ padding:'10px 12px', color:'var(--color-text-success)', fontWeight:500 }}>
                  TZS {(site.monthly_revenue_tzs||0).toLocaleString()}
                </td>
                <td style={{ padding:'10px 12px' }}>
                  {site.unresolved_alerts > 0
                    ? <span style={{ background:'var(--color-background-danger)', color:'var(--color-text-danger)', padding:'2px 8px', borderRadius:'20px', fontSize:'10px', fontWeight:500 }}>{site.unresolved_alerts}</span>
                    : <span style={{ color:'var(--color-text-tertiary)', fontSize:'11px' }}>—</span>}
                </td>
                <td style={{ padding:'10px 12px' }}>
                  <span style={{ background:'var(--color-background-success)', color:'var(--color-text-success)', padding:'2px 8px', borderRadius:'20px', fontSize:'10px', fontWeight:500 }}>
                    {site.health_status || 'active'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// ============================================================
// pages/FintechPage.jsx — RBF + Carbon + Blended Finance
// ============================================================
import { useQuery as useQ2, useQuery as useQ3 } from '@tanstack/react-query';

const SITE_ID = '00000000-0000-0000-0000-000000000010';

export function FintechPage() {
  const { data: rbf }    = useQ2({ queryKey:['rbf'], queryFn: () => axios.get(`/api/fintech/rbf/${SITE_ID}`).then(r=>r.data) });
  const { data: carbon } = useQ3({ queryKey:['carbon'], queryFn: () => axios.get(`/api/fintech/carbon/${SITE_ID}`).then(r=>r.data) });
  const { data: mfi }    = useQ3({ queryKey:['mfi'], queryFn: () => axios.get(`/api/fintech/mfi/${SITE_ID}`).then(r=>r.data) });

  return (
    <div style={{ padding:'2rem' }}>
      <h1 style={{ fontSize:'22px', fontWeight:500, marginBottom:'4px' }}>Fintech</h1>
      <p style={{ fontSize:'13px', color:'var(--color-text-secondary)', marginBottom:'1.5rem' }}>RBF grants · Carbon revenue · MFI lending · Blended finance</p>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>

        {/* RBF Milestone Tracker */}
        <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:'var(--border-radius-lg)', padding:'16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
            <div style={{ fontSize:'13px', fontWeight:500 }}>RBF milestone tracker</div>
            <span style={{ background:rbf?.eligible?'var(--color-background-success)':'var(--color-background-warning)', color:rbf?.eligible?'var(--color-text-success)':'var(--color-text-warning)', fontSize:'10px', padding:'2px 8px', borderRadius:'20px', fontWeight:500 }}>
              {rbf?.eligible ? 'Eligible' : 'In progress'}
            </span>
          </div>
          <div style={{ fontSize:'28px', fontWeight:500, color:'var(--color-text-success)', marginBottom:'4px' }}>
            ${(rbf?.estimated_grant_usd||0).toLocaleString()}
          </div>
          <div style={{ fontSize:'12px', color:'var(--color-text-tertiary)', marginBottom:'14px' }}>estimated grant · REA Tanzania</div>
          {(rbf?.milestones||[]).map(m => (
            <div key={m.label} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px', fontSize:'12px' }}>
              <span style={{ width:'14px', height:'14px', borderRadius:'50%', background:m.met?'var(--color-text-success)':'var(--color-border-secondary)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {m.met && <span style={{ fontSize:'8px', color:'white' }}>✓</span>}
              </span>
              <span style={{ color: m.met ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)', flex:1 }}>{m.label}</span>
              <span style={{ color:'var(--color-text-tertiary)', fontSize:'11px' }}>
                {m.current}{m.unit || ''}/{m.target}{m.unit || ''}
              </span>
            </div>
          ))}
          {rbf?.gaps?.connections_needed > 0 && (
            <div style={{ marginTop:'10px', padding:'8px 10px', background:'var(--color-background-warning)', borderRadius:'var(--border-radius-md)', fontSize:'11px', color:'var(--color-text-warning)' }}>
              Need {rbf.gaps.connections_needed} more connections · next submission {rbf?.next_submission}
            </div>
          )}
        </div>

        {/* Carbon Revenue Tracker */}
        <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:'var(--border-radius-lg)', padding:'16px' }}>
          <div style={{ fontSize:'13px', fontWeight:500, marginBottom:'12px' }}>Carbon revenue — year to date</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'14px' }}>
            {[
              { label:'OTC Africa', rate:'$3/t', usd: carbon?.revenue?.otc_usd },
              { label:'Gold Standard', rate:'$13/t', usd: carbon?.revenue?.gold_standard_usd },
              { label:'Compliance', rate:'$25/t', usd: carbon?.revenue?.compliance_usd },
            ].map(t => (
              <div key={t.label} style={{ background:'var(--color-background-secondary)', borderRadius:'var(--border-radius-md)', padding:'10px' }}>
                <div style={{ fontSize:'10px', color:'var(--color-text-tertiary)', marginBottom:'4px' }}>{t.label}</div>
                <div style={{ fontSize:'16px', fontWeight:500, color:'var(--color-text-success)' }}>${(t.usd||0).toFixed(0)}</div>
                <div style={{ fontSize:'10px', color:'var(--color-text-tertiary)' }}>{t.rate}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:'12px', color:'var(--color-text-secondary)', marginBottom:'6px' }}>
            {(carbon?.tco2e_avoided||0).toFixed(2)} tCO2e avoided · {(carbon?.kwh_generated||0).toFixed(0)} kWh generated
          </div>
          <div style={{ fontSize:'11px', color:'var(--color-text-tertiary)' }}>
            Projected annual (Gold Standard): ${(carbon?.projected_annual?.gold_standard_usd||0).toFixed(0)}
          </div>
          <div style={{ marginTop:'10px', padding:'8px 10px', background:'var(--color-background-secondary)', borderRadius:'var(--border-radius-md)', fontSize:'11px', color:'var(--color-text-tertiary)' }}>
            Registry status: {carbon?.registry_status?.replace('_',' ')} · Apply at verra.org
          </div>
        </div>

        {/* MFI Portfolio */}
        <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:'var(--border-radius-lg)', padding:'16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
            <div style={{ fontSize:'13px', fontWeight:500 }}>MFI lending portfolio</div>
            <button style={{ fontSize:'11px', padding:'4px 10px', borderRadius:'var(--border-radius-md)', border:'0.5px solid var(--color-border-secondary)', cursor:'pointer', background:'transparent', color:'var(--color-text-primary)' }}
              onClick={() => window.open(`/api/fintech/mfi/export/${SITE_ID}`)}>
              Export ↓
            </button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'6px', marginBottom:'12px' }}>
            {[
              { label:'Excellent', count:mfi?.portfolio?.excellent, color:'var(--color-text-success)' },
              { label:'Good', count:mfi?.portfolio?.good, color:'var(--color-text-info)' },
              { label:'Fair', count:mfi?.portfolio?.fair, color:'var(--color-text-warning)' },
              { label:'Poor', count:mfi?.portfolio?.poor, color:'var(--color-text-danger)' },
            ].map(t => (
              <div key={t.label} style={{ background:'var(--color-background-secondary)', borderRadius:'var(--border-radius-md)', padding:'8px', textAlign:'center' }}>
                <div style={{ fontSize:'18px', fontWeight:500, color:t.color }}>{t.count||0}</div>
                <div style={{ fontSize:'10px', color:'var(--color-text-tertiary)', marginTop:'2px' }}>{t.label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:'12px', color:'var(--color-text-secondary)', marginBottom:'4px' }}>
            Avg score: {mfi?.portfolio?.avg_score || 0}/100 · Total recommended limit: TZS {(mfi?.portfolio?.total_recommended_limit_tzs||0).toLocaleString()}
          </div>
          <div style={{ fontSize:'11px', color:'var(--color-text-tertiary)' }}>
            Compatible: Jumo, Branch, FINCA Tanzania
          </div>
        </div>

        {/* Blended Finance Calculator */}
        <BlendedFinanceCalculator />
      </div>
    </div>
  );
}

function BlendedFinanceCalculator() {
  const [capacity, setCapacity] = useState(50);
  const [connections, setConnections] = useState(300);
  const [result, setResult] = useState(null);

  const calculate = async () => {
    const r = await axios.post('/api/fintech/blended-finance', {
      capacity_kw: capacity, expected_connections: connections, country: 'TZ', has_lois: true
    });
    setResult(r.data);
  };

  return (
    <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:'var(--border-radius-lg)', padding:'16px' }}>
      <div style={{ fontSize:'13px', fontWeight:500, marginBottom:'12px' }}>Blended finance builder</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'12px' }}>
        <div>
          <label style={{ fontSize:'11px', color:'var(--color-text-tertiary)', display:'block', marginBottom:'4px' }}>Capacity (kW)</label>
          <input type="number" value={capacity} onChange={e=>setCapacity(+e.target.value)} style={{ width:'100%', fontSize:'13px' }}/>
        </div>
        <div>
          <label style={{ fontSize:'11px', color:'var(--color-text-tertiary)', display:'block', marginBottom:'4px' }}>Expected connections</label>
          <input type="number" value={connections} onChange={e=>setConnections(+e.target.value)} style={{ width:'100%', fontSize:'13px' }}/>
        </div>
      </div>
      <button onClick={calculate} style={{ width:'100%', padding:'8px', fontSize:'13px', background:'var(--color-background-info)', color:'var(--color-text-info)', border:'0.5px solid var(--color-border-info)', borderRadius:'var(--border-radius-md)', cursor:'pointer', marginBottom:'12px' }}>
        Calculate financing structure
      </button>
      {result && (
        <div style={{ fontSize:'12px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
            <span style={{ color:'var(--color-text-tertiary)' }}>Total CAPEX</span>
            <span style={{ fontWeight:500 }}>${(result.capex.total_usd||0).toLocaleString()}</span>
          </div>
          {Object.entries(result.financing_structure).map(([k,v]) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
              <span style={{ color:'var(--color-text-secondary)' }}>{k.replace('_',' ')}</span>
              <span style={{ color: k==='rbf_grant'?'var(--color-text-success)':'var(--color-text-secondary)' }}>
                ${(v.amount_usd||0).toLocaleString()} ({v.share_pct}%)
              </span>
            </div>
          ))}
          <div style={{ marginTop:'8px', paddingTop:'8px', borderTop:'0.5px solid var(--color-border-tertiary)', display:'flex', justifyContent:'space-between' }}>
            <span style={{ color:'var(--color-text-tertiary)' }}>DSCR · Bankable</span>
            <span style={{ color: result.financial_metrics.bankable ? 'var(--color-text-success)':'var(--color-text-danger)', fontWeight:500 }}>
              {result.financial_metrics.dscr}x · {result.financial_metrics.bankable ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}


// ============================================================
// pages/OperationsPage.jsx — Anomaly + Maintenance + Regulatory + SDG7
// ============================================================
export function OperationsPage() {
  const { data: anomalies }   = useQ2({ queryKey:['anomalies'], queryFn:()=>axios.get(`/api/operations/anomalies/${SITE_ID}`).then(r=>r.data), refetchInterval:15000 });
  const { data: agriculture } = useQ2({ queryKey:['agri'], queryFn:()=>axios.get(`/api/operations/agriculture/${SITE_ID}`).then(r=>r.data) });
  const { data: maintenance } = useQ2({ queryKey:['maintenance'], queryFn:()=>axios.get(`/api/operations/maintenance/${SITE_ID}`).then(r=>r.data) });
  const { data: regulatory }  = useQ2({ queryKey:['regulatory'], queryFn:()=>axios.get(`/api/operations/regulatory/${OP_ID}`).then(r=>r.data) });
  const { data: impact }      = useQ2({ queryKey:['impact'], queryFn:()=>axios.get(`/api/operations/impact/${OP_ID}`).then(r=>r.data) });

  return (
    <div style={{ padding:'2rem' }}>
      <h1 style={{ fontSize:'22px', fontWeight:500, marginBottom:'4px' }}>Operations</h1>
      <p style={{ fontSize:'13px', color:'var(--color-text-secondary)', marginBottom:'1.5rem' }}>Anomaly detection · Maintenance · Regulatory · SDG7 impact</p>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>

        {/* Anomaly Feed */}
        <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:'var(--border-radius-lg)', padding:'16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
            <div style={{ fontSize:'13px', fontWeight:500 }}>Anomaly feed — live</div>
            {anomalies?.critical > 0 && (
              <span style={{ background:'var(--color-background-danger)', color:'var(--color-text-danger)', fontSize:'10px', padding:'2px 8px', borderRadius:'20px', fontWeight:500 }}>
                {anomalies.critical} critical
              </span>
            )}
          </div>
          {(anomalies?.anomalies||[]).slice(0,5).map((a,i) => (
            <div key={i} style={{ display:'flex', gap:'8px', padding:'8px 0', borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:'12px' }}>
              <span style={{ width:'6px', height:'6px', borderRadius:'50%', marginTop:'4px', flexShrink:0, background: a.severity==='critical'?'#ef4444':a.severity==='high'?'#f97316':'#eab308' }}/>
              <div style={{ flex:1 }}>
                <div style={{ color:'var(--color-text-primary)', marginBottom:'2px' }}>{a.message}</div>
                <div style={{ color:'var(--color-text-tertiary)', fontSize:'11px' }}>{a.action}</div>
              </div>
              <div style={{ color:'var(--color-text-tertiary)', fontSize:'10px', whiteSpace:'nowrap' }}>
                {Math.round(a.probability*100)}%
              </div>
            </div>
          ))}
          {!anomalies?.anomalies?.length && <div style={{ color:'var(--color-text-tertiary)', fontSize:'12px', padding:'1rem 0' }}>No anomalies detected — all systems normal</div>}
        </div>

        {/* Agricultural Season Intelligence */}
        <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:'var(--border-radius-lg)', padding:'16px' }}>
          <div style={{ fontSize:'13px', fontWeight:500, marginBottom:'10px' }}>Agricultural season intelligence</div>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
            <div style={{ fontSize:'28px', fontWeight:500, color: (agriculture?.demand_index||1)>=1.1?'var(--color-text-warning)':'var(--color-text-success)' }}>
              {agriculture?.demand_vs_baseline || '+0%'}
            </div>
            <div>
              <div style={{ fontSize:'13px', color:'var(--color-text-primary)' }}>{agriculture?.current_season?.season?.replace('_',' ')}</div>
              <div style={{ fontSize:'11px', color:'var(--color-text-tertiary)' }}>{agriculture?.crop_activity}</div>
            </div>
          </div>
          <div style={{ fontSize:'12px', color:'var(--color-background-secondary)', background:'var(--color-background-secondary)', padding:'8px 10px', borderRadius:'var(--border-radius-md)', marginBottom:'10px', color:'var(--color-text-secondary)' }}>
            {agriculture?.battery_recommendation}
          </div>
          {(agriculture?.upcoming_alerts||[]).map((a,i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', padding:'4px 0', borderBottom:'0.5px solid var(--color-border-tertiary)', color:'var(--color-text-secondary)' }}>
              <span>{a.month} — {a.season?.replace('_',' ')}</span>
              <span style={{ color:'var(--color-text-warning)', fontWeight:500 }}>{a.demand_change_pct>=0?'+':''}{a.demand_change_pct}% demand</span>
            </div>
          ))}
        </div>

        {/* Maintenance Schedule */}
        <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:'var(--border-radius-lg)', padding:'16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px' }}>
            <div style={{ fontSize:'13px', fontWeight:500 }}>Maintenance schedule</div>
            <div style={{ fontSize:'11px', color:'var(--color-text-tertiary)' }}>
              {maintenance?.urgent||0} urgent · {maintenance?.scheduled||0} scheduled
            </div>
          </div>
          {(maintenance?.tasks||[]).slice(0,5).map((t,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'7px 0', borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:'12px' }}>
              <span style={{ width:'8px', height:'8px', borderRadius:'50%', flexShrink:0, background: t.priority_label==='urgent'?'#ef4444':t.priority_label==='scheduled'?'#f59e0b':'#10b981' }}/>
              <div style={{ flex:1 }}>
                <div style={{ color:'var(--color-text-primary)' }}>{t.meter_ref} — {t.task_type?.replace('_',' ')}</div>
                <div style={{ color:'var(--color-text-tertiary)', fontSize:'11px' }}>{t.reasons?.join(', ')}</div>
              </div>
              <div style={{ color:'var(--color-text-tertiary)', fontSize:'11px' }}>Due {t.due_date}</div>
            </div>
          ))}
        </div>

        {/* SDG7 Impact */}
        <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:'var(--border-radius-lg)', padding:'16px' }}>
          <div style={{ fontSize:'13px', fontWeight:500, marginBottom:'10px' }}>SDG7 impact</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
            {[
              { label:'People reached',     value: (impact?.impact?.people_reached||0).toLocaleString(), unit:'' },
              { label:'CO2 avoided',        value: (impact?.impact?.co2_avoided_tons||0).toFixed(1),      unit:'t' },
              { label:'Energy delivered',   value: (impact?.impact?.total_kwh_delivered||0).toFixed(0),   unit:' kWh' },
              { label:'Health clinic kWh',  value: (impact?.impact?.health_facility_kwh||0).toFixed(0),   unit:' kWh' },
              { label:'School kWh',         value: (impact?.impact?.school_kwh||0).toFixed(0),            unit:' kWh' },
              { label:'SE4All tier',        value: `Tier ${impact?.se4all_tier?.current||1}`,              unit:'' },
            ].map(m => (
              <div key={m.label} style={{ background:'var(--color-background-secondary)', borderRadius:'var(--border-radius-md)', padding:'8px' }}>
                <div style={{ fontSize:'10px', color:'var(--color-text-tertiary)', marginBottom:'3px' }}>{m.label}</div>
                <div style={{ fontSize:'16px', fontWeight:500, color:'var(--color-text-success)' }}>{m.value}{m.unit}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
