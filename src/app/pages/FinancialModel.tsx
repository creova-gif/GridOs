import { DollarSign, TrendingUp, Users, Target, Zap, Database, MessageSquare, Shield } from 'lucide-react';

export default function FinancialModel() {
  // Pricing Tiers
  const pricingTiers = [
    { name: 'Starter', meters: 'up to 100', price: 150, description: 'Competitive vs SparkMeter $0.21-0.83/m/mo' },
    { name: 'Growth', meters: '100-500', price: 350, description: 'Volume discount applied' },
    { name: 'Scale', meters: '500+', price: 800, description: 'Enterprise tier' }
  ];

  // Revenue Streams
  const revenueStreams = [
    { name: 'RBF Facilitation (REA Tanzania)', value: 400, description: '$400/connection × avg connections/operator' },
    { name: 'Carbon Credits', value: 45, description: 'OTC $3 → Gold Standard $13 → Compliance $25/tCO2e' },
    { name: 'MFI Credit Score API', value: 12, description: '$0.10-0.50/score × avg 80 scores/op/mo' }
  ];

  // COGS
  const cogs = [
    { name: 'Infrastructure (Supabase + HiveMQ + Railway)', value: 8, description: 'Pro plans prorated per operator' },
    { name: 'SMS / Africa\'s Talking', value: 6, description: '$0.007/SMS × ~850 messages/op/mo' },
    { name: 'Customer Support', value: 15, description: '1 support hire per 40 operators' }
  ];

  // Assumptions
  const assumptions = {
    churn: '0.6%',
    planMix: '70% / 25% / 5%',
    cac: 200,
    fixedOverheads: 800,
    preSeedRaise: 350000,
    runway: 18
  };

  // Calculate metrics
  const avgRevenuePerOperator = (
    (pricingTiers[0].price * 0.70) + 
    (pricingTiers[1].price * 0.25) + 
    (pricingTiers[2].price * 0.05) +
    revenueStreams.reduce((sum, stream) => sum + stream.value, 0)
  );

  const totalCOGS = cogs.reduce((sum, cost) => sum + cost.value, 0);
  const grossMarginPerOperator = avgRevenuePerOperator - totalCOGS;
  const grossMarginPercent = (grossMarginPerOperator / avgRevenuePerOperator) * 100;

  // Calculate operators needed for profitability
  const breakEvenOperators = Math.ceil(assumptions.fixedOverheads / grossMarginPerOperator);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
          <DollarSign className="w-8 h-8" style={{ color: 'var(--brand-emerald)' }} />
          GridOS Financial Model — 3 Year Projections
        </h1>
        <p className="mt-2" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-body)' }}>
          Pre-seed raise targets · SaaS unit economics · Path to $100K ARR
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 rounded-lg border" style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--bg-border-subtle)'
        }}>
          <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-faint)' }}>
            Pre-Seed Raise
          </div>
          <div className="text-2xl font-bold mb-1" style={{ color: 'var(--brand-emerald)' }}>
            ${(assumptions.preSeedRaise / 1000).toFixed(0)}K
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Target close: Q2 2026
          </div>
        </div>

        <div className="p-6 rounded-lg border" style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--bg-border-subtle)'
        }}>
          <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-faint)' }}>
            Runway
          </div>
          <div className="text-2xl font-bold mb-1" style={{ color: 'var(--brand-emerald)' }}>
            {assumptions.runway} mo
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Reach $100K ARR before Series A
          </div>
        </div>

        <div className="p-6 rounded-lg border" style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--bg-border-subtle)'
        }}>
          <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-faint)' }}>
            Gross Margin
          </div>
          <div className="text-2xl font-bold mb-1" style={{ color: 'var(--brand-emerald)' }}>
            {grossMarginPercent.toFixed(1)}%
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            ${grossMarginPerOperator.toFixed(0)}/operator/mo
          </div>
        </div>

        <div className="p-6 rounded-lg border" style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--bg-border-subtle)'
        }}>
          <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-faint)' }}>
            Breakeven
          </div>
          <div className="text-2xl font-bold mb-1" style={{ color: 'var(--brand-emerald)' }}>
            {breakEvenOperators} ops
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            At {assumptions.churn}/mo churn
          </div>
        </div>
      </div>

      {/* Pricing Tiers */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Target className="w-5 h-5" style={{ color: 'var(--brand-emerald)' }} />
          Pricing Tiers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pricingTiers.map((tier, idx) => (
            <div
              key={tier.name}
              className="p-6 rounded-lg border-2"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: idx === 1 ? 'var(--brand-emerald)' : 'var(--bg-border-subtle)'
              }}
            >
              <div className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--brand-emerald)' }}>
                {tier.name}
              </div>
              <div className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                ${tier.price}
                <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>/mo</span>
              </div>
              <div className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                {tier.meters} meters
              </div>
              <div className="text-xs pt-3 border-t" style={{
                color: 'var(--text-faint)',
                borderColor: 'var(--bg-border-subtle)'
              }}>
                {tier.description}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--brand-dim)' }}>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Plan Mix:</strong> {assumptions.planMix} (Starter / Growth / Scale)
          </div>
        </div>
      </div>

      {/* Revenue Streams */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <TrendingUp className="w-5 h-5" style={{ color: 'var(--brand-emerald)' }} />
          Revenue Streams (per operator/month)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {revenueStreams.map((stream) => (
            <div
              key={stream.name}
              className="p-5 rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--bg-border-subtle)'
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {stream.name}
                </div>
                <div className="text-lg font-bold" style={{ color: 'var(--brand-emerald)' }}>
                  ${stream.value}
                </div>
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {stream.description}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 rounded-lg border" style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--bg-border-mid)'
        }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Total Avg Revenue per Operator
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                SaaS plan + additional revenue streams
              </div>
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--brand-emerald)' }}>
              ${avgRevenuePerOperator.toFixed(0)}/mo
            </div>
          </div>
        </div>
      </div>

      {/* Cost Structure */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* COGS */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Database className="w-5 h-5" style={{ color: 'var(--status-warn)' }} />
            COGS (per operator/month)
          </h2>
          <div className="space-y-3">
            {cogs.map((cost) => (
              <div
                key={cost.name}
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--bg-border-subtle)'
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="text-sm font-bold flex-1" style={{ color: 'var(--text-primary)' }}>
                    {cost.name}
                  </div>
                  <div className="text-lg font-bold" style={{ color: 'var(--status-warn)' }}>
                    ${cost.value}
                  </div>
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {cost.description}
                </div>
              </div>
            ))}
            <div className="p-4 rounded-lg border-2" style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--status-warn)'
            }}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  Total COGS
                </div>
                <div className="text-xl font-bold" style={{ color: 'var(--status-warn)' }}>
                  ${totalCOGS}/mo
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Costs */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Shield className="w-5 h-5" style={{ color: 'var(--status-info)' }} />
            Operating Metrics
          </h2>
          <div className="space-y-3">
            <div className="p-4 rounded-lg border" style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--bg-border-subtle)'
            }}>
              <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-faint)' }}>
                Monthly Churn Rate
              </div>
              <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                {assumptions.churn}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                0.6%/mo ≈ 7% annual — SaaS infra benchmark
              </div>
            </div>

            <div className="p-4 rounded-lg border" style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--bg-border-subtle)'
            }}>
              <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-faint)' }}>
                Customer Acquisition Cost
              </div>
              <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                ${assumptions.cac}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                BD lead time × hourly rate estimate
              </div>
            </div>

            <div className="p-4 rounded-lg border" style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--bg-border-subtle)'
            }}>
              <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-faint)' }}>
                Fixed Overheads
              </div>
              <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                ${assumptions.fixedOverheads}/mo
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Legal, tools, travel — Conservative until Series A
              </div>
            </div>

            <div className="p-4 rounded-lg border" style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--bg-border-subtle)'
            }}>
              <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-faint)' }}>
                LTV:CAC Ratio
              </div>
              <div className="text-2xl font-bold mb-1" style={{ color: 'var(--brand-emerald)' }}>
                {((avgRevenuePerOperator * 36) / assumptions.cac).toFixed(1)}x
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Assuming 36-month customer lifetime
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unit Economics Summary */}
      <div className="p-6 rounded-lg border-2" style={{
        backgroundColor: 'var(--brand-dim)',
        borderColor: 'var(--brand-emerald)'
      }}>
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Unit Economics Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>
              Avg Revenue
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--brand-emerald)' }}>
              ${avgRevenuePerOperator.toFixed(0)}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>
              Total COGS
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--status-warn)' }}>
              ${totalCOGS}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>
              Gross Margin
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--brand-emerald)' }}>
              {grossMarginPercent.toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>
              Breakeven Point
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {breakEvenOperators} ops
            </div>
          </div>
        </div>
      </div>

      {/* Growth Milestones */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Zap className="w-5 h-5" style={{ color: 'var(--brand-emerald)' }} />
          Growth Milestones
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-lg border" style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--bg-border-subtle)'
          }}>
            <div className="text-sm font-bold mb-2" style={{ color: 'var(--brand-emerald)' }}>
              Q2 2026 — Pre-Seed Close
            </div>
            <div className="text-xs space-y-1" style={{ color: 'var(--text-muted)' }}>
              <div>✓ $350K raised</div>
              <div>✓ 18-month runway secured</div>
              <div>✓ First 10 operators onboarded</div>
              <div>✓ MVP in production</div>
            </div>
          </div>

          <div className="p-5 rounded-lg border" style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--bg-border-subtle)'
          }}>
            <div className="text-sm font-bold mb-2" style={{ color: 'var(--brand-emerald)' }}>
              Q4 2026 — Product-Market Fit
            </div>
            <div className="text-xs space-y-1" style={{ color: 'var(--text-muted)' }}>
              <div>→ 25 operators ({breakEvenOperators}+ breakeven)</div>
              <div>→ $50K ARR run rate</div>
              <div>→ Carbon credit pipeline validated</div>
              <div>→ REA Tanzania partnership active</div>
            </div>
          </div>

          <div className="p-5 rounded-lg border" style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--bg-border-subtle)'
          }}>
            <div className="text-sm font-bold mb-2" style={{ color: 'var(--brand-emerald)' }}>
              Q2 2027 — Series A Readiness
            </div>
            <div className="text-xs space-y-1" style={{ color: 'var(--text-muted)' }}>
              <div>→ 50+ operators</div>
              <div>→ $100K ARR achieved</div>
              <div>→ Multiple revenue streams proven</div>
              <div>→ Ready for $2M+ Series A</div>
            </div>
          </div>
        </div>
      </div>

      {/* Assumptions Note */}
      <div className="p-4 rounded-lg border-l-4" style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--status-info)'
      }}>
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>Model Assumptions:</strong><br/>
          All blue values in the original spreadsheet are editable inputs. This dashboard reflects conservative estimates
          based on SaaS infrastructure benchmarks, Tanzania market research, and competitive analysis against SparkMeter.
          Gross margins are strong (90%+) due to cloud-native architecture with minimal variable costs per operator.
        </div>
      </div>
    </div>
  );
}
