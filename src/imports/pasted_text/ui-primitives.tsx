// GridOS — Shared UI Primitives
// Used across every page. Consistent, refined, zero bloat.

import { useState, useEffect, useRef } from 'react';

// ─── Badge ────────────────────────────────────────────────────
export function Badge({ children, variant = 'default', size = 'sm' }) {
  const variants = {
    success:  { bg:'var(--emerald-dim)', color:'var(--emerald)',   border:'rgba(16,185,129,.2)' },
    warning:  { bg:'var(--amber-dim)',   color:'var(--amber)',     border:'rgba(245,158,11,.2)' },
    danger:   { bg:'var(--red-dim)',     color:'var(--red)',       border:'rgba(239,68,68,.2)'  },
    info:     { bg:'var(--blue-dim)',    color:'var(--blue)',      border:'rgba(59,130,246,.2)' },
    default:  { bg:'var(--bg-surface)',  color:'var(--text-2)',    border:'var(--border-mid)'   },
  };
  const v = variants[variant] || variants.default;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:'4px',
      padding: size === 'xs' ? '2px 6px' : '3px 8px',
      fontSize: size === 'xs' ? '10px' : '11px',
      fontWeight:500, fontFamily:'var(--font-body)',
      background:v.bg, color:v.color,
      border:`1px solid ${v.border}`,
      borderRadius:'var(--radius-pill)',
      letterSpacing:'.02em', lineHeight:1.4,
      whiteSpace:'nowrap',
    }}>
      {children}
    </span>
  );
}

// ─── Status dot ───────────────────────────────────────────────
export function StatusDot({ status, pulse = false }) {
  const colors = { active:'var(--emerald)', warning:'var(--amber)', danger:'var(--red)', offline:'var(--text-3)' };
  return (
    <span style={{
      display:'inline-block', width:7, height:7, borderRadius:'50%',
      background: colors[status] || colors.offline, flexShrink:0,
      animation: pulse && status === 'active' ? 'pulse-dot 2s infinite' : 'none',
    }}/>
  );
}

// ─── Card ─────────────────────────────────────────────────────
export function Card({ children, padding = '16px', style = {}, onClick, hover = false }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
      style={{
        background: hovered ? 'var(--bg-elevated)' : 'var(--bg-card)',
        border:`1px solid ${hovered ? 'var(--border-mid)' : 'var(--border)'}`,
        borderRadius:'var(--radius-lg)', padding,
        transition:'all var(--dur-fast) var(--ease)',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}>
      {children}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────
export function Stat({ label, value, sub, trend, color = 'var(--text-1)', icon }) {
  return (
    <Card padding="14px 16px">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ fontSize:'11px', color:'var(--text-3)', fontWeight:500, letterSpacing:'.04em', textTransform:'uppercase', marginBottom:8 }}>{label}</div>
        {icon && <span style={{ fontSize:16, opacity:.6 }}>{icon}</span>}
      </div>
      <div style={{ fontSize:'26px', fontWeight:600, fontFamily:'var(--font-mono)', color, lineHeight:1, marginBottom:4 }}>
        {value ?? '—'}
      </div>
      {(sub || trend) && (
        <div style={{ fontSize:'11px', color:'var(--text-3)', display:'flex', alignItems:'center', gap:6, marginTop:6 }}>
          {trend && (
            <span style={{ color: trend > 0 ? 'var(--emerald)' : 'var(--red)', fontWeight:500 }}>
              {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}%
            </span>
          )}
          {sub && <span>{sub}</span>}
        </div>
      )}
    </Card>
  );
}

