// pages/PortfolioPage.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { portfolioApi } from '../services/api';
import { Card, Stat, SectionHeader, HealthRing, Table } from '../components/ui';

const OP_ID = '00000000-0000-0000-0000-000000000001';

export default function PortfolioPage() {
  const [sort, setSort] = useState('health');
  const { data, isLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => portfolioApi.getByOperator(OP_ID).then(r => r.data),
    refetchInterval: 30000,
  });

  const sites = [...(data?.sites || [])].sort((a: any, b: any) => {
    if (sort === 'health')   return b.health_score - a.health_score;
    if (sort === 'revenue')  return b.monthly_revenue_usd - a.monthly_revenue_usd;
    if (sort === 'alerts')   return b.unresolved_alerts - a.unresolved_alerts;
    return (a.name||'') < (b.name||'') ? -1 : 1;
  });

  const cols = [
    { key:'name', label:'Site', render:(v: any, row: any) => (
      <div>
        <div style={{ fontWeight:500, color:'var(--text-primary)' }}>{v}</div>
        <div style={{ fontSize:'11px', color:'var(--text-muted)', marginTop:2 }}>{row.region} · {row.capacity_kw}kW</div>
      </div>
    )},
    { key:'health_score', label:'Health', w:'72px', render:(v: number) => <HealthRing score={v||0} size={44}/> },
    { key:'meters_total', label:'Meters', w:'70px', render:(v: number) => <span style={{ fontFamily:'var(--font-mono)' }}>{v}</span> },
    { key:'active_customers', label:'Active', w:'70px', render:(v: number) => <span style={{ fontFamily:'var(--font-mono)', color:'var(--brand-emerald)' }}>{v}</span> },
    { key:'monthly_revenue_tzs', label:'Revenue/mo', render:(v: number) => (
      <span style={{ fontFamily:'var(--font-mono)', color:'var(--brand-emerald)', fontWeight:500 }}>
        TZS {(v||0).toLocaleString()}
      </span>
    )},
    { key:'unresolved_alerts', label:'Alerts', w:'70px', render:(v: number) => v > 0
      ? <span style={{ fontSize:'11px', fontWeight:600, color:'var(--status-danger)', fontFamily:'var(--font-mono)' }}>{v}</span>
      : <span style={{ fontSize:'11px', color:'var(--text-muted)' }}>—</span>
    },
    { key:'health_status', label:'Status', w:'90px', render:(v: string) => {
      const c = v==='healthy'?'success':v==='attention'?'warning':'danger';
      return <span style={{ fontSize:'11px', fontWeight:500, color:`var(--${c==='success'?'brand-emerald':c==='warning'?'status-warn':'status-danger'})`, textTransform:'capitalize' }}>{v||'—'}</span>;
    }},
  ];

  return (
    <div style={{ padding:'24px 28px', animation:'fadeUp .3s var(--ease)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:700, letterSpacing:'-.03em', marginBottom:3, color:'var(--text-primary)' }}>
            Portfolio
          </h1>
          <p style={{ fontSize:'12px', color:'var(--text-muted)' }}>
            {data?.totals?.sites||0} sites · {data?.totals?.total_customers||0} customers · ${(data?.totals?.total_revenue_usd_mo||0).toLocaleString()}/mo
          </p>
        </div>
        <select 
          value={sort} 
          onChange={e=>setSort(e.target.value)} 
          style={{ 
            fontSize:'12px', 
            padding:'6px 10px',
            backgroundColor:'var(--bg-surface)',
            color:'var(--text-primary)',
            border:'1px solid var(--bg-border-mid)',
            borderRadius:'var(--border-radius-md)'
          }}
        >
          <option value="health">Sort: health score</option>
          <option value="revenue">Sort: revenue</option>
          <option value="alerts">Sort: alerts</option>
          <option value="name">Sort: name</option>
        </select>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:10, marginBottom:16 }}>
        <Stat label="Sites"            value={data?.totals?.sites||0}/>
        <Stat label="Active customers" value={data?.totals?.total_customers||0} color="var(--brand-emerald)"/>
        <Stat label="Revenue/mo"       value={`$${(data?.totals?.total_revenue_usd_mo||0).toLocaleString()}`} color="var(--brand-emerald)"/>
        <Stat label="Open alerts"      value={data?.totals?.total_alerts||0}
          color={data?.totals?.total_alerts>0?'var(--status-danger)':'var(--brand-emerald)'}/>
      </div>

      {isLoading
        ? <div style={{ padding:'3rem', textAlign:'center', color:'var(--text-muted)' }}>Loading portfolio...</div>
        : <Table columns={cols} rows={sites} emptyMessage="No sites found"/>
      }
    </div>
  );
}
