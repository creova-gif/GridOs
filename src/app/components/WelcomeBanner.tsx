/**
 * Welcome Banner Component
 * Shows helpful setup instructions on first load
 */

import { useState, useEffect } from 'react';
import { X, ExternalLink, CheckCircle2 } from 'lucide-react';
import { useLiveData } from '../contexts/LiveDataContext';

const DISMISSED_KEY = 'gridios-welcome-dismissed';

export function WelcomeBanner() {
  const [isDismissed, setIsDismissed] = useState(true);
  const { connected, siteSummary } = useLiveData();
  const hasData = connected && siteSummary;

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    setIsDismissed(dismissed === 'true');
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setIsDismissed(true);
  };

  // Auto-dismiss when data starts flowing
  useEffect(() => {
    if (hasData && !isDismissed) {
      setTimeout(handleDismiss, 3000);
    }
  }, [hasData, isDismissed]);

  if (isDismissed || hasData) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <h3 className="text-sm font-semibold text-emerald-400">
              Welcome to GridOS Dashboard
            </h3>
          </div>
          
          <p className="text-sm text-slate-300 mb-3">
            {!connected 
              ? "Connecting to MQTT broker... Start the meter simulator to see live data."
              : "Connected! Waiting for meter data..."}
          </p>

          <div className="space-y-2 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`size-4 ${connected ? 'text-emerald-400' : 'text-slate-600'}`} />
              <span>MQTT Connection {connected ? 'established' : 'pending'}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`size-4 ${hasData ? 'text-emerald-400' : 'text-slate-600'}`} />
              <span>Receiving meter data {hasData ? '✓' : '...'}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 text-xs">
            <a
              href="https://github.com/your-repo/gridios#quick-start"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <ExternalLink className="size-3" />
              Quick Start Guide
            </a>
            <span className="text-slate-600">|</span>
            <a
              href="/SETUP.md"
              className="text-slate-400 hover:text-slate-300 transition-colors"
            >
              Full Setup Documentation
            </a>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-slate-500 hover:text-slate-300 transition-colors"
          aria-label="Dismiss"
        >
          <X className="size-5" />
        </button>
      </div>
    </div>
  );
}