// ─── Section header ───────────────────────────────────────────
export function SectionHeader({ title, sub, actions }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem' }}>
      <div>
        <h1 style={{ fontFamily:'var(--font-head)', fontSize:'20px', fontWeight:600, color:'var(--text-1)', letterSpacing:'-.02em' }}>{title}</h1>
        {sub && <p style={{ fontSize:'12px', color:'var(--text-3)', marginTop:3 }}>{sub}</p>}
      </div>
      {actions && <div style={{ display:'flex', gap:8 }}>{actions}</div>}
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────
export function Table({ columns, rows, onRow, emptyMessage = 'No data' }) {
  return (
    <div style={{ border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
        <thead>
          <tr style={{ background:'var(--bg-surface)' }}>
            {columns.map(c => (
              <th key={c.key} style={{
                textAlign:'left', padding:'9px 14px',
                fontSize:'10px', fontWeight:500, color:'var(--text-3)',
                letterSpacing:'.06em', textTransform:'uppercase',
                borderBottom:'1px solid var(--border)',
                width: c.w || 'auto',
              }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length} style={{ padding:'2.5rem', textAlign:'center', color:'var(--text-3)', fontSize:'13px' }}>{emptyMessage}</td></tr>
          ) : rows.map((row, i) => (
            <tr key={i}
              onClick={() => onRow?.(row)}
              style={{
                borderBottom:'1px solid var(--border)',
                cursor: onRow ? 'pointer' : 'default',
                transition:'background var(--dur-fast)',
              }}
              onMouseEnter={e => onRow && (e.currentTarget.style.background = 'var(--bg-surface)')}
              onMouseLeave={e => (e.currentTarget.style.background = '')}>
              {columns.map(c => (
                <td key={c.key} style={{ padding:'10px 14px', color:'var(--text-2)', verticalAlign:'middle' }}>
                  {c.render ? c.render(row[c.key], row) : row[c.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────
export function ProgressBar({ value, max = 100, color = 'var(--emerald)', height = 4, label }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      {label && <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', color:'var(--text-3)', marginBottom:4 }}>
        <span>{label}</span><span>{pct}%</span>
      </div>}
      <div style={{ height, background:'var(--bg-surface)', borderRadius:99, overflow:'hidden', border:'1px solid var(--border)' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:99, transition:'width .4s var(--ease)' }}/>
      </div>
    </div>
  );
}

// ─── Health ring ──────────────────────────────────────────────
export function HealthRing({ score = 0, size = 52 }) {
  const r = (size / 2) - 5;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 85 ? 'var(--emerald)' : score >= 60 ? 'var(--amber)' : 'var(--red)';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform:'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-surface)" strokeWidth="3.5"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="3.5"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition:'stroke-dasharray .5s var(--ease)' }}/>
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        style={{ transform:`rotate(90deg) translate(0, -${size/2}px)`,
                 transformOrigin:`${size/2}px ${size/2}px`,
                 fontSize:'11px', fontWeight:600, fontFamily:'var(--font-mono)',
                 fill:color }}>
        {score}
      </text>
    </svg>
  );
}

// ─── Spinner ──────────────────────────────────────────────────
export function Spinner({ size = 18 }) {
  return (
    <div style={{ width:size, height:size, border:`2px solid var(--border-mid)`,
      borderTopColor:'var(--emerald)', borderRadius:'50%',
      animation:'spin .7s linear infinite' }}/>
  );
}

// ─── Empty state ──────────────────────────────────────────────
export function EmptyState({ icon = '◎', title, body, action }) {
  return (
    <div style={{ padding:'3rem 2rem', textAlign:'center' }}>
      <div style={{ fontSize:'32px', opacity:.3, marginBottom:'1rem' }}>{icon}</div>
      <div style={{ fontSize:'14px', fontWeight:500, color:'var(--text-2)', marginBottom:6 }}>{title}</div>
      {body && <div style={{ fontSize:'12px', color:'var(--text-3)', marginBottom:'1rem', maxWidth:280, margin:'0 auto 1rem' }}>{body}</div>}
      {action}
    </div>
  );
}

// ─── Button ───────────────────────────────────────────────────
export function Btn({ children, onClick, variant='default', size='md', disabled, loading, full }) {
  const styles = {
    primary:  { bg:'var(--emerald)',     color:'#000',          border:'transparent' },
    danger:   { bg:'var(--red-dim)',     color:'var(--red)',    border:'rgba(239,68,68,.2)' },
    ghost:    { bg:'transparent',        color:'var(--text-2)', border:'var(--border-mid)' },
    default:  { bg:'var(--bg-surface)',  color:'var(--text-1)', border:'var(--border-mid)' },
  };
  const s = styles[variant] || styles.default;
  const pad = size === 'sm' ? '5px 12px' : size === 'lg' ? '11px 22px' : '7px 16px';
  return (
    <button onClick={onClick} disabled={disabled || loading}
      style={{
        display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6,
        padding:pad, fontSize: size === 'sm' ? '11px' : '13px', fontWeight:500,
        background:s.bg, color:s.color, border:`1px solid ${s.border}`,
        borderRadius:'var(--radius)', width: full ? '100%' : 'auto',
        opacity: disabled || loading ? .5 : 1,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
      }}>
      {loading ? <Spinner size={12}/> : children}
    </button>
  );
}

// ─── Animated number ──────────────────────────────────────────
export function AnimNum({ value, prefix='', suffix='', decimals=0 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const target = parseFloat(value) || 0;
    const start = display;
    const steps = 24;
    let step = 0;
    clearInterval(ref.current);
    ref.current = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (target - start) * eased);
      if (step >= steps) clearInterval(ref.current);
    }, 16);
    return () => clearInterval(ref.current);
  }, [value]);
  return <>{prefix}{display.toFixed(decimals)}{suffix}</>;
}

// ─── Inline sparkline ─────────────────────────────────────────
export function Sparkline({ data = [], width = 80, height = 28, color = 'var(--emerald)' }) {
  if (!data.length) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 2) - 1;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display:'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}
