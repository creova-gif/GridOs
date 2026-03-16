import { Database, Server, Smartphone, Zap, CreditCard } from 'lucide-react';

export function AgentAppArchitecture() {
  return (
    <div className="p-6 rounded-lg border space-y-6" style={{
      backgroundColor: 'var(--bg-card)',
      borderColor: 'var(--bg-border-subtle)'
    }}>
      <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
        System Architecture
      </h3>

      <div className="space-y-4">
        {/* Layer 1: Mobile App */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{
            backgroundColor: 'var(--brand-dim)',
            color: 'var(--brand-emerald)'
          }}>
            <Smartphone className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              Agent Mobile App
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              React Native · Offline-first · SQLite cache
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="text-2xl" style={{ color: 'var(--text-faint)' }}>↓</div>
        </div>

        {/* Layer 2: Backend API */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{
            backgroundColor: 'var(--brand-dim)',
            color: 'var(--brand-emerald)'
          }}>
            <Server className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              Supabase Edge Functions
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Hono · Deno · REST API
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="text-2xl" style={{ color: 'var(--text-faint)' }}>↓</div>
        </div>

        {/* Layer 3: Database */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{
            backgroundColor: 'var(--brand-dim)',
            color: 'var(--brand-emerald)'
          }}>
            <Database className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              Key-Value Store
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Customer data · Transactions · Tokens
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t my-4" style={{ borderColor: 'var(--bg-border-subtle)' }}></div>

        {/* Features */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
            Key Features
          </div>
          
          <div className="flex items-start gap-2 text-sm">
            <CreditCard className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--brand-emerald)' }} />
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>Cash Collection</strong>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Accept cash, M-Pesa, Airtel Money
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 text-sm">
            <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--brand-emerald)' }} />
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>STS Token Generation</strong>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                20-digit prepaid electricity tokens
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
