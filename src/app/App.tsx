import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LiveDataProvider, useLiveData } from './contexts/LiveDataContext';
import { useTranslation } from 'react-i18next';
import './i18n'; // Initialize i18n
import { LanguageSwitcher } from './components/LanguageSwitcher';
import Dashboard from './pages/Dashboard';
import Meters from './pages/Meters';
import Alerts from './pages/Alerts';
import Analytics from './pages/Analytics';
import AIInsights from './pages/AIInsights';
import RBFReports from './pages/RBFReports';
import SitePlanning from './pages/SitePlanning';
import USSDPortal from './pages/USSDPortal';
import AgentApp from './pages/AgentApp';
import Portfolio from './pages/Portfolio';
import Customers from './pages/Customers';
import Fintech from './pages/Fintech';
import Operations from './pages/Operations';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const NAV = [
  { to: '/', label: 'nav.dashboard', icon: '◉' },
  { to: '/portfolio', label: 'Portfolio', icon: '⬡' },
  { to: '/meters', label: 'nav.meters', icon: '⚡' },
  { to: '/customers', label: 'Customers', icon: '👥' },
  { to: '/alerts', label: 'nav.alerts', icon: '🔔' },
  { to: '/analytics', label: 'nav.analytics', icon: '📊' },
  { to: '/ai', label: 'nav.ai', icon: '🧠' },
  { to: '/reports', label: 'nav.reports', icon: '📄' },
  { to: '/planning', label: 'nav.planning', icon: '🗺️' },
  { to: '/ussd', label: 'USSD Portal', icon: '📱' },
  { to: '/agent', label: 'Agent App', icon: '👤' },
  { to: '/fintech', label: 'Fintech', icon: '💳' },
  { to: '/operations', label: 'Operations', icon: '⚙️' },
];

function Sidebar() {
  const { connected } = useLiveData();
  const { t } = useTranslation();
  
  return (
    <aside className="w-56 min-h-screen flex flex-col border-r" style={{
      backgroundColor: 'var(--bg-card)',
      borderColor: 'var(--bg-border-subtle)'
    }}>
      <div className="px-5 py-6 border-b" style={{ borderColor: 'var(--bg-border-subtle)' }}>
        <div className="font-bold text-lg tracking-tight" style={{ color: 'var(--brand-emerald)' }}>GridOS</div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Ukerewe Island · Nansio</div>
        <div className="flex items-center gap-1.5 mt-3">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: connected ? 'var(--brand-emerald)' : 'var(--status-danger)' }}
          />
          <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
            {connected ? 'Live data' : 'Connecting...'}
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 relative overflow-hidden ${
                isActive
                  ? 'text-emerald-400 font-medium'
                  : 'hover:translate-x-1'
              }`
            }
            style={({ isActive }) => ({
              backgroundColor: isActive ? 'var(--brand-dim)' : 'transparent',
              color: isActive ? 'var(--brand-emerald)' : 'var(--text-muted)',
              borderLeft: isActive ? '3px solid var(--brand-emerald)' : '3px solid transparent',
              boxShadow: isActive ? '0 0 20px rgba(0, 217, 126, 0.15)' : 'none',
              paddingLeft: isActive ? '10px' : '12px'
            })}
          >
            <span className="relative">
              {typeof label === 'string' && label.includes('.') ? t(label) : label}
              <span 
                className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-200"
                style={{
                  width: '0%',
                  opacity: 0
                }}
              />
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-3">
        <LanguageSwitcher />
      </div>

      <div className="px-5 py-4 border-t" style={{ borderColor: 'var(--bg-border-subtle)' }}>
        <div className="text-xs" style={{ color: 'var(--text-faint)' }}>Jumeme Rural Power</div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
          {import.meta.env.VITE_USE_LOCAL_SIMULATOR === 'true' ? 'Local Simulator' : 'Live MQTT'}
        </div>
      </div>
    </aside>
  );
}

export default function App() {
  return (
    <LiveDataProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <div className="flex min-h-screen text-slate-100" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <Sidebar />
            <main className="flex-1 overflow-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/meters" element={<Meters />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/ai" element={<AIInsights />} />
                <Route path="/reports" element={<RBFReports />} />
                <Route path="/planning" element={<SitePlanning />} />
                <Route path="/ussd" element={<USSDPortal />} />
                <Route path="/agent" element={<AgentApp />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/fintech" element={<Fintech />} />
                <Route path="/operations" element={<Operations />} />
                {/* Catch-all route - redirect any unknown URLs to dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </QueryClientProvider>
    </LiveDataProvider>
  );
}