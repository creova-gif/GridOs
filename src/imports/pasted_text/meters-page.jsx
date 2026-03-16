// ============================================================
// MetersPage.jsx
// ============================================================
import { useLive } from '../App.jsx';
import { Card, Badge, Table, SectionHeader } from '../components/ui.jsx';

export default function MetersPage() {
  const { meters } = useLive();
  const rows = Object.values(meters);

  const cols = [
    { key:'meter_id', label:'Meter', w:'90px', render: v => <span style={{ fontFamily:'var(--font-mono)', fontSize:'12px', fontWeight:600, color:'var(--text-1)' }}>{v}</span> },
    { key:'connected', label:'Status', w:'100px',
      render:(v, row) => {
        if (!v || (row.balance_tzs||0) <= 0) return <Badge variant="danger">Disconnected</Badge>;
        if (row.tamper) return <Badge variant="warning">Tamper</Badge>;
        return <Badge variant="success">Active</Badge>;
      }
    },
    { key:'power_w', label:'Power', render: (v, row) => (
      <span style={{ fontFamily:'var(--font-mono)', color: row.connected ? 'var(--text-1)' : 'var(--text-3)' }}>
        {row.connected ? `${v}W` : '—'}
      </span>
    )},
    { key:'voltage_v', label:'Voltage', render: v => <span style={{ fontFamily:'var(--font-mono)', color:'var(--text-2)' }}>{v ? `${v}V` : '—'}</span> },
    { key:'balance_tzs', label:'Balance (TZS)', render: (v, row) => (
      <span style={{ fontFamily:'var(--font-mono)', fontWeight:500,
        color: v <= 0 ? 'var(--red)' : v < 3000 ? 'var(--amber)' : 'var(--emerald)' }}>
        {(v||0).toLocaleString()}
      </span>
    )},
    { key:'rssi_dbm', label:'Signal', render: v => <span style={{ fontFamily:'var(--font-mono)', fontSize:'11px', color:'var(--text-3)' }}>{v ? `${v} dBm` : '—'}</span> },
  ];

  return (
    <div style={{ padding:'24px 28px', animation:'fadeUp .3s var(--ease)' }}>
      <SectionHeader title="Meters" sub={`${rows.length} registered · Ukerewe Island`}/>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
        {[
          { label:'Total',       value:rows.length,                              color:'var(--text-1)' },
          { label:'Active',      value:rows.filter(m=>m.connected).length,       color:'var(--emerald)' },
          { label:'Disconnected',value:rows.filter(m=>!m.connected).length,      color:'var(--red)' },
          { label:'Tamper',      value:rows.filter(m=>m.tamper).length,          color:'var(--amber)' },
        ].map(k => (
          <div key={k.label} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'12px 14px' }}>
            <div style={{ fontSize:'10px', color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>{k.label}</div>
            <div style={{ fontSize:'24px', fontWeight:600, fontFamily:'var(--font-mono)', color:k.color }}>{k.value}</div>
          </div>
        ))}
      </div>
      <Table columns={cols} rows={rows} emptyMessage="Start simulator to see live meter data"/>
    </div>
  );
}


// ============================================================
// CustomersPage.jsx
// ============================================================
import { useState as useS } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card as C2, Badge as B2, Table as T2, SectionHeader as SH2, Btn, Stat } from '../components/ui.jsx';
import { TopUpModal } from '../components/modals/TopUpModal.jsx';

