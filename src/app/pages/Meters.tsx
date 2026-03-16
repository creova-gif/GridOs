import { useLiveData } from '../contexts/LiveDataContext';

export default function Meters() {
  const { meterStatus } = useLiveData();
  const meters = Object.values(meterStatus);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-2">Meters</h1>
      <p className="text-slate-500 text-sm mb-6">Live telemetry — all {meters.length} meters</p>
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50">
              {['Meter ID', 'Customer', 'Status', 'Power', 'Voltage', 'Balance (TZS)', 'Signal'].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs text-slate-500 font-medium uppercase tracking-wide"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {meters.map((m: any) => (
              <tr
                key={m.meter_id}
                className="border-b border-slate-700/20 hover:bg-slate-700/20 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-slate-200">{m.meter_id}</td>
                <td className="px-4 py-3 text-slate-300">{m.customer_name || '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      m.connected
                        ? m.tamper
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    {!m.connected ? 'Off' : m.tamper ? 'Tamper' : 'Active'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-300">{m.connected ? `${m.power_w}W` : '—'}</td>
                <td className="px-4 py-3 text-slate-300">{m.connected ? `${m.voltage_v}V` : '—'}</td>
                <td
                  className={`px-4 py-3 font-mono ${
                    !m.balance_tzs || m.balance_tzs <= 0
                      ? 'text-red-400'
                      : m.balance_tzs < 3000
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {Math.round(m.balance_tzs || 0).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">{m.rssi || m.rssi_dbm || '—'} dBm</td>
              </tr>
            ))}
            {meters.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-600">
                  Waiting for meter data... (enable local simulator or start MQTT publisher)
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}