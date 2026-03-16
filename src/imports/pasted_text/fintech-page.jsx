// ============================================================
// FintechPage.jsx — RBF + Carbon + MFI + Blended Finance
// ============================================================
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card, Stat, Badge, ProgressBar, Btn, SectionHeader, AnimNum } from '../components/ui.jsx';

const SITE_ID = '00000000-0000-0000-0000-000000000010';
const OP_ID   = '00000000-0000-0000-0000-000000000001';

export default function FintechPage() {
  const { data: rbf }    = useQuery({ queryKey:['rbf'],    queryFn:()=>axios.get(`/api/fintech/rbf/${SITE_ID}`).then(r=>r.data) });
  const { data: carbon } = useQuery({ queryKey:['carbon'], queryFn:()=>axios.get(`/api/fintech/carbon/${SITE_ID}`).then(r=>r.data) });
  const { data: mfi }    = useQuery({ queryKey:['mfi'],    queryFn:()=>axios.get(`/api/fintech/mfi/${SITE_ID}`).then(r=>r.data) });
  const { data: recv }   = useQuery({ queryKey:['recv'],   queryFn:()=>axios.get(`/api/fintech/receivables/${OP_ID}`).then(r=>r.data) });

  const [bfCap, setBfCap]   = useState(50);
  const [bfConn, setBfConn] = useState(300);
  const [bfResult, setBfResult] = useState(null);
  const [bfLoading, setBfLoading] = useState(false);

  const calcBf = async () => {
    setBfLoading(true);
    const { data } = await axios.post('/api/fintech/blended-finance', { capacity_kw:bfCap, expected_connections:bfConn, country:'TZ', has_lois:true });
    setBfResult(data);
    setBfLoading(false);
  };

  return (
    <div style={{ padding:'24px 28px', animation:'fadeUp .3s var(--ease)' }}>
      <SectionHeader title="Fintech" sub="RBF grants · Carbon credits · MFI lending · Blended finance"/>

      {/* Summary row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:10, marginBottom:16 }}>
        <Stat label="Est. RBF grant" value={`$${(rbf?.estimated_grant_usd||0).toLocaleString()}`}
          color={rbf?.eligible?'var(--emerald)':'var(--text-2)'}
          sub={rbf?.eligible?'Eligible now':'In progress'}/>
        <Stat label="Carbon YTD (Gold Std)" value={`$${(carbon?.revenue?.gold_standard_usd||0).toFixed(0)}`}
          color="var(--emerald)" sub={`${(carbon?.tco2e_avoided||0).toFixed(2)} tCO2e`}/>
        <Stat label="MFI portfolio" value={mfi?.portfolio?.total_customers||0}
          sub={`Avg score: ${mfi?.portfolio?.avg_score||0}/100`}/>
        <Stat label="Receivables ARR" value={`$${(recv?.portfolio?.total_annual_usd||0).toLocaleString()}`}
          color="var(--emerald)" sub={recv?.dfi_suitability==='eligible'?'DFI eligible':'Growing'}/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>

        {/* RBF Milestones */}
        <Card padding="16px">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={{ fontSize:'13px', fontWeight:500 }}>RBF milestone tracker</div>
            <Badge variant={rbf?.eligible?'success':'warning'}>{rbf?.eligible?'Eligible':'In progress'}</Badge>
          </div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:'28px', fontWeight:700,
            color:rbf?.eligible?'var(--emerald)':'var(--text-2)', marginBottom:4 }}>
            ${(rbf?.estimated_grant_usd||0).toLocaleString()}
          </div>
          <div style={{ fontSize:'11px', color:'var(--text-3)', marginBottom:14 }}>
            REA Tanzania · {rbf?.program?.funder}
          </div>
          {(rbf?.milestones||[]).map((m,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <div style={{ width:16, height:16, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
                background:m.met?'var(--emerald-dim)':'var(--bg-surface)',
                border:`1px solid ${m.met?'var(--emerald)':'var(--border)'}` }}>
                {m.met && <span style={{ fontSize:'9px', color:'var(--emerald)' }}>✓</span>}
              </div>
              <div style={{ flex:1, fontSize:'12px', color:m.met?'var(--text-2)':'var(--text-1)' }}>{m.label}</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-3)' }}>
                {m.current}{m.unit||''}/{m.target}{m.unit||''}
              </div>
            </div>
          ))}
          {rbf?.next_submission && (
            <div style={{ marginTop:10, padding:'8px 10px', background:'var(--bg-surface)', borderRadius:'var(--radius)', fontSize:'11px', color:'var(--text-3)' }}>
              Next submission: {rbf.next_submission}
            </div>
          )}
        </Card>

        {/* Carbon Revenue */}
        <Card padding="16px">
          <div style={{ fontSize:'13px', fontWeight:500, marginBottom:12 }}>Carbon revenue — year to date</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:14 }}>
            {[
              { label:'OTC Africa', rate:'$3/t', usd:carbon?.revenue?.otc_usd },
              { label:'Gold Standard', rate:'$13/t', usd:carbon?.revenue?.gold_standard_usd },
              { label:'Compliance', rate:'$25/t', usd:carbon?.revenue?.compliance_usd },
            ].map(t => (
              <div key={t.label} style={{ background:'var(--bg-surface)', borderRadius:'var(--radius)', padding:'10px 10px' }}>
                <div style={{ fontSize:'10px', color:'var(--text-3)', marginBottom:4 }}>{t.label}</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:'18px', fontWeight:700, color:'var(--emerald)' }}>
                  ${(t.usd||0).toFixed(0)}
                </div>
                <div style={{ fontSize:'10px', color:'var(--text-3)', marginTop:2 }}>{t.rate}</div>
              </div>
            ))}
          </div>
          <ProgressBar value={carbon?.tco2e_avoided||0} max={Math.max(carbon?.projected_annual?.tco2e||1,1)}
            label={`${(carbon?.tco2e_avoided||0).toFixed(2)} tCO2e of ${(carbon?.projected_annual?.tco2e||0).toFixed(0)} projected`}/>
          <div style={{ marginTop:10, fontSize:'11px', color:'var(--text-3)' }}>
            Registry: {carbon?.registry_status?.replace(/_/g,' ')} · Apply at verra.org
          </div>
        </Card>

        {/* MFI Portfolio */}
        <Card padding="16px">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={{ fontSize:'13px', fontWeight:500 }}>MFI lending portfolio</div>
            <Btn size="sm" variant="ghost" onClick={()=>window.open(`/api/fintech/mfi/export/${SITE_ID}`)}>Export JSON ↓</Btn>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:12 }}>
            {[
              { l:'Excellent', v:mfi?.portfolio?.excellent, c:'var(--emerald)' },
              { l:'Good',      v:mfi?.portfolio?.good,      c:'var(--blue)' },
              { l:'Fair',      v:mfi?.portfolio?.fair,      c:'var(--amber)' },
              { l:'Poor',      v:mfi?.portfolio?.poor,      c:'var(--red)' },
            ].map(t => (
              <div key={t.l} style={{ background:'var(--bg-surface)', borderRadius:'var(--radius)', padding:'8px', textAlign:'center' }}>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:'22px', fontWeight:700, color:t.c }}>{t.v||0}</div>
                <div style={{ fontSize:'10px', color:'var(--text-3)', marginTop:2 }}>{t.l}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:'12px', color:'var(--text-2)' }}>
            Avg credit score: <strong style={{ fontFamily:'var(--font-mono)' }}>{mfi?.portfolio?.avg_score||0}/100</strong>
            &nbsp;·&nbsp;Total limit: TZS {(mfi?.portfolio?.total_recommended_limit_tzs||0).toLocaleString()}
          </div>
          <div style={{ fontSize:'11px', color:'var(--text-3)', marginTop:4 }}>Partners: Jumo · Branch · FINCA Tanzania</div>
        </Card>

        {/* Blended Finance Calculator */}
        <Card padding="16px">
          <div style={{ fontSize:'13px', fontWeight:500, marginBottom:12 }}>Blended finance calculator</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            <div>
              <label style={{ fontSize:'11px', color:'var(--text-3)', display:'block', marginBottom:4 }}>Capacity (kW)</label>
              <input type="number" value={bfCap} onChange={e=>setBfCap(+e.target.value)}/>
            </div>
            <div>
              <label style={{ fontSize:'11px', color:'var(--text-3)', display:'block', marginBottom:4 }}>Connections</label>
              <input type="number" value={bfConn} onChange={e=>setBfConn(+e.target.value)}/>
            </div>
          </div>
          <Btn full variant="primary" loading={bfLoading} onClick={calcBf}>Calculate structure</Btn>
          {bfResult && (
            <div style={{ marginTop:12 }}>
              {Object.entries(bfResult.financing_structure||{}).map(([k,v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0',
                  borderBottom:'1px solid var(--border)', fontSize:'12px' }}>
                  <span style={{ color:'var(--text-3)', textTransform:'capitalize' }}>{k.replace(/_/g,' ')}</span>
                  <div style={{ textAlign:'right' }}>
                    <span style={{ fontFamily:'var(--font-mono)', color:k==='rbf_grant'?'var(--emerald)':'var(--text-1)', fontWeight:500 }}>
                      ${(v.amount_usd||0).toLocaleString()}
                    </span>
                    <span style={{ fontSize:'10px', color:'var(--text-3)', marginLeft:4 }}>({v.share_pct}%)</span>
                  </div>
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', fontSize:'12px' }}>
                <span style={{ color:'var(--text-3)' }}>DSCR · Bankable</span>
                <span style={{ fontFamily:'var(--font-mono)', fontWeight:600,
                  color:bfResult.financial_metrics?.bankable?'var(--emerald)':'var(--red)' }}>
                  {bfResult.financial_metrics?.dscr}× · {bfResult.financial_metrics?.bankable?'Yes':'No'}
                </span>
              </div>
              <div style={{ fontSize:'11px', color:'var(--text-3)', marginTop:4 }}>
                Carbon upside: ${(bfResult.carbon_upside_usd_yr||0).toLocaleString()}/yr (Gold Standard)
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}


// ============================================================
// OperationsPage.jsx
// ============================================================
import { useQuery as uQ2 } from '@tanstack/react-query';
import axios from 'axios';
import { Card as OC, Stat as OS, Badge as OB, SectionHeader as OSH } from '../components/ui.jsx';

export function OperationsPage() {
  const { data: anomalies }   = uQ2({ queryKey:['anomalies'],   queryFn:()=>axios.get(`/api/operations/anomalies/${SITE_ID}`).then(r=>r.data),    refetchInterval:15000 });
  const { data: agri }        = uQ2({ queryKey:['agri'],        queryFn:()=>axios.get(`/api/operations/agriculture/${SITE_ID}`).then(r=>r.data) });
  const { data: maintenance } = uQ2({ queryKey:['maintenance'], queryFn:()=>axios.get(`/api/operations/maintenance/${SITE_ID}`).then(r=>r.data) });
  const { data: regulatory }  = uQ2({ queryKey:['regulatory'],  queryFn:()=>axios.get(`/api/operations/regulatory/${OP_ID}`).then(r=>r.data) });
  const { data: impact }      = uQ2({ queryKey:['impact'],      queryFn:()=>axios.get(`/api/operations/impact/${OP_ID}`).then(r=>r.data) });

  const SEV_C = { critical:'var(--red)', high:'var(--amber)', medium:'var(--amber)', low:'var(--text-3)' };

  return (
    <div style={{ padding:'24px 28px', animation:'fadeUp .3s var(--ease)' }}>
      <OSH title="Operations" sub="Anomaly detection · Maintenance · Regulatory calendar · SDG7 impact"/>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:10, marginBottom:16 }}>
        <OS label="Anomalies (24h)" value={anomalies?.anomaly_count||0}
          color={anomalies?.critical>0?'var(--red)':anomalies?.high>0?'var(--amber)':'var(--emerald)'}
          sub={`${anomalies?.critical||0} critical`}/>
        <OS label="Season demand" value={agri?.demand_vs_baseline||'+0%'}
          color={agri?.demand_index>=1.1?'var(--amber)':'var(--emerald)'}
          sub={agri?.current_season?.season?.replace('_',' ')}/>
        <OS label="Maintenance tasks" value={maintenance?.urgent||0}
          color={maintenance?.urgent>0?'var(--red)':'var(--emerald)'}
          sub={`${maintenance?.scheduled||0} scheduled`}/>
        <OS label="People reached" value={(impact?.impact?.people_reached||0).toLocaleString()}
          color="var(--emerald)" sub="SDG7 SE4All Tier 3"/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>

        {/* Anomaly Feed */}
        <OC padding="16px">
          <div style={{ fontSize:'13px', fontWeight:500, marginBottom:10 }}>Anomaly feed — live</div>
          {(anomalies?.anomalies||[]).slice(0,5).map((a,i) => (
            <div key={i} style={{ display:'flex', gap:8, padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:'12px' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:SEV_C[a.severity], marginTop:5, flexShrink:0 }}/>
              <div style={{ flex:1 }}>
                <div style={{ color:'var(--text-1)', marginBottom:2 }}>{a.message}</div>
                <div style={{ color:'var(--text-3)', fontSize:'11px' }}>{a.action}</div>
              </div>
              <div style={{ color:'var(--text-3)', fontSize:'10px', fontFamily:'var(--font-mono)' }}>{Math.round((a.probability||0)*100)}%</div>
            </div>
          ))}
          {!anomalies?.anomaly_count && <div style={{ fontSize:'12px', color:'var(--text-3)', padding:'1rem 0' }}>All systems normal</div>}
        </OC>

        {/* Agricultural Intelligence */}
        <OC padding="16px">
          <div style={{ fontSize:'13px', fontWeight:500, marginBottom:10 }}>Agricultural season intelligence</div>
          <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:12 }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:'32px', fontWeight:700,
              color:agri?.demand_index>=1.1?'var(--amber)':agri?.demand_index>=1?'var(--emerald)':'var(--text-2)' }}>
              {agri?.demand_vs_baseline||'+0%'}
            </div>
            <div>
              <div style={{ fontSize:'13px', color:'var(--text-1)', textTransform:'capitalize' }}>
                {agri?.current_season?.season?.replace(/_/g,' ')}
              </div>
              <div style={{ fontSize:'11px', color:'var(--text-3)' }}>{agri?.crop_activity}</div>
            </div>
          </div>
          <div style={{ fontSize:'11px', color:'var(--text-2)', background:'var(--bg-surface)', padding:'8px 10px', borderRadius:'var(--radius)', marginBottom:10 }}>
            {agri?.battery_recommendation}
          </div>
          {(agri?.upcoming_alerts||[]).map((a,i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid var(--border)', fontSize:'11px' }}>
              <span style={{ color:'var(--text-3)' }}>{a.month} — {a.season?.replace(/_/g,' ')}</span>
              <span style={{ fontFamily:'var(--font-mono)', color:'var(--amber)', fontWeight:500 }}>
                {a.demand_change_pct>=0?'+':''}{a.demand_change_pct}%
              </span>
            </div>
          ))}
        </OC>

        {/* Maintenance */}
        <OC padding="16px">
          <div style={{ fontSize:'13px', fontWeight:500, marginBottom:10 }}>Maintenance schedule</div>
          {(maintenance?.tasks||[]).slice(0,5).map((t,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 0', borderBottom:'1px solid var(--border)', fontSize:'12px' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', flexShrink:0,
                background:t.priority_label==='urgent'?'var(--red)':t.priority_label==='scheduled'?'var(--amber)':'var(--text-3)' }}/>
              <div style={{ flex:1 }}>
                <div style={{ color:'var(--text-1)' }}>{t.meter_ref} — {t.task_type?.replace(/_/g,' ')}</div>
                <div style={{ fontSize:'11px', color:'var(--text-3)' }}>{t.reasons?.slice(0,2).join(', ')}</div>
              </div>
              <div style={{ fontSize:'10px', color:'var(--text-3)', fontFamily:'var(--font-mono)' }}>{t.due_date}</div>
            </div>
          ))}
          {!maintenance?.tasks?.length && <div style={{ fontSize:'12px', color:'var(--text-3)', padding:'1rem 0' }}>No tasks scheduled</div>}
        </OC>

        {/* SDG7 Impact */}
        <OC padding="16px">
          <div style={{ fontSize:'13px', fontWeight:500, marginBottom:12 }}>SDG7 impact</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[
              { l:'People reached',    v:(impact?.impact?.people_reached||0).toLocaleString() },
              { l:'CO2 avoided (t)',   v:(impact?.impact?.co2_avoided_tons||0).toFixed(1) },
              { l:'kWh delivered',     v:(impact?.impact?.total_kwh_delivered||0).toFixed(0) },
              { l:'Health clinic kWh', v:(impact?.impact?.health_facility_kwh||0).toFixed(0) },
              { l:'School kWh',        v:(impact?.impact?.school_kwh||0).toFixed(0) },
              { l:'SE4All tier',       v:`Tier ${impact?.se4all_tier?.current||1}` },
            ].map(m => (
              <div key={m.l} style={{ background:'var(--bg-surface)', borderRadius:'var(--radius)', padding:'10px 12px' }}>
                <div style={{ fontSize:'10px', color:'var(--text-3)', marginBottom:3 }}>{m.l}</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:'18px', fontWeight:700, color:'var(--emerald)' }}>{m.v}</div>
              </div>
            ))}
          </div>
        </OC>
      </div>
    </div>
  );
}