export function CustomersPage() {
  const [search, setSearch]   = useS('');
  const [filter, setFilter]   = useS('all');
  const [topUp,  setTopUp]    = useS(null);

  const { data = [], refetch } = useQuery({
    queryKey: ['customers'],
    queryFn: () => axios.get('/api/customers?site_id=00000000-0000-0000-0000-000000000010').then(r=>r.data),
  });

  const filtered = data.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !search || c.full_name?.toLowerCase().includes(q) || c.phone?.includes(q);
    const matchFilter = filter === 'all' || (filter==='low'&&c.balance_tzs>0&&c.balance_tzs<3000) || (filter==='zero'&&c.balance_tzs<=0);
    return matchSearch && matchFilter;
  });

  const cols = [
    { key:'full_name', label:'Customer',
      render:(v,row) => (
        <div>
          <div style={{ fontWeight:500, color:'var(--text-1)' }}>{v}</div>
          <div style={{ fontSize:'11px', color:'var(--text-3)', fontFamily:'var(--font-mono)', marginTop:2 }}>{row.phone}</div>
        </div>
      )
    },
    { key:'customer_type', label:'Type', w:'100px',
      render: v => <B2 variant="default" size="xs" style={{ textTransform:'capitalize' }}>{v}</B2>
    },
    { key:'meters', label:'Meter', w:'90px',
      render: v => <span style={{ fontFamily:'var(--font-mono)', fontSize:'11px', color:'var(--text-2)' }}>{v?.meter_ref||'—'}</span>
    },
    { key:'balance_tzs', label:'Balance', w:'130px',
      render: v => (
        <span style={{ fontFamily:'var(--font-mono)', fontWeight:600,
          color: v<=0?'var(--red)':v<3000?'var(--amber)':'var(--emerald)' }}>
          TZS {(v||0).toLocaleString()}
        </span>
      )
    },
    { key:'id', label:'', w:'80px',
      render:(v,row) => (
        <Btn size="sm" variant="ghost" onClick={e=>{e.stopPropagation();setTopUp(row);}}>Top up</Btn>
      )
    },
  ];

  return (
    <div style={{ padding:'24px 28px', animation:'fadeUp .3s var(--ease)' }}>
      <SH2 title="Customers" sub={`${data.length} registered · Ukerewe Island`}/>

      {topUp && (
        <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,.6)', backdropFilter:'blur(2px)' }}>
          <TopUpModal customer={topUp} onClose={()=>setTopUp(null)} onSuccess={()=>{refetch();setTopUp(null);}}/>
        </div>
      )}

      <div style={{ display:'flex', gap:10, marginBottom:14 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or phone..."
          style={{ flex:1, maxWidth:320 }}/>
        <div style={{ display:'flex', gap:4 }}>
          {[['all','All'],['low','Low credit'],['zero','Zero balance']].map(([v,l])=>(
            <button key={v} onClick={()=>setFilter(v)}
              style={{ padding:'6px 12px', fontSize:'12px', borderRadius:'var(--radius-pill)',
                border:`1px solid ${filter===v?'var(--emerald)':'var(--border-mid)'}`,
                background:filter===v?'var(--emerald-dim)':'transparent',
                color:filter===v?'var(--emerald)':'var(--text-3)', cursor:'pointer' }}>{l}</button>
          ))}
        </div>
      </div>

      <T2 columns={cols} rows={filtered} emptyMessage="No customers match filter"/>
    </div>
  );
}
export default CustomersPage;


// ============================================================
// AlertsPage.jsx
// ============================================================
import { useState as useS3 } from 'react';
import { useLive as useLive3 } from '../App.jsx';
import { Card as C3, Badge as B3, SectionHeader as SH3 } from '../components/ui.jsx';

export function AlertsPage() {
  const { alerts } = useLive3();
  const [filter, setFilter] = useS3('all');

  const shown = alerts.filter(a => filter === 'all' || a.severity === filter);
  const SEV = { critical:'var(--red)', high:'var(--amber)', medium:'var(--amber)', low:'var(--text-3)' };

  return (
    <div style={{ padding:'24px 28px', animation:'fadeUp .3s var(--ease)' }}>
      <SH3 title="Alerts" sub={`${alerts.length} total · ${alerts.filter(a=>a.severity==='critical').length} critical`}/>

      <div style={{ display:'flex', gap:4, marginBottom:14 }}>
        {[['all','All'],['critical','Critical'],['high','High'],['medium','Medium']].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)}
            style={{ padding:'5px 12px', fontSize:'11px', borderRadius:'var(--radius-pill)',
              border:`1px solid ${filter===v?'var(--border-hi)':'var(--border)'}`,
              background:filter===v?'var(--bg-surface)':'transparent',
              color:filter===v?'var(--text-1)':'var(--text-3)', cursor:'pointer' }}>{l}</button>
        ))}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {shown.length === 0 ? (
          <div style={{ padding:'3rem', textAlign:'center', color:'var(--text-3)', fontSize:'13px' }}>
            No alerts — all systems normal
          </div>
        ) : shown.map((a, i) => (
          <C3 key={i} padding="12px 14px" hover>
            <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:SEV[a.severity], marginTop:5, flexShrink:0 }}/>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                  <span style={{ fontSize:'12px', fontWeight:500, color:'var(--text-1)' }}>
                    {a.type || a.alert_type}
                  </span>
                  <span style={{ fontSize:'10px', color:'var(--text-3)', fontFamily:'var(--font-mono)' }}>
                    {a.t || new Date(a.timestamp||Date.now()).toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ fontSize:'12px', color:'var(--text-2)' }}>{a.message || a.msg}</div>
              </div>
            </div>
          </C3>
        ))}
      </div>
    </div>
  );
}
export default AlertsPage;


