import { useTranslation } from 'react-i18next';
import { useLiveData } from '../contexts/LiveDataContext';
import { TrendingUp, Brain, Zap, DollarSign, Activity } from 'lucide-react';

export default function AIInsights() {
  const { t } = useTranslation();
  const { siteSummary } = useLiveData();

  // Mock AI data - in production, fetch from backend API
  const forecast24h = {
    peak_w: 8400,
    peak_at: '19:00',
    total_kwh_24h: 142.5,
    confidence: 'high'
  };

  const siteHealth = {
    health_score: 87,
    status: 'healthy',
    generation: {
      expected_kwh_day: 156.2,
      actual_kwh_avg: 148.5,
      loss_pct: 4.9
    }
  };

  const creditScores = [
    { name: 'Amina Hassan', score: 92, tier: 'excellent', recommended_credit_tzs: 20000 },
    { name: 'Joseph Mwangi', score: 85, tier: 'excellent', recommended_credit_tzs: 20000 },
    { name: 'Fatuma Ali', score: 78, tier: 'good', recommended_credit_tzs: 10000 },
    { name: 'St. Peter School', score: 94, tier: 'excellent', recommended_credit_tzs: 20000 },
    { name: 'Emmanuel Shop', score: 71, tier: 'good', recommended_credit_tzs: 10000 },
  ];

  const touPricing = {
    current_period: 'peak',
    current_tariff: 2308,
    base_tariff: 1710,
    multiplier: 1.35,
    label: 'Bei ya juu (Peak hours)'
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <Brain className="w-7 h-7 text-purple-400" />
          {t('ai.title')}
        </h1>
        <p className="text-slate-400 mt-1">
          AI-powered forecasting, credit scoring, and site optimization
        </p>
      </div>

      {/* Load Forecast */}
      <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-slate-100">{t('ai.forecast.title')}</h2>
          <span className="ml-auto text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
            {forecast24h.confidence} confidence
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-slate-400">{t('ai.forecast.peak_load')}</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">
              {forecast24h.peak_w.toLocaleString()}W
            </div>
            <div className="text-xs text-slate-500 mt-1">at {forecast24h.peak_at}</div>
          </div>
          <div>
            <div className="text-sm text-slate-400">{t('ai.forecast.total_energy')}</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">
              {forecast24h.total_kwh_24h} kWh
            </div>
            <div className="text-xs text-slate-500 mt-1">next 24 hours</div>
          </div>
          <div>
            <div className="text-sm text-slate-400">Forecast Model</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">Prophet</div>
            <div className="text-xs text-slate-500 mt-1">hourly_baseline_v1</div>
          </div>
        </div>
      </div>

      {/* Site Health (Digital Twin) */}
      <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-5 h-5 text-green-400" />
          <h2 className="text-lg font-semibold text-slate-100">{t('ai.site_health.title')}</h2>
          <span className={`ml-auto text-xs px-3 py-1 rounded font-medium ${
            siteHealth.status === 'healthy' ? 'bg-green-500/20 text-green-400' :
            siteHealth.status === 'attention' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {siteHealth.status}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-slate-400">{t('ai.site_health.score')}</div>
            <div className="text-3xl font-bold text-green-400 mt-1">
              {siteHealth.health_score}
            </div>
            <div className="text-xs text-slate-500 mt-1">out of 100</div>
          </div>
          <div>
            <div className="text-sm text-slate-400">Expected Generation</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">
              {siteHealth.generation.expected_kwh_day} kWh
            </div>
            <div className="text-xs text-slate-500 mt-1">per day</div>
          </div>
          <div>
            <div className="text-sm text-slate-400">Actual Generation</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">
              {siteHealth.generation.actual_kwh_avg} kWh
            </div>
            <div className="text-xs text-slate-500 mt-1">7-day average</div>
          </div>
          <div>
            <div className="text-sm text-slate-400">Technical Losses</div>
            <div className="text-2xl font-bold text-yellow-400 mt-1">
              {siteHealth.generation.loss_pct}%
            </div>
            <div className="text-xs text-slate-500 mt-1">below 8% = good</div>
          </div>
        </div>
      </div>

      {/* Credit Scores */}
      <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-slate-100">{t('ai.credit_scores.title')}</h2>
          <span className="ml-auto text-xs text-slate-400">
            Rule-based model v1 • Partner: FINCA Tanzania
          </span>
        </div>

        <div className="space-y-3">
          {creditScores.map((customer, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                  {customer.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-medium text-slate-100">{customer.name}</div>
                  <div className="text-sm text-slate-400">
                    TZS {customer.recommended_credit_tzs.toLocaleString()} recommended
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-100">{customer.score}</div>
                  <div className={`text-xs font-medium mt-0.5 ${
                    customer.tier === 'excellent' ? 'text-green-400' :
                    customer.tier === 'good' ? 'text-blue-400' :
                    customer.tier === 'fair' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {t(`ai.credit_scores.${customer.tier}`)}
                  </div>
                </div>
                <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      customer.score >= 80 ? 'bg-green-400' :
                      customer.score >= 65 ? 'bg-blue-400' :
                      customer.score >= 50 ? 'bg-yellow-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${customer.score}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium">
            Export for MFI Partners
          </button>
          <button className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium">
            View All Customers
          </button>
        </div>
      </div>

      {/* Time-of-Use Pricing */}
      <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-slate-100">{t('ai.tou.title')}</h2>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-slate-400">{t('ai.tou.current_tariff')}</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">
              {touPricing.current_tariff} TZS/kWh
            </div>
            <div className="text-xs text-slate-500 mt-1">{touPricing.current_period} (×{touPricing.multiplier})</div>
          </div>
          <div>
            <div className="text-sm text-slate-400">Base Tariff</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">
              {touPricing.base_tariff} TZS/kWh
            </div>
            <div className="text-xs text-slate-500 mt-1">residential standard</div>
          </div>
          <div>
            <div className="text-sm text-slate-400">{t('ai.tou.off_peak')}</div>
            <div className="text-2xl font-bold text-green-400 mt-1">
              {Math.round(touPricing.base_tariff * 0.75)} TZS/kWh
            </div>
            <div className="text-xs text-slate-500 mt-1">00:00–06:00 (×0.75)</div>
          </div>
          <div>
            <div className="text-sm text-slate-400">{t('ai.tou.solar_peak')}</div>
            <div className="text-2xl font-bold text-blue-400 mt-1">
              {Math.round(touPricing.base_tariff * 0.70)} TZS/kWh
            </div>
            <div className="text-xs text-slate-500 mt-1">10:00–15:00 (×0.70)</div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-amber-400 font-medium">
              {touPricing.label}
            </span>
          </div>
          <p className="text-sm text-slate-300 mt-2">
            Current demand response: Peak hours pricing active. Customers notified to shift load to off-peak hours.
          </p>
        </div>
      </div>
    </div>
  );
}
