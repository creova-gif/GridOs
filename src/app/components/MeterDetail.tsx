import { X, Zap, Activity, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import type { MeterReading } from '../data/simulator';
import { METERS } from '../data/site-config';

interface MeterDetailProps {
  reading: MeterReading | null;
  onClose: () => void;
}

export function MeterDetail({ reading, onClose }: MeterDetailProps) {
  if (!reading) return null;

  const meter = METERS.find((m) => m.id === reading.meter_id);
  if (!meter) return null;

  const details = [
    {
      label: 'Power',
      value: `${reading.power_w} W`,
      icon: Zap,
    },
    {
      label: 'Voltage',
      value: `${reading.voltage_v} V`,
      icon: Activity,
    },
    {
      label: 'Current',
      value: `${reading.current_a} A`,
      icon: Activity,
    },
    {
      label: 'Frequency',
      value: `${reading.frequency_hz} Hz`,
      icon: Activity,
    },
    {
      label: 'Power Factor',
      value: reading.power_factor.toFixed(3),
      icon: Activity,
    },
    {
      label: 'Balance',
      value: `TZS ${reading.balance_tzs.toLocaleString()}`,
      icon: DollarSign,
    },
    {
      label: 'Cumulative Energy',
      value: `${reading.cumulative_kwh.toFixed(2)} kWh`,
      icon: Activity,
    },
    {
      label: 'Tariff Rate',
      value: `TZS ${reading.tariff_tzs_per_kwh}/kWh`,
      icon: DollarSign,
    },
    {
      label: 'Signal Strength',
      value: `${reading.rssi_dbm} dBm`,
      icon: Activity,
    },
    {
      label: 'Firmware',
      value: reading.firmware,
      icon: Activity,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {meter.customer.name}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {reading.meter_id} • {meter.serial}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="size-5 text-gray-500" />
          </button>
        </div>

        {/* Status Indicators */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm ${
                reading.connected
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {reading.connected ? 'Connected' : 'Disconnected'}
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-blue-50 text-blue-700 capitalize">
              {meter.customer.type}
            </span>
            {reading.tamper_detected && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-red-50 text-red-700">
                <AlertTriangle className="size-3.5" />
                Tamper Detected
              </span>
            )}
          </div>
        </div>

        {/* Customer Info */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">Customer Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">Phone</p>
              <p className="text-sm text-gray-900">{meter.customer.phone}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Meter Brand</p>
              <p className="text-sm text-gray-900">
                {meter.brand} {meter.model}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Load Profile</p>
              <p className="text-sm text-gray-900 capitalize">
                {meter.load_profile.replace('_', ' ')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Phase</p>
              <p className="text-sm text-gray-900 capitalize">{meter.phase}</p>
            </div>
          </div>
        </div>

        {/* Readings */}
        <div className="p-6">
          <h3 className="font-medium text-gray-900 mb-4">Current Readings</h3>
          <div className="grid grid-cols-2 gap-4">
            {details.map((detail, index) => {
              const Icon = detail.icon;
              return (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50"
                >
                  <div className="p-2 bg-white rounded-lg">
                    <Icon className="size-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">{detail.label}</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">
                      {detail.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Last Updated */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="size-4" />
            <span>
              Last updated: {new Date(reading.timestamp).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