// ============================================================
// AnalyticsPage.jsx
// ============================================================
import { useEffect as useE4, useRef as useR4 } from 'react';
import { Stat as S4, Card as C4, SectionHeader as SH4 } from '../components/ui.jsx';

function BarChart({ data, labels, color = '#10b981', height = 160 }) {
  const ref = useR4(null);
  useE4(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const max = Math.max(...data, 1);
    const barW = (W - 16) / data.length - 6;
    ctx.clearRect(0, 0, W, H);
    data.forEach((v, i) => {
      const bh = (v / max) * (H - 28);
      const x = 8 + i * ((W - 16) / data.length);
      ctx.fillStyle = color + '22';
      ctx.roundRect(x, H - bh - 20, barW, bh, 3);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.roundRect(x, H - bh - 20, barW, 3, 2);
      ctx.fill();
      ctx.fillStyle = '#8a9bbf';
      ctx.font = '9px DM Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i] || '', x + barW/2, H - 4);
    });
  }, [data]);
  return <canvas ref={ref} width={700} height={height} style={{ width:'100%', height, display:'block' }}/>;
}

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const REV  = [82000,94000,76000,108000,98000,122000,89000];
const KWH  = [340,390,310,420,400,480,360];

export function AnalyticsPage() {
  return (
    <div style={{ padding:'24px 28px', animation:'fadeUp .3s var(--ease)' }}>
      <SH4 title="Analytics" sub="Revenue · energy · collection rate — Ukerewe Island"/>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:10, marginBottom:16 }}>
        <S4 label="ARPU / month" value="TZS 18,400" sub="Average revenue per user"/>
        <S4 label="Collection rate" value="78%" color="var(--emerald)" sub="Of billed amount" trend={3}/>
        <S4 label="Energy efficiency" value="94.5%" sub="Sold vs generated"/>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <C4 padding="16px">
          <div style={{ fontSize:'12px', fontWeight:500, color:'var(--text-2)', marginBottom:12 }}>Daily revenue — last 7 days (TZS)</div>
          <BarChart data={REV} labels={DAYS}/>
        </C4>
        <C4 padding="16px">
          <div style={{ fontSize:'12px', fontWeight:500, color:'var(--text-2)', marginBottom:12 }}>Daily energy sold (kWh)</div>
          <BarChart data={KWH} labels={DAYS} color="#3b82f6"/>
        </C4>
        <C4 padding="16px" style={{ gridColumn:'span 2' }}>
          <div style={{ fontSize:'12px', fontWeight:500, color:'var(--text-2)', marginBottom:12 }}>Customer type breakdown</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
            {[
              { type:'Residential', count:4, pct:40, rev:'TZS 28K' },
              { type:'Business',    count:4, pct:40, rev:'TZS 48K' },
              { type:'Productive',  count:2, pct:20, rev:'TZS 56K' },
              { type:'Total',       count:10,pct:100, rev:'TZS 132K' },
            ].map(r => (
              <div key={r.type} style={{ background:'var(--bg-surface)', borderRadius:'var(--radius)', padding:'12px' }}>
                <div style={{ fontSize:'11px', color:'var(--text-3)', marginBottom:4 }}>{r.type}</div>
                <div style={{ fontSize:'20px', fontWeight:600, fontFamily:'var(--font-mono)', color:'var(--text-1)' }}>{r.count}</div>
                <div style={{ fontSize:'11px', color:'var(--emerald)', fontFamily:'var(--font-mono)', marginTop:4 }}>{r.rev}/mo</div>
              </div>
            ))}
          </div>
        </C4>
      </div>
    </div>
  );
}
export default AnalyticsPage;


// ============================================================
// ReportsPage.jsx
// ============================================================
import { Btn as B5, Card as C5, SectionHeader as SH5 } from '../components/ui.jsx';
import axios from 'axios';

