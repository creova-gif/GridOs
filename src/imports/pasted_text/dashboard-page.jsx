// ============================================================
// pages/Dashboard.jsx — Live site overview
// ============================================================
import { useLive } from '../App.jsx';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useState, useEffect } from 'react';

function StatCard({ label, value, sub, accent = 'emerald', alert = false }) {
  const colors = {
    emerald: 'text-emerald-400', red: 'text-red-400',
    amber: 'text-amber-400', blue: 'text-blue-400',
  };
  return (
    <div className={`bg-slate-800/50 rounded-xl p-5 border ${alert ? 'border-red-500/30' : 'border-slate-700/50'}`}>
      <div className="text-xs text-slate-500 mb-1 uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-semibold ${colors[accent]}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

function LiveMeterGrid({ meterStatus }) {
  const meters = Object.values(meterStatus);
  return (
    <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-5">
      <div className="text-sm font-medium text-slate-300 mb-4">Live meter feed</div>
      <div className="grid grid-cols-2 gap-2">
        {meters.map(m => (
          <div key={m.meter_id}
            className={`flex items-center justify-between p-3 rounded-lg text-xs ${
              !m.connected ? 'bg-slate-900/80 border border-red-500/20'
              : m.tamper    ? 'bg-slate-900/80 border border-amber-500/30'
              : 'bg-slate-900/40 border border-slate-700/30'
            }`}>
            <div>
              <div className="font-medium text-slate-200">{m.meter_id}</div>
              <div className="text-slate-500 mt-0.5">TZS {m.balance_tzs?.toFixed(0)}</div>
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

export function DashboardPage() {
  const { meterStatus, siteSummary, recentAlerts, connected } = useLive();
  const [loadHistory, setLoadHistory] = useState([]);

  // Build rolling load chart from live data
  useEffect(() => {
    if (!siteSummary) return;
    setLoadHistory(prev => {
      const entry = {
        time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
        load: siteSummary.total_load_w,
        util: siteSummary.utilization_pct,
      };
      return [...prev.slice(-29), entry];
    });
  }, [siteSummary]);

  const s = siteSummary;
  const critAlerts = recentAlerts.filter(a => a.severity === 'critical').length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-100">Site overview</h1>
        <p className="text-slate-500 text-sm mt-1">Ukerewe Island — Nansio Feeder · 50 kW capacity</p>
      </div>

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
          accent={s?.meters_zero_balance > 0 ? 'red' : 'emerald'}
          alert={s?.meters_zero_balance > 0}
        />
        <StatCard
          label="Active alerts"
          value={critAlerts > 0 ? `${critAlerts} critical` : (recentAlerts.length || '0')}
          sub={critAlerts > 0 ? 'Action required' : 'All clear'}
          accent={critAlerts > 0 ? 'red' : 'emerald'}
          alert={critAlerts > 0}
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Load chart */}
        <div className="col-span-2 bg-slate-800/30 rounded-xl border border-slate-700/50 p-5">
          <div className="text-sm font-medium text-slate-300 mb-4">Site load — live (W)</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={loadHistory}>
              <defs>
                <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={40}/>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="load" stroke="#10b981" fill="url(#loadGrad)" strokeWidth={2} dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent alerts */}
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-5">
          <div className="text-sm font-medium text-slate-300 mb-4">Recent alerts</div>
          <div className="space-y-2">
            {recentAlerts.slice(0, 6).map((a, i) => (
              <div key={i} className="flex gap-2 text-xs">
                <span className={`mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1 ${
                  a.severity === 'critical' ? 'bg-red-400' :
                  a.severity === 'high'     ? 'bg-orange-400' : 'bg-amber-400'
                }`}/>
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


// ============================================================
// pages/Meters.jsx
// ============================================================
import { useLive as useLiveM } from '../App.jsx';
export function MetersPage() {
  const { meterStatus } = useLiveM();
  const meters = Object.values(meterStatus);
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Meters</h1>
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50">
              {['Meter ID','Status','Power','Voltage','Balance (TZS)','Signal','Tamper'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 font-medium uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {meters.map(m => (
              <tr key={m.meter_id} className="border-b border-slate-700/20 hover:bg-slate-700/20 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-200">{m.meter_id}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    m.connected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  }`}>{m.connected ? 'Active' : 'Disconnected'}</span>
                </td>
                <td className="px-4 py-3 text-slate-300">{m.power_w}W</td>
                <td className="px-4 py-3 text-slate-300">{m.voltage_v || '—'}V</td>
                <td className={`px-4 py-3 font-mono ${
                  !m.balance_tzs ? 'text-red-400' :
                  m.balance_tzs < 3000 ? 'text-amber-400' : 'text-slate-300'
                }`}>{m.balance_tzs?.toLocaleString() || '0'}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">{m.rssi_dbm || '—'} dBm</td>
                <td className="px-4 py-3">
                  {m.tamper
                    ? <span className="text-amber-400 text-xs">⚠ Detected</span>
                    : <span className="text-slate-600 text-xs">Clear</span>}
                </td>
              </tr>
            ))}
            {meters.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-slate-600">Start simulator to see live meter data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// ============================================================
// pages/Customers.jsx (stub — data from API)
// ============================================================
export function CustomersPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-2">Customers</h1>
      <p className="text-slate-500 text-sm mb-6">10 registered customers — Ukerewe Island site</p>
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-8 text-center text-slate-500 text-sm">
        Connect to Supabase to load customer data.<br/>
        <span className="text-slate-600 text-xs">GET /api/customers?site_id=site-tz-001</span>
      </div>
    </div>
  );
}


// ============================================================
// pages/Alerts.jsx — live alert feed
// ============================================================
import { useLive as useLiveA } from '../App.jsx';
const SEVERITY_COLOR = { critical:'text-red-400', high:'text-orange-400', medium:'text-amber-400', low:'text-slate-400' };
const TYPE_LABEL = {
  LOW_CREDIT:'Low credit', DISCONNECTED:'Disconnected', TAMPER:'Tamper',
  UNDER_VOLTAGE:'Under voltage', SITE_OUTAGE:'Site outage', METER_OFFLINE:'Meter offline',
};
export function AlertsPage() {
  const { recentAlerts } = useLiveA();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Alerts</h1>
      <div className="space-y-2">
        {recentAlerts.map((a, i) => (
          <div key={i} className="bg-slate-800/30 rounded-lg border border-slate-700/50 px-4 py-3 flex items-start gap-3">
            <span className={`mt-0.5 text-xs font-bold uppercase w-20 flex-shrink-0 ${SEVERITY_COLOR[a.severity]}`}>
              {a.severity}
            </span>
            <div className="flex-1">
              <div className="text-sm text-slate-200">{a.message}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {TYPE_LABEL[a.type] || a.type} · {new Date(a.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        {recentAlerts.length === 0 && (
          <div className="text-center py-16 text-slate-600">No alerts yet. Start simulator to see live alerts.</div>
        )}
      </div>
    </div>
  );
}


// ============================================================
// pages/Analytics.jsx
// ============================================================
import { BarChart, Bar, Cell } from 'recharts';
const MOCK_REVENUE = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, i) => ({
  day, revenue: Math.round(80000 + Math.random() * 60000),
}));
export function AnalyticsPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-2">Analytics</h1>
      <p className="text-slate-500 text-sm mb-6">Revenue and energy data — Ukerewe Island</p>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'ARPU (avg revenue/customer)', value: 'TZS 18,400', sub: 'Per month' },
          { label: 'Collection rate', value: '78%', sub: 'Of billed amount' },
          { label: 'Energy sold (month)', value: '4,820 kWh', sub: 'vs 5,100 generated' },
        ].map(c => (
          <div key={c.label} className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-5">
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">{c.label}</div>
            <div className="text-xl font-semibold text-emerald-400">{c.value}</div>
            <div className="text-xs text-slate-500 mt-1">{c.sub}</div>
          </div>
        ))}
      </div>
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-5">
        <div className="text-sm font-medium text-slate-300 mb-4">Daily revenue — last 7 days (TZS)</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={MOCK_REVENUE} barSize={32}>
            <XAxis dataKey="day" tick={{ fill:'#64748b', fontSize:12 }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} width={60}
              tickFormatter={v => `${(v/1000).toFixed(0)}K`}/>
            <Tooltip contentStyle={{ background:'#1e293b', border:'1px solid #334155', borderRadius:8, fontSize:12 }}
              formatter={v => [`TZS ${v.toLocaleString()}`, 'Revenue']}/>
            <Bar dataKey="revenue" fill="#10b981" radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
