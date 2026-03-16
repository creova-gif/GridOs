import { CheckCircle2, Circle } from 'lucide-react';

export default function Fintech() {
  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-head)', color: 'var(--text-primary)' }}>
          Fintech
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          RBF grants · Carbon credits · MFI lending · Blended finance
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Est. RBF grant', value: '$48,000', sub: 'Eligible now', accent: 'var(--brand-emerald)', accentBar: true },
          { label: 'Carbon YTD', value: '$1,040', sub: 'Gold Standard', accent: 'var(--brand-emerald)', accentBar: true },
          { label: 'MFI portfolio', value: '10', sub: 'avg 72/100', accent: 'var(--text-primary)', accentBar: false },
          { label: 'Receivables ARR', value: '$6,240', sub: 'DFI eligible', accent: 'var(--brand-emerald)', accentBar: true },
        ].map((c) => (
          <div 
            key={c.label} 
            className="rounded-lg border p-4 relative overflow-hidden"
            style={{ 
              backgroundColor: 'var(--bg-card)', 
              borderColor: 'var(--bg-border-subtle)' 
            }}
          >
            {c.accentBar && (
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: c.accent }} />
            )}
            <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-faint)' }}>
              {c.label}
            </div>
            <div 
              className="text-2xl font-semibold mb-1" 
              style={{ fontFamily: 'var(--font-mono)', color: c.accent }}
            >
              {c.value}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-faint)' }}>
              {c.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Row 1: RBF Tracker + Carbon Revenue */}
      <div className="grid grid-cols-2 gap-4">
        {/* RBF Milestone Tracker */}
        <div 
          className="rounded-lg border p-5"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            borderColor: 'var(--bg-border-subtle)' 
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              RBF milestone tracker
            </div>
            <span 
              className="text-xs font-semibold px-2 py-1 rounded"
              style={{ 
                backgroundColor: 'var(--brand-dim)', 
                color: 'var(--brand-emerald)',
                border: '1px solid var(--brand-glow)'
              }}
            >
              ELIGIBLE
            </span>
          </div>

          <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-emerald)' }}>
            $48,000
          </div>
          <div className="text-xs mb-4" style={{ color: 'var(--text-faint)' }}>
            REA Tanzania · $400/connection · World Bank RBF
          </div>

          <div className="space-y-3">
            {[
              { done: true, label: '120 verified connections', value: '120/50' },
              { done: true, label: '78% collection rate', value: '78/70%' },
              { done: true, label: 'LOIS/EWURA registered', value: 'Done' },
              { done: true, label: 'Smart meter data available', value: 'Done' },
              { done: false, label: 'Q3 report submitted', value: 'Due Sep 30' },
            ].map((milestone, i) => (
              <div key={i} className="flex items-center gap-3">
                <div 
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: milestone.done ? 'var(--brand-dim)' : 'var(--bg-elevated)',
                    border: `1px solid ${milestone.done ? 'var(--brand-glow)' : 'var(--bg-border-mid)'}`,
                    color: milestone.done ? 'var(--brand-emerald)' : 'var(--text-faint)'
                  }}
                >
                  {milestone.done ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <Circle className="w-3 h-3" />
                  )}
                </div>
                <span 
                  className="flex-1 text-xs"
                  style={{ color: milestone.done ? 'var(--text-muted)' : 'var(--text-faint)' }}
                >
                  {milestone.label}
                </span>
                <span 
                  className="text-xs font-medium"
                  style={{ 
                    fontFamily: 'var(--font-mono)', 
                    color: milestone.done ? 'var(--brand-emerald)' : 'var(--status-warn)' 
                  }}
                >
                  {milestone.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Carbon Revenue */}
        <div 
          className="rounded-lg border p-5"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            borderColor: 'var(--bg-border-subtle)' 
          }}
        >
          <div className="text-sm font-medium mb-4" style={{ color: 'var(--text-muted)' }}>
            Carbon revenue — year to date
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'OTC Africa', value: '$240', rate: '$3/tCO2e', color: 'var(--brand-emerald)' },
              { label: 'Gold Standard', value: '$1,040', rate: '$13/tCO2e', color: 'var(--brand-emerald)' },
              { label: 'Compliance', value: '$2,000', rate: '$25/tCO2e', color: 'var(--text-muted)' },
            ].map((tier) => (
              <div 
                key={tier.label}
                className="rounded-lg p-3 text-center"
                style={{ backgroundColor: 'var(--bg-surface)' }}
              >
                <div className="text-xs mb-1" style={{ color: 'var(--text-faint)' }}>
                  {tier.label}
                </div>
                <div 
                  className="text-xl font-bold mb-1" 
                  style={{ fontFamily: 'var(--font-mono)', color: tier.color }}
                >
                  {tier.value}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-faint)' }}>
                  {tier.rate}
                </div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-faint)' }}>
              <span>80 tCO2e of 180 projected</span>
              <span style={{ color: 'var(--brand-emerald)' }}>44%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-elevated)' }}>
              <div 
                className="h-full rounded-full transition-all"
                style={{ width: '44%', backgroundColor: 'var(--brand-emerald)' }}
              />
            </div>
          </div>

          <div className="text-xs" style={{ color: 'var(--text-faint)' }}>
            Registry: pending · Apply at verra.org
          </div>
        </div>
      </div>

      {/* Row 2: Blended Finance Calculator + MFI Portfolio */}
      <div className="grid grid-cols-2 gap-4">
        {/* Blended Finance Calculator */}
        <div 
          className="rounded-lg border p-5"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            borderColor: 'var(--bg-border-subtle)' 
          }}
        >
          <div className="text-sm font-medium mb-4" style={{ color: 'var(--text-muted)' }}>
            Blended finance calculator
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-faint)' }}>
                Capacity (kW)
              </label>
              <input 
                type="text" 
                defaultValue="50"
                className="w-full rounded-lg px-3 py-2 text-sm border"
                style={{ 
                  backgroundColor: 'var(--bg-surface)', 
                  borderColor: 'var(--bg-border-mid)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-faint)' }}>
                Connections
              </label>
              <input 
                type="text" 
                defaultValue="300"
                className="w-full rounded-lg px-3 py-2 text-sm border"
                style={{ 
                  backgroundColor: 'var(--bg-surface)', 
                  borderColor: 'var(--bg-border-mid)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>

          {/* Waterfall bars */}
          <div className="space-y-2 mb-3">
            {[
              { label: 'RBF grant (27%)', value: '$48,000', percent: 27, color: 'var(--brand-emerald)' },
              { label: 'Equity (25%)', value: '$45,000', percent: 25, color: 'var(--status-info)' },
              { label: 'DFI conc. debt (48%)', value: '$87,000', percent: 48, color: 'var(--text-dim)' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: item.color }}>{item.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: item.color }}>{item.value}</span>
                </div>
                <div className="h-3 rounded overflow-hidden" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                  <div 
                    className="h-full rounded transition-all"
                    style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div 
            className="flex justify-between text-xs pt-3"
            style={{ borderTop: '1px solid var(--bg-border-subtle)' }}
          >
            <span style={{ color: 'var(--text-faint)' }}>DSCR · Bankable</span>
            <span 
              className="font-semibold"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-emerald)' }}
            >
              1.62× · Yes
            </span>
          </div>
        </div>

        {/* MFI Lending Portfolio */}
        <div 
          className="rounded-lg border p-5"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            borderColor: 'var(--bg-border-subtle)' 
          }}
        >
          <div className="text-sm font-medium mb-4" style={{ color: 'var(--text-muted)' }}>
            MFI lending portfolio
          </div>

          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: 'Excellent', value: '4', color: 'var(--brand-emerald)' },
              { label: 'Good', value: '3', color: 'var(--status-info)' },
              { label: 'Fair', value: '2', color: 'var(--status-warn)' },
              { label: 'Poor', value: '1', color: 'var(--status-danger)' },
            ].map((item) => (
              <div 
                key={item.label}
                className="rounded-lg p-3 text-center"
                style={{ backgroundColor: 'var(--bg-surface)' }}
              >
                <div className="text-xs mb-1" style={{ color: 'var(--text-faint)' }}>
                  {item.label}
                </div>
                <div 
                  className="text-xl font-bold" 
                  style={{ fontFamily: 'var(--font-mono)', color: item.color }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            Avg: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>72/100</span> · TZS 95,000 recommended
          </div>
          <div className="text-xs mb-3" style={{ color: 'var(--text-faint)' }}>
            Partners: Jumo · Branch · FINCA Tanzania
          </div>

          <button 
            className="w-full px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
            style={{ 
              backgroundColor: 'transparent',
              borderColor: 'var(--bg-border-mid)',
              color: 'var(--text-muted)'
            }}
          >
            Export JSON ↓
          </button>
        </div>
      </div>
    </div>
  );
}