const SITE_ID = '00000000-0000-0000-0000-000000000010';
const REPORTS = [
  { id:'rea',        title:'REA Tanzania RBF',        desc:'Connections, revenue, collection rate — LOIS format', url:`/api/reports/rea/${SITE_ID}`, badge:'REA · LOIS', color:'var(--emerald)' },
  { id:'worldbank',  title:'World Bank / ESMAP',       desc:'ESMAP-MINIGRID-2024 template · SDG7 Tier 3', url:`/api/reports/worldbank/${SITE_ID}`, badge:'WB · SDG7', color:'var(--blue)' },
  { id:'ewura',      title:'EWURA submission',         desc:'Tariff schedule, customer breakdown, justification', url:`/api/reports/ewura/${SITE_ID}`, badge:'EWURA · TZ', color:'var(--amber)' },
  { id:'carbon',     title:'Carbon credits — Verra',   desc:'VM0038 methodology · tCO2e · revenue estimates', url:`/api/reports/carbon/${SITE_ID}`, badge:'Verra · VCS', color:'var(--emerald)' },
  { id:'productive', title:'Productive use analysis',  desc:'Identifies high-consumption customers · CLASP referrals', url:`/api/reports/productive-use/${SITE_ID}`, badge:'CLASP', color:'var(--amber)' },
  { id:'rbf',        title:'RBF milestone tracker',    desc:'Grant eligibility · connection verification', url:`/api/fintech/rbf/${SITE_ID}`, badge:'RBF · Live', color:'var(--blue)' },
];

