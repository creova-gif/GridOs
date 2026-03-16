import { useLiveData } from '../contexts/LiveDataContext';

const SEVERITY_COLOR = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-amber-400',
  low: 'text-slate-400',
};

const TYPE_LABEL: Record<string, string> = {
  LOW_CREDIT: 'Low credit',
  DISCONNECTED: 'Disconnected',
  TAMPER: 'Tamper',
  UNDER_VOLTAGE: 'Under voltage',
  SITE_OUTAGE: 'Site outage',
  METER_OFFLINE: 'Meter offline',
};

export default function Alerts() {
  const { recentAlerts } = useLiveData();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Alerts</h1>
      <div className="space-y-2">
        {recentAlerts.map((a, i) => (
          <div
            key={i}
            className="bg-slate-800/30 rounded-lg border border-slate-700/50 px-4 py-3 flex items-start gap-3"
          >
            <span
              className={`mt-0.5 text-xs font-bold uppercase w-20 flex-shrink-0 ${
                SEVERITY_COLOR[a.severity as keyof typeof SEVERITY_COLOR]
              }`}
            >
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
          <div className="text-center py-16 text-slate-600">
            No alerts yet. Start simulator to see live alerts.
          </div>
        )}
      </div>
    </div>
  );
}
