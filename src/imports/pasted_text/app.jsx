// ============================================================
// src/App.jsx — Router + live MQTT subscription
// ============================================================
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, createContext, useContext } from 'react';
import mqtt from 'mqtt';
import { DashboardPage }  from './pages/Dashboard.jsx';
import { MetersPage }     from './pages/Meters.jsx';
import { CustomersPage }  from './pages/Customers.jsx';
import { AlertsPage }     from './pages/Alerts.jsx';
import { AnalyticsPage }  from './pages/Analytics.jsx';

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });

// Live meter data context
export const LiveDataContext = createContext({});
export const useLive = () => useContext(LiveDataContext);

const SITE_ID = 'site-tz-001';
const OP_ID   = 'op-jumeme-001';
const TOPIC   = `gridios/${OP_ID}/${SITE_ID}`;

function LiveProvider({ children }) {
  const [meterStatus, setMeterStatus] = useState({});
  const [siteSummary, setSiteSummary] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const client = mqtt.connect('wss://broker.hivemq.com:8884/mqtt', {
      clientId: `gridios-dash-${Math.random().toString(16).slice(2,8)}`,
      clean: true,
    });

    client.on('connect', () => {
      setConnected(true);
      client.subscribe([
        `${TOPIC}/meters/+/status`,
        `${TOPIC}/site/summary`,
        `${TOPIC}/alerts`,
      ]);
    });

    client.on('message', (topic, raw) => {
      try {
        const data = JSON.parse(raw.toString());
        if (topic.includes('/status')) {
          setMeterStatus(prev => ({ ...prev, [data.meter_id]: data }));
        } else if (topic.includes('/summary')) {
          setSiteSummary(data);
        } else if (topic.includes('/alerts')) {
          setRecentAlerts(prev => [data, ...prev].slice(0, 20));
        }
      } catch {}
    });

    client.on('disconnect', () => setConnected(false));
    return () => client.end();
  }, []);

  return (
    <LiveDataContext.Provider value={{ meterStatus, siteSummary, recentAlerts, connected }}>
      {children}
    </LiveDataContext.Provider>
  );
}

const NAV = [
  { to: '/',          label: 'Dashboard',  icon: '◉' },
  { to: '/meters',    label: 'Meters',     icon: '⚡' },
  { to: '/customers', label: 'Customers',  icon: '👤' },
  { to: '/alerts',    label: 'Alerts',     icon: '🔔' },
  { to: '/analytics', label: 'Analytics',  icon: '📊' },
];

function Sidebar({ connected }) {
  return (
    <aside className="w-56 min-h-screen bg-slate-900 flex flex-col">
      <div className="px-5 py-6 border-b border-slate-700">
        <div className="text-emerald-400 font-bold text-lg tracking-tight">GridOS</div>
        <div className="text-slate-400 text-xs mt-0.5">Ukerewe Island · Nansio</div>
        <div className="flex items-center gap-1.5 mt-2">
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'}`} />
          <span className="text-xs text-slate-500">{connected ? 'Live data' : 'Connecting...'}</span>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`
            }>
            <span className="text-base">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-slate-700">
        <div className="text-xs text-slate-500">Jumeme Rural Power</div>
        <div className="text-xs text-slate-600 mt-0.5">v1.0.0-mvp</div>
      </div>
    </aside>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <LiveProvider>
          <div className="flex min-h-screen bg-slate-950 text-slate-100">
            <SidebarWithLive />
            <main className="flex-1 overflow-auto">
              <Routes>
                <Route path="/"           element={<DashboardPage />} />
                <Route path="/meters"     element={<MetersPage />} />
                <Route path="/customers"  element={<CustomersPage />} />
                <Route path="/alerts"     element={<AlertsPage />} />
                <Route path="/analytics"  element={<AnalyticsPage />} />
              </Routes>
            </main>
          </div>
        </LiveProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function SidebarWithLive() {
  const { connected } = useLive();
  return <Sidebar connected={connected} />;
}
