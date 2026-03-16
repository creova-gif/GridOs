import { AlertTriangle, Zap, ZapOff, TrendingDown } from 'lucide-react';
import type { Alert } from '../data/simulator';

interface AlertListProps {
  alerts: Alert[];
}

export function AlertList({ alerts }: AlertListProps) {
  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Recent Alerts</h2>
        <div className="text-center py-8 text-gray-500">
          <Zap className="size-12 mx-auto mb-2 text-gray-300" />
          <p>No active alerts</p>
        </div>
      </div>
    );
  }

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'DISCONNECTED':
        return ZapOff;
      case 'LOW_CREDIT':
        return TrendingDown;
      case 'TAMPER':
        return AlertTriangle;
      case 'UNDER_VOLTAGE':
        return Zap;
      default:
        return AlertTriangle;
    }
  };

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h2 className="font-semibold text-gray-900 mb-4">
        Recent Alerts ({alerts.length})
      </h2>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {alerts.map((alert) => {
          const Icon = getAlertIcon(alert.type);
          return (
            <div
              key={alert.id}
              className={`border rounded-lg p-3 ${getSeverityColor(
                alert.severity
              )}`}
            >
              <div className="flex items-start gap-3">
                <Icon className="size-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{alert.message}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs opacity-75">
                    <span>{alert.meter_id}</span>
                    <span>•</span>
                    <span>
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                    <span>•</span>
                    <span className="capitalize">{alert.severity}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
