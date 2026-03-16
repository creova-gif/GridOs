import { Activity, AlertTriangle, Zap, ZapOff } from 'lucide-react';
import type { MeterReading } from '../data/simulator';
import { METERS } from '../data/site-config';

interface MeterCardProps {
  reading: MeterReading | null;
  onClick?: () => void;
}

export function MeterCard({ reading, onClick }: MeterCardProps) {
  const meter = METERS.find(m => m.id === reading?.meter_id);
  
  if (!reading || !meter) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="h-32 flex items-center justify-center text-gray-400">
          No data
        </div>
      </div>
    );
  }

  const isLowBalance = reading.balance_tzs > 0 && reading.balance_tzs < 3000;
  const isZeroBalance = reading.balance_tzs <= 0;

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{meter.customer.name}</h3>
          <p className="text-xs text-gray-500">{reading.meter_id}</p>
        </div>
        <div className="flex items-center gap-2">
          {reading.tamper_detected && (
            <AlertTriangle className="size-4 text-red-500" />
          )}
          {reading.connected ? (
            <Zap className="size-4 text-green-500" />
          ) : (
            <ZapOff className="size-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Power Usage */}
      <div className="mb-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-gray-900">
            {reading.power_w}
          </span>
          <span className="text-sm text-gray-500">W</span>
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          {reading.voltage_v}V • {reading.current_a}A
        </div>
      </div>

      {/* Balance */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Balance</span>
          <span
            className={`text-sm font-medium ${
              isZeroBalance
                ? 'text-red-600'
                : isLowBalance
                ? 'text-orange-600'
                : 'text-green-600'
            }`}
          >
            TZS {reading.balance_tzs.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Total kWh</span>
          <span className="text-xs text-gray-700">
            {reading.cumulative_kwh.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Type</span>
          <span className="text-xs capitalize text-gray-700">
            {meter.customer.type}
          </span>
        </div>
      </div>

      {/* Status Badge */}
      {!reading.connected && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-50 text-red-700">
            Disconnected
          </span>
        </div>
      )}
    </div>
  );
}