export function ReportsPage() {
  const [loading, setLoading] = useS({});
  const [preview, setPreview] = useS(null);

  const generate = async (report) => {
    setLoading(l => ({ ...l, [report.id]:true }));
    try {
      const { data } = await axios.get(report.url);
      setPreview({ title:report.title, data });
    } catch(e) {
      alert('API error: ' + e.message);
    } finally {
      setLoading(l => ({ ...l, [report.id]:false }));
    }
  };

  return (
    <div style={{ padding:'24px 28px', animation:'fadeUp .3s var(--ease)' }}>
      <SH5 title="Reports" sub="Auto-generated regulatory and compliance reports"/>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {REPORTS.map(r => (
          <C5 key={r.id} padding="16px" hover>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
              <span style={{ fontSize:'10px', fontWeight:600, fontFamily:'var(--font-mono)',
                color:r.color, border:`1px solid ${r.color}22`, background:`${r.color}11`,
                padding:'2px 8px', borderRadius:'var(--radius-pill)' }}>{r.badge}</span>
              <B5 size="sm" variant="ghost" loading={loading[r.id]} onClick={()=>generate(r)}>
                Generate
              </B5>
            </div>
            <div style={{ fontSize:'14px', fontWeight:500, color:'var(--text-1)', marginBottom:4 }}>{r.title}</div>
            <div style={{ fontSize:'12px', color:'var(--text-3)' }}>{r.desc}</div>
          </C5>
        ))}
      </div>

      {preview && (
        <div style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,.7)', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
          <C5 padding="20px" style={{ maxWidth:700, width:'100%', maxHeight:'80vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
              <div style={{ fontSize:'14px', fontWeight:500 }}>{preview.title}</div>
              <div style={{ display:'flex', gap:8 }}>
                <B5 size="sm" variant="ghost" onClick={()=>{ const b=new Blob([JSON.stringify(preview.data,null,2)],{type:'application/json'}); const u=URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download='report.json'; a.click(); }}>Download</B5>
                <B5 size="sm" variant="ghost" onClick={()=>setPreview(null)}>Close</B5>
              </div>
            </div>
            <pre style={{ fontSize:'11px', color:'var(--text-2)', fontFamily:'var(--font-mono)', background:'var(--bg-surface)', padding:12, borderRadius:'var(--radius)', overflowX:'auto', lineHeight:1.6 }}>
              {JSON.stringify(preview.data, null, 2)}
            </pre>
          </C5>
        </div>
      )}
    </div>
  );
}
export default ReportsPage;


// ============================================================
// PlanningPage.jsx — Site scoring map
// ============================================================
import { useState as useS6 } from 'react';
import { Btn as B6, Card as C6, SectionHeader as SH6, ProgressBar } from '../components/ui.jsx';
import axios from 'axios';

export function PlanningPage() {
  const [lat, setLat] = useS6('-2.0167');
  const [lng, setLng] = useS6('33.0167');
  const [result, setResult] = useS6(null);
  const [loading, setLoading] = useS6(false);

  const score = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/planning/score?lat=${lat}&lng=${lng}`);
      setResult(data);
    } catch(e) {
      alert('API error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const viabilityColor = v => ({ excellent:'var(--emerald)', good:'var(--blue)', marginal:'var(--amber)', poor:'var(--red)' }[v] || 'var(--text-3)');

  return (
    <div style={{ padding:'24px 28px', animation:'fadeUp .3s var(--ease)' }}>
      <SH6 title="Site planning" sub="Score candidate locations · WorldPop · Global Solar Atlas"/>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
        <div>
          <label style={{ fontSize:'11px', color:'var(--text-3)', display:'block', marginBottom:5 }}>Latitude</label>
          <input value={lat} onChange={e=>setLat(e.target.value)} placeholder="-2.0167"/>
        </div>
        <div>
          <label style={{ fontSize:'11px', color:'var(--text-3)', display:'block', marginBottom:5 }}>Longitude</label>
          <input value={lng} onChange={e=>setLng(e.target.value)} placeholder="33.0167"/>
        </div>
      </div>
      <B6 variant="primary" onClick={score} loading={loading} full>Score this location</B6>

      {result && (
        <div style={{ marginTop:16, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <C6 padding="16px">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div style={{ fontSize:'13px', fontWeight:500 }}>Viability score</div>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:'22px', fontWeight:700, color:viabilityColor(result.viability) }}>
                {result.total_score}/100
              </span>
            </div>
            <div style={{ fontSize:'13px', color:viabilityColor(result.viability), fontWeight:500, textTransform:'capitalize', marginBottom:12 }}>
              {result.viability}
            </div>
            {Object.entries(result.score_breakdown||{}).map(([k,v]) => (
              <div key={k} style={{ marginBottom:8 }}>
                <ProgressBar value={v} max={30} label={k.replace('_',' ')} color="var(--emerald)"/>
              </div>
            ))}
          </C6>
          <C6 padding="16px">
            <div style={{ fontSize:'13px', fontWeight:500, marginBottom:12 }}>Financial projections</div>
            {Object.entries(result.projections||{}).map(([k,v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid var(--border)', fontSize:'12px' }}>
                <span style={{ color:'var(--text-3)', textTransform:'capitalize' }}>{k.replace(/_/g,' ')}</span>
                <span style={{ fontFamily:'var(--font-mono)', color:'var(--text-1)', fontWeight:500 }}>{typeof v === 'number' ? v.toLocaleString() : String(v)}</span>
              </div>
            ))}
          </C6>
        </div>
      )}
    </div>
  );
}
export default PlanningPage;


// ============================================================
// SettingsPage.jsx
// ============================================================
import { Btn as B7, Card as C7, SectionHeader as SH7 } from '../components/ui.jsx';

export function SettingsPage() {
  return (
    <div style={{ padding:'24px 28px', animation:'fadeUp .3s var(--ease)' }}>
      <SH7 title="Settings" sub="Operator profile · API keys · integrations"/>
      <div style={{ display:'flex', flexDirection:'column', gap:12, maxWidth:560 }}>
        {[
          { title:'Operator profile', desc:'Name, contact, country, plan tier', action:'Edit' },
          { title:'Site configuration', desc:'Tariffs, capacity, regulatory details', action:'Configure' },
          { title:'Mobile money', desc:'ClickPesa, M-Pesa Daraja, MTN MoMo keys', action:'Configure' },
          { title:'USSD setup', desc:'Africa\'s Talking API key, USSD code, sender ID', action:'Configure' },
          { title:'Developer API', desc:'Generate API keys for third-party integrations', action:'Generate key' },
          { title:'STS certification', desc:'Apply for STS Association token vending license', action:'Apply →' },
          { title:'EWURA / LOIS', desc:'Upload licence documents, set renewal dates', action:'Upload' },
        ].map(s => (
          <C7 key={s.title} padding="14px 16px" hover>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:'13px', fontWeight:500, color:'var(--text-1)', marginBottom:3 }}>{s.title}</div>
                <div style={{ fontSize:'12px', color:'var(--text-3)' }}>{s.desc}</div>
              </div>
              <B7 size="sm" variant="ghost">{s.action}</B7>
            </div>
          </C7>
        ))}
      </div>
    </div>
  );
}
export default SettingsPage;

// Re-export for App.jsx imports
export { default as MetersPage }   from './MetersPage.jsx';
export { CustomersPage as default  } from './CustomersPage.jsx';
