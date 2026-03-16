import { useEffect, useState } from 'react';
import { useLiveData } from '../contexts/LiveDataContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { WelcomeBanner } from '../components/WelcomeBanner';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'emerald' | 'red' | 'amber' | 'blue';
  alert?: boolean;
}

function StatCard({ label, value, sub, accent = 'emerald', alert = false }: StatCardProps) {
  const colors = {
    emerald: 'text-emerald-400',
    red: 'text-red-400',
    amber: 'text-amber-400',
    blue: 'text-blue-400',
  };

  return (
    <div
      className={`bg-slate-800/50 rounded-xl p-5 border ${
        alert ? 'border-red-500/30' : 'border-slate-700/50'
      }`}
    >
      <div className="text-xs text-slate-500 mb-1 uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-semibold ${colors[accent]}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

interface LiveMeterGridProps {
  meterStatus: Record<string, any>;
}

function LiveMeterGrid({ meterStatus }: LiveMeterGridProps) {
  const meters = Object.values(meterStatus);

  return (
    <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-5">
      <div className="text-sm font-medium text-slate-300 mb-4">Live meter feed</div>
      <div className="grid grid-cols-2 gap-2">
        {meters.map((m: any) => (
          <div
            key={m.meter_id}
            className={`flex items-center justify-between p-3 rounded-lg text-xs ${
              !m.connected
                ? 'bg-slate-900/80 border border-red-500/20'
                : m.tamper
                ? 'bg-slate-900/80 border border-amber-500/30'
                : 'bg-slate-900/40 border border-slate-700/30'
            }`}
          >
            <div>
              <div className="font-medium text-slate-200">{m.meter_id}</div>
              <div className="text-slate-500 mt-0.5">
                TZS {m.balance_tzs?.toFixed(0) || '0'}
              </div>
            </div>
            <div className="text-right">
              <div className={m.connected ? 'text-emerald-400' : 'text-red-400'}>
                {m.connected ? `${m.power_w}W` : 'OFF'}
              </div>
              {m.tamper && <div className="text-amber-400 mt-0.5">TAMPER</div>}
            </div>
          </div>
        ))}
        {meters.length === 0 && (
          <div className="col-span-2 text-center py-8 text-slate-600 text-sm">
            Waiting for meter data... (start simulator)
          </div>
        )}
      </div>
    </div>
  );
}

interface LoadChartData {
  time: string;
  load: number;
  util: number;
  id: string; // Add unique identifier
}

export default function Dashboard() {
  const { meterStatus, siteSummary, recentAlerts, connected } = useLiveData();
  const [loadHistory, setLoadHistory] = useState<LoadChartData[]>([]);

  // Build rolling load chart from live data
  useEffect(() => {
    if (!siteSummary) return;

    setLoadHistory((prev) => {
      const entry: LoadChartData = {
        time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
        load: siteSummary.total_load_w,
        util: siteSummary.utilization_pct,
        id: `${Date.now()}-${Math.random()}`, // Unique ID for React keys
      };
      return [...prev.slice(-29), entry];
    });
  }, [siteSummary]);

  const s = siteSummary;
  const critAlerts = recentAlerts.filter((a) => a.severity === 'critical').length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-100">Site overview</h1>
        <p className="text-slate-500 text-sm mt-1">
          Ukerewe Island — Nansio Feeder · 50 kW capacity · Live telemetry from meters via MQTT
        </p>
      </div>

      {/* Welcome Banner */}
      <WelcomeBanner />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Connected meters"
          value={s ? `${s.meters_connected}/${s.meters_total}` : '—'}
          sub={`${s?.collection_rate_pct || 0}% active`}
          accent="emerald"
        />
        <StatCard
          label="Total load"
          value={s ? `${s.total_load_w}W` : '—'}
          sub={`${s?.utilization_pct || 0}% of 50kW`}
          accent="blue"
        />
        <StatCard
          label="Zero balance"
          value={s?.meters_zero_balance ?? '—'}
          sub="Need top-up"
          accent={s && s.meters_zero_balance > 0 ? 'red' : 'emerald'}
          alert={s && s.meters_zero_balance > 0}
        />
        <StatCard
          label="Active alerts"
          value={critAlerts > 0 ? `${critAlerts} critical` : recentAlerts.length || '0'}
          sub={critAlerts > 0 ? 'Action required' : 'All clear'}
          accent={critAlerts > 0 ? 'red' : 'emerald'}
          alert={critAlerts > 0}
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Load chart */}
        <div className="col-span-2 bg-slate-800/30 rounded-xl border border-slate-700/50 p-5">
          <div className="text-sm font-medium text-slate-300 mb-4">Site load — live (W)</div>
          {loadHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={loadHistory}>
                <defs>
                  <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="time"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="load"
                  stroke="#10b981"
                  fill="url(#loadGrad)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-slate-600 text-sm">
              Waiting for live data...
            </div>
          )}
        </div>

        {/* Recent alerts */}
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-5">
          <div className="text-sm font-medium text-slate-300 mb-4">Recent alerts</div>
          <div className="space-y-2">
            {recentAlerts.slice(0, 6).map((a, i) => (
              <div key={i} className="flex gap-2 text-xs">
                <span
                  className={`mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1 ${
                    a.severity === 'critical'
                      ? 'bg-red-400'
                      : a.severity === 'high'
                      ? 'bg-orange-400'
                      : 'bg-amber-400'
                  }`}
                />
                <span className="text-slate-400 leading-relaxed">{a.message}</span>
              </div>
            ))}
            {recentAlerts.length === 0 && (
              <div className="text-slate-600 text-xs">No alerts yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Live meter grid */}
      <div className="mt-6">
        <LiveMeterGrid meterStatus={meterStatus} />
      </div>
    </div>
  );
}