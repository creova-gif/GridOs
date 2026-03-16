/**
 * Connection Status Component
 * Shows real-time connection status for MQTT and API
 */

import { useState, useEffect } from 'react';
import { useLiveData } from '../contexts/LiveDataContext';
import { checkApiHealth } from '../services/api';

export function ConnectionStatus() {
  const { connected: mqttConnected, error: mqttError } = useLiveData();
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

  useEffect(() => {
    // Check API health on mount
    checkApiHealth()
      .then(setApiConnected)
      .catch(() => setApiConnected(false));

    // Recheck every 30 seconds
    const interval = setInterval(() => {
      checkApiHealth()
        .then(setApiConnected)
        .catch(() => setApiConnected(false));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-4 text-xs">
      {/* MQTT Status */}
      <div className="flex items-center gap-1.5">
        <span
          className={`w-2 h-2 rounded-full ${
            mqttConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
          }`}
        />
        <span className="text-slate-500">
          MQTT {mqttConnected ? 'Live' : mqttError ? 'Error' : 'Offline'}
        </span>
      </div>

      {/* API Status */}
      <div className="flex items-center gap-1.5">
        <span
          className={`w-2 h-2 rounded-full ${
            apiConnected === null
              ? 'bg-slate-600'
              : apiConnected
              ? 'bg-emerald-400'
              : 'bg-red-400'
          }`}
        />
        <span className="text-slate-500">
          API {apiConnected === null ? 'Checking...' : apiConnected ? 'Ready' : 'Offline'}
        </span>
      </div>
    </div>
  );
}
