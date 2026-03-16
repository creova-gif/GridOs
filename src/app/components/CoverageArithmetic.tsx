// GridOS — Coverage Arithmetic Visualizer
// Shows the gap-filling logic: 98% GSM → 22% data → 18% smartphone

import { Smartphone, Wifi, Signal, Users } from 'lucide-react';

export default function CoverageArithmetic() {
  const layers = [
    {
      label: 'GSM Coverage',
      percentage: 98,
      icon: Signal,
      color: 'var(--brand-emerald)',
      description: 'Basic mobile network',
      audience: 'All customers with any phone'
    },
    {
      label: 'Data Coverage',
      percentage: 22,
      icon: Wifi,
      color: 'var(--status-info)',
      description: 'Mobile internet',
      audience: 'Customers in town centers'
    },
    {
      label: 'Smartphone Ownership',
      percentage: 18,
      icon: Smartphone,
      color: 'var(--status-warn)',
      description: 'Android/iOS devices',
      audience: 'Urban & wealthy customers'
    }
  ];

  const channels = [
    {
      name: 'USSD Portal',
      code: '*150*00#',
      coverage: '80%',
      gap: 'GSM → Smartphone gap',
      color: 'var(--brand-emerald)',
      features: ['Basic phone only', 'Zero data cost', 'Kiswahili menus', '24/7 automated']
    },
    {
      name: 'Agent App',
      coverage: '2% + Cash',
      gap: 'No phone + all payments',
      color: 'var(--status-info)',
      features: ['100% offline', 'Cash handling', 'Motorcycle agents', 'Photo + GPS proof']
    }
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          Coverage Arithmetic
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Why both USSD and Agent App exist — the gap-filling math
        </p>
      </div>

      {/* Layer visualization */}
      <div className="space-y-4">
        {layers.map((layer, index) => {
          const Icon = layer.icon;
          return (
            <div key={index} className="space-y-2">
              {/* Label row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" style={{ color: layer.color }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {layer.label}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {layer.description}
                  </span>
                </div>
                <span className="font-mono text-sm font-semibold" style={{ color: layer.color }}>
                  {layer.percentage}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="relative h-8 rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)' }}>
                <div 
                  className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500"
                  style={{ 
                    width: `${layer.percentage}%`,
                    backgroundColor: layer.color,
                    opacity: 0.2
                  }}
                />
                <div 
                  className="absolute inset-y-0 left-0"
                  style={{ 
                    width: `${layer.percentage}%`,
                    borderRight: `2px solid ${layer.color}`
                  }}
                />
                {/* Audience label inside bar */}
                <div className="absolute inset-0 flex items-center px-3">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {layer.audience}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Gap indicators */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: 'var(--bg-border-subtle)' }}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--brand-emerald)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              80% gap filled
            </span>
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            GSM (98%) → Smartphone (18%) = <strong>80% gap</strong>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--status-info)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              2% + cash
            </span>
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            No phone at all <strong>+ all cash payments</strong>
          </div>
        </div>
      </div>

      {/* Channel cards */}
      <div className="grid grid-cols-2 gap-4">
        {channels.map((channel, index) => (
          <div 
            key={index}
            className="rounded-lg border p-4 space-y-3"
            style={{ 
              backgroundColor: 'var(--bg-card)',
              borderColor: channel.color
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {channel.name}
                </div>
                {channel.code && (
                  <div className="font-mono text-xs mt-1" style={{ color: channel.color }}>
                    {channel.code}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="font-mono text-lg font-bold" style={{ color: channel.color }}>
                  {channel.coverage}
                </div>
              </div>
            </div>

            {/* Gap filled */}
            <div className="text-xs px-2 py-1 rounded" style={{ 
              backgroundColor: `${channel.color}15`,
              color: channel.color
            }}>
              Fills: {channel.gap}
            </div>

            {/* Features */}
            <div className="space-y-1">
              {channel.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: 'var(--text-muted)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom summary */}
      <div className="rounded-lg p-4 border" style={{ 
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--brand-emerald)'
      }}>
        <div className="flex items-start gap-3">
          <Users className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--brand-emerald)' }} />
          <div>
            <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Result: 100% customer coverage
            </div>
            <div className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              <strong>USSD</strong> covers the 80% who have GSM but no smartphone. <strong>Agent App</strong> covers the 2% with no phone + handles all cash payments (USSD can't). Together: zero customers fall through the gap.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
