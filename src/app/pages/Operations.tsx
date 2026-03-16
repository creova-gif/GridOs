import { AlertTriangle, Activity, Wrench, Users } from 'lucide-react';

export default function Operations() {
  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-head)', color: 'var(--text-primary)' }}>
          Operations
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Anomaly · Maintenance · Regulatory · SDG7
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { 
            label: 'Anomalies (24h)', 
            value: '3', 
            sub: '1 critical', 
            accent: 'var(--status-danger)', 
            accentBar: true 
          },
          { 
            label: 'Season demand', 
            value: '+18%', 
            sub: 'Harvest peak', 
            accent: 'var(--status-warn)', 
            accentBar: true 
          },
          { 
            label: 'Urgent tasks', 
            value: '2', 
            sub: 'Maintenance due', 
            accent: 'var(--status-danger)', 
            accentBar: true 
          },
          { 
            label: 'People reached', 
            value: '504', 
            sub: 'SDG7 Tier 3', 
            accent: 'var(--brand-emerald)', 
            accentBar: true 
          },
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

      {/* Row 1: Anomaly Feed + Agricultural Intelligence */}
      <div className="grid grid-cols-2 gap-4">
        {/* Anomaly Feed */}
        <div 
          className="rounded-lg border p-5"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            borderColor: 'var(--bg-border-subtle)' 
          }}
        >
          <div className="text-sm font-medium mb-4" style={{ color: 'var(--text-muted)' }}>
            Anomaly feed — live
          </div>

          <div className="space-y-4">
            {[
              {
                severity: 'critical',
                color: 'var(--status-danger)',
                title: 'Tamper event — MTR-004',
                description: 'Baraka Fishing Co · probability 99%',
                action: 'Send field agent immediately',
                time: '17:55'
              },
              {
                severity: 'warning',
                color: 'var(--status-warn)',
                title: 'Consumption spike — MTR-006',
                description: '195W vs expected 130W (+50%) · 94%',
                time: '16:22'
              },
              {
                severity: 'warning',
                color: 'var(--status-warn)',
                title: 'Reading gap — MTR-009',
                description: '8/24 readings received · 87%',
                time: '14:11'
              },
            ].map((alert, i) => (
              <div key={i} className="flex gap-3 pb-4 border-b" style={{ borderColor: 'var(--bg-border-subtle)' }}>
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                  style={{ backgroundColor: alert.color }}
                />
                <div className="flex-1">
                  <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                    {alert.title}
                  </div>
                  <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                    {alert.description}
                  </div>
                  {alert.action && (
                    <div className="text-xs" style={{ color: 'var(--text-faint)' }}>
                      {alert.action}
                    </div>
                  )}
                </div>
                <div 
                  className="text-xs flex-shrink-0 pt-0.5"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}
                >
                  {alert.time}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agricultural Season Intelligence */}
        <div 
          className="rounded-lg border p-5"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            borderColor: 'var(--bg-border-subtle)' 
          }}
        >
          <div className="text-sm font-medium mb-4" style={{ color: 'var(--text-muted)' }}>
            Agricultural season intelligence
          </div>

          <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: 'var(--bg-surface)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4" style={{ color: 'var(--status-warn)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Harvest season detected
              </span>
            </div>
            <div className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
              Oct-Dec · Rice harvest peak · Ukerewe Island
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-faint)' }}>Demand increase:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--status-warn)' }}>+18%</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-faint)' }}>Peak hours:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>18:00-22:00</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-faint)' }}>Top-up frequency:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-emerald)' }}>+32%</span>
              </div>
            </div>
          </div>

          <div className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
            Historical comparison
          </div>
          <div className="h-24 flex items-end gap-1">
            {[65, 72, 88, 95, 82, 78, 118, 125, 115, 98, 85, 73].map((val, i) => {
              const isHighlighted = i >= 9;
              return (
                <div 
                  key={i}
                  className="flex-1 rounded-t transition-all"
                  style={{ 
                    height: `${val}%`,
                    backgroundColor: isHighlighted ? 'var(--status-warn)' : 'var(--bg-border-strong)',
                    opacity: isHighlighted ? 1 : 0.4
                  }}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs mt-2" style={{ color: 'var(--text-faint)' }}>
            <span>Jan</span>
            <span style={{ color: 'var(--status-warn)' }}>Oct-Dec (current)</span>
          </div>
        </div>
      </div>

      {/* Row 2: Maintenance Calendar + SDG7 Impact */}
      <div className="grid grid-cols-2 gap-4">
        {/* Maintenance Calendar */}
        <div 
          className="rounded-lg border p-5"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            borderColor: 'var(--bg-border-subtle)' 
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Maintenance calendar
            </div>
            <span 
              className="text-xs font-semibold px-2 py-1 rounded"
              style={{ 
                backgroundColor: 'rgba(255,77,79,.08)', 
                color: 'var(--status-danger)',
                border: '1px solid rgba(255,77,79,.2)'
              }}
            >
              2 URGENT
            </span>
          </div>

          <div className="space-y-3">
            {[
              {
                task: 'Battery bank inspection',
                due: 'Overdue 3 days',
                status: 'urgent',
                color: 'var(--status-danger)'
              },
              {
                task: 'PV panel cleaning',
                due: 'Due tomorrow',
                status: 'urgent',
                color: 'var(--status-danger)'
              },
              {
                task: 'Generator service (500h)',
                due: 'Due in 5 days',
                status: 'warning',
                color: 'var(--status-warn)'
              },
              {
                task: 'Inverter firmware update',
                due: 'Due in 12 days',
                status: 'normal',
                color: 'var(--text-muted)'
              },
              {
                task: 'Distribution line inspection',
                due: 'Due in 18 days',
                status: 'normal',
                color: 'var(--text-muted)'
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-3 pb-3 border-b" style={{ borderColor: 'var(--bg-border-subtle)' }}>
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1">
                  <div className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-primary)' }}>
                    {item.task}
                  </div>
                </div>
                <div 
                  className="text-xs flex-shrink-0"
                  style={{ fontFamily: 'var(--font-mono)', color: item.color }}
                >
                  {item.due}
                </div>
              </div>
            ))}
          </div>

          <button 
            className="w-full mt-4 px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
            style={{ 
              backgroundColor: 'var(--status-danger)',
              borderColor: 'transparent',
              color: '#ffffff'
            }}
          >
            Schedule urgent maintenance
          </button>
        </div>

        {/* SDG7 Impact Tracker */}
        <div 
          className="rounded-lg border p-5"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            borderColor: 'var(--bg-border-subtle)' 
          }}
        >
          <div className="text-sm font-medium mb-4" style={{ color: 'var(--text-muted)' }}>
            SDG7 impact tracker
          </div>

          <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-emerald)' }}>
            504
          </div>
          <div className="text-xs mb-4" style={{ color: 'var(--text-faint)' }}>
            People with access to Tier 3 electricity
          </div>

          {/* Tier breakdown */}
          <div className="space-y-3 mb-4">
            {[
              { tier: 'Tier 3', desc: 'High reliability (>22h/day)', count: 504, percent: 100, color: 'var(--brand-emerald)' },
              { tier: 'Tier 2', desc: 'Medium (16-22h/day)', count: 0, percent: 0, color: 'var(--status-info)' },
              { tier: 'Tier 1', desc: 'Basic (<16h/day)', count: 0, percent: 0, color: 'var(--status-warn)' },
            ].map((item) => (
              <div key={item.tier}>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: 'var(--text-muted)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{item.tier}</strong> — {item.desc}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: item.color }}>
                    {item.count}
                  </span>
                </div>
                <div className="h-2 rounded overflow-hidden" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                  <div 
                    className="h-full rounded transition-all"
                    style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Additional metrics */}
          <div 
            className="rounded-lg p-3 space-y-2"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <div className="flex justify-between text-xs">
              <span style={{ color: 'var(--text-faint)' }}>Households:</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>126</span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: 'var(--text-faint)' }}>Productive users:</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-emerald)' }}>18</span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: 'var(--text-faint)' }}>Women-owned businesses:</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-emerald)' }}>7</span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: 'var(--text-faint)' }}>Avg consumption:</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>38 kWh/mo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
