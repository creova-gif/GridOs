import { useMemo } from 'react';

// Mock data - replace with real API data from getSiteAnalytics()
const generateRevenueData = () => 
  ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => ({
    day,
    revenue: Math.round(80000 + Math.random() * 60000),
  }));

export default function Analytics() {
  // Use useMemo to prevent data regeneration on every render
  const MOCK_REVENUE = useMemo(() => generateRevenueData(), []);
  
  // Calculate max for scaling
  const maxRevenue = Math.max(...MOCK_REVENUE.map(d => d.revenue));

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-head)', color: 'var(--text-primary)' }}>
          Analytics
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Revenue · energy · collection — Ukerewe
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'ARPU / month', value: 'TZS 18,400', accent: 'var(--brand-emerald)' },
          { label: 'Collection rate', value: '78%', sub: '▲ 3%', accent: 'var(--brand-emerald)' },
          { label: 'Energy efficiency', value: '94.5%', accent: 'var(--text-primary)' },
          { label: 'Revenue / month', value: 'TZS 1.3M', accent: 'var(--brand-emerald)' },
        ].map((c) => (
          <div 
            key={c.label} 
            className="rounded-lg border p-4"
            style={{ 
              backgroundColor: 'var(--bg-card)', 
              borderColor: 'var(--bg-border-subtle)' 
            }}
          >
            <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-faint)' }}>
              {c.label}
            </div>
            <div 
              className="text-2xl font-semibold mb-1" 
              style={{ fontFamily: 'var(--font-mono)', color: c.accent }}
            >
              {c.value}
            </div>
            {c.sub && (
              <div className="text-xs font-medium" style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-emerald)' }}>
                {c.sub}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Revenue Chart */}
        <div 
          className="rounded-lg border p-5"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            borderColor: 'var(--bg-border-subtle)' 
          }}
        >
          <div className="text-sm font-medium mb-4" style={{ color: 'var(--text-muted)' }}>
            Daily revenue — last 7 days (TZS)
          </div>
          
          {/* Custom bar chart */}
          <div className="relative h-[160px] flex items-end gap-2 px-2">
            {MOCK_REVENUE.map((item, index) => {
              const heightPercent = (item.revenue / maxRevenue) * 100;
              
              return (
                <div key={`bar-${item.day}-${index}`} className="flex-1 flex flex-col items-center gap-2 h-full">
                  {/* Bar */}
                  <div className="w-full flex flex-col justify-end flex-1 relative group">
                    <div 
                      className="w-full rounded-t transition-all"
                      style={{ 
                        height: `${heightPercent}%`,
                        backgroundColor: 'var(--brand-emerald)',
                        minHeight: '2px'
                      }}
                    >
                      {/* Tooltip on hover */}
                      <div 
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                        style={{ 
                          backgroundColor: 'var(--bg-card)', 
                          borderColor: 'var(--bg-border-mid)',
                          border: '1px solid'
                        }}
                      >
                        TZS {item.revenue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Label */}
                  <div className="text-xs flex-shrink-0" style={{ color: 'var(--text-faint)' }}>{item.day}</div>
                </div>
              );
            })}
          </div>
          
          {/* Y-axis labels */}
          <div className="flex justify-between text-xs mt-2 px-2" style={{ color: 'var(--text-faint)' }}>
            <span>0</span>
            <span>{(maxRevenue / 1000).toFixed(0)}K</span>
          </div>
        </div>

        {/* By Customer Type Card */}
        <div 
          className="rounded-lg border p-5"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            borderColor: 'var(--bg-border-subtle)' 
          }}
        >
          <div className="text-sm font-medium mb-4" style={{ color: 'var(--text-muted)' }}>
            By customer type
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Residential (4)', value: 'TZS 420K', color: 'var(--text-primary)' },
              { label: 'Business (4)', value: 'TZS 624K', color: 'var(--status-info)' },
              { label: 'Productive (2)', value: 'TZS 728K', color: 'var(--status-warn)' },
              { label: 'Total / month', value: 'TZS 1.3M', color: 'var(--brand-emerald)' },
            ].map((item) => (
              <div 
                key={item.label}
                className="rounded-lg p-3"
                style={{ backgroundColor: 'var(--bg-surface)' }}
              >
                <div className="text-xs mb-1" style={{ color: 'var(--text-faint)' }}>
                  {item.label}
                </div>
                <div 
                  className="text-lg font-semibold" 
                  style={{ fontFamily: 'var(--font-mono)', color: item.color }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}