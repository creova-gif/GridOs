// GridOS — Dashboard Page
// Live site overview: KPIs · load chart · meter grid · alert feed

import { useState, useEffect, useRef } from 'react';
import { useLive }  from '../App.jsx';
import { Stat, Card, Badge, StatusDot, HealthRing, Sparkline, AnimNum } from '../components/ui.jsx';

// Lightweight sparkline chart using canvas
function LoadChart({ data, width = '100%', height = 120 }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;
    const ctx  = canvas.getContext('2d');
    const W    = canvas.width;
    const H    = canvas.height;
    const max  = Math.max(...data, 1);
    const pts  = data.map((v, i) => [
      (i / (data.length - 1)) * W,
      H - (v / max) * (H - 8) - 4,
    ]);
    ctx.clearRect(0, 0, W, H);

    // Fill
    ctx.beginPath();
    ctx.moveTo(pts[0][0], H);
    pts.forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.lineTo(pts[pts.length-1][0], H);
    ctx.closePath();
    ctx.fillStyle = 'rgba(16,185,129,.07)';
    ctx.fill();

    // Line
    ctx.beginPath();
    pts.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.stroke();

    // Last point dot
    const [lx, ly] = pts[pts.length - 1];
    ctx.beginPath();
    ctx.arc(lx, ly, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#10b981';
    ctx.fill();
  }, [data]);

  return <canvas ref={canvasRef} width={800} height={height} style={{ width, height, display:'block' }}/>;
}

function MeterTile({ meter }) {
  const disc = !meter.connected || meter.balance_tzs <= 0;
  const low  = meter.balance_tzs > 0 && meter.balance_tzs < 3000;
  const tamper = meter.tamper;

  return (
    <div style={{
      padding:'10px 12px', borderRadius:'var(--radius)',
      background: disc ? 'rgba(239,68,68,.04)' : tamper ? 'rgba(245,158,11,.04)' : 'var(--bg-surface)',
      border:`1px solid ${disc?'rgba(239,68,68,.2)':tamper?'rgba(245,158,11,.2)':'var(--border)'}`,
      transition:'all var(--dur-fast) var(--ease)',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
        <span style={{ fontSize:'11px', fontWeight:600, fontFamily:'var(--font-mono)', color:'var(--text-2)' }}>
          {meter.meter_id}
        </span>
        <StatusDot status={disc?'danger':tamper?'warning':'active'}/>
      </div>
      <div style={{ fontSize:'18px', fontWeight:600, fontFamily:'var(--font-mono)',
        color: disc?'var(--red)':tamper?'var(--amber)':'var(--text-1)', marginBottom:4 }}>
        {disc ? 'OFF' : `${meter.power_w}W`}
      </div>
      <div style={{ fontSize:'11px', color: low?'var(--amber)':disc?'var(--red)':'var(--text-3)', fontFamily:'var(--font-mono)' }}>
        TZS {(meter.balance_tzs||0).toLocaleString()}
      </div>
      {tamper && <div style={{ fontSize:'10px', color:'var(--amber)', marginTop:3, fontWeight:500 }}>⚠ TAMPER</div>}
    </div>
  );
}

export default function DashboardPage() {
  const { meters, summary, alerts, online } = useLive();
  const meterList    = Object.values(meters);
  const [loadHist, setLoadHist] = useState(Array(40).fill(0));
  const [tick, setTick]         = useState(0);

  useEffect(() => {
    if (!summary?.total_load_w) return;
    setLoadHist(prev => [...prev.slice(1), summary.total_load_w]);
    setTick(t => t + 1);
  }, [summary]);

  const conn    = meterList.filter(m => m.connected).length;
  const zeroBal = meterList.filter(m => (m.balance_tzs||0) <= 0).length;
  const lowBal  = meterList.filter(m => m.balance_tzs > 0 && m.balance_tzs < 3000).length;
  const crit    = alerts.filter(a => a.severity === 'critical').length;

  return (
    <div style={{ padding:'24px 28px', animation:'fadeUp .3s var(--ease)' }}>

      {/* Page header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem' }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-head)', fontSize:'22px', fontWeight:700, letterSpacing:'-.03em', marginBottom:3 }}>
            Site overview
          </h1>
          <p style={{ fontSize:'12px', color:'var(--text-3)' }}>
            Ukerewe Island · Nansio Feeder · 50 kW capacity
          </p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:'11px', color:'var(--text-3)' }}>
          <StatusDot status={online?'active':'offline'} pulse/>
          <span>{online ? 'Live' : 'Reconnecting'}</span>
          <span style={{ color:'var(--border-mid)' }}>·</span>
          <span style={{ fontFamily:'var(--font-mono)' }}>tick {tick}</span>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:10, marginBottom:16 }}>
        <Stat label="Connected" value={`${conn}/10`}
          color={conn >= 8 ? 'var(--emerald)' : conn >= 6 ? 'var(--amber)' : 'var(--red)'}
          sub={`${Math.round(conn/10*100)}% active`}/>
        <Stat label="Site load"
          value={<AnimNum value={summary?.total_load_w||0} suffix="W"/>}
          sub={`${summary?.utilization_pct||0}% of 50kW`}/>
        <Stat label="Zero balance" value={zeroBal}
          color={zeroBal > 0 ? 'var(--red)' : 'var(--emerald)'}
          sub={lowBal > 0 ? `+${lowBal} low credit` : 'All healthy'}/>
        <Stat label="Active alerts" value={crit > 0 ? crit : alerts.length}
          color={crit > 0 ? 'var(--red)' : alerts.length > 0 ? 'var(--amber)' : 'var(--emerald)'}
          sub={crit > 0 ? 'Critical — action needed' : 'All clear'}/>
      </div>

      {/* Charts row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:12, marginBottom:12 }}>

        {/* Load chart */}
        <Card padding="16px">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={{ fontSize:'12px', fontWeight:500, color:'var(--text-2)' }}>Site load — live (W)</div>
            <div style={{ fontSize:'11px', fontFamily:'var(--font-mono)', color:'var(--emerald)' }}>
              {summary?.total_load_w||0}W
            </div>
          </div>
          <LoadChart data={loadHist} height={110}/>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontSize:'10px', color:'var(--text-3)' }}>
            <span>← 40 readings</span>
            <span>Now →</span>
          </div>
        </Card>

        {/* Alert feed */}
        <Card padding="14px">
          <div style={{ fontSize:'12px', fontWeight:500, color:'var(--text-2)', marginBottom:10 }}>Alerts</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {alerts.length === 0 ? (
              <div style={{ fontSize:'12px', color:'var(--text-3)', padding:'1rem 0' }}>All clear</div>
            ) : alerts.slice(0, 6).map((a, i) => (
              <div key={i} style={{ display:'flex', gap:7, fontSize:'11px' }}>
                <StatusDot status={a.severity==='critical'?'danger':'warning'}/>
                <div style={{ flex:1, color:'var(--text-2)', lineHeight:1.4 }}>{a.message || a.msg}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Meter grid */}
      <Card padding="14px">
        <div style={{ fontSize:'12px', fontWeight:500, color:'var(--text-2)', marginBottom:10 }}>
          Live meter feed
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,minmax(0,1fr))', gap:8 }}>
          {meterList.length === 0 ? (
            <div style={{ gridColumn:'span 5', padding:'1.5rem 0', textAlign:'center', fontSize:'12px', color:'var(--text-3)' }}>
              Start simulator to see live meter data
            </div>
          ) : meterList.map(m => <MeterTile key={m.meter_id} meter={m}/>)}
        </div>
      </Card>
    </div>
  );
}
