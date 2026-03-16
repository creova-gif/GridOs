import { Activity, AlertTriangle, Zap, Users } from 'lucide-react';
import type { SiteSummary } from '../data/simulator';

interface SiteStatsProps {
  summary: SiteSummary | null;
}

export function SiteStats({ summary }: SiteStatsProps) {
  if (!summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="h-20 flex items-center justify-center text-gray-400">
              Loading...
            </div>
          </div>
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: 'Connected Meters',
      value: `${summary.meters_connected}/${summary.meters_total}`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Total Load',
      value: `${summary.total_load_w} W`,
      subValue: `${summary.utilization_pct}% capacity`,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Low Balance',
      value: summary.meters_low_credit,
      subValue: `${summary.meters_zero_balance} disconnected`,
      icon: Zap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      label: 'Alerts',
      value: summary.meters_tamper,
      subValue: 'Tamper detected',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stat.value}
                </p>
                {stat.subValue && (
                  <p className="text-xs text-gray-500 mt-1">{stat.subValue}</p>
                )}
              </div>
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <Icon className={`size-5 ${stat.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
