// GridOS — App Shell
// Sidebar + routing + live MQTT context + language switcher

import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider }  from '@tanstack/react-query';
import mqtt from 'mqtt';
import { StatusDot } from './components/ui.jsx';

// Pages
import DashboardPage  from './pages/DashboardPage.jsx';
import MetersPage     from './pages/MetersPage.jsx';
import CustomersPage  from './pages/CustomersPage.jsx';
import AlertsPage     from './pages/AlertsPage.jsx';
import AnalyticsPage  from './pages/AnalyticsPage.jsx';
import FintechPage    from './pages/FintechPage.jsx';
import OperationsPage from './pages/OperationsPage.jsx';
import PortfolioPage  from './pages/PortfolioPage.jsx';
import ReportsPage    from './pages/ReportsPage.jsx';
import PlanningPage   from './pages/PlanningPage.jsx';
import SettingsPage   from './pages/SettingsPage.jsx';

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } });

// ─── Live data context ────────────────────────────────────────
export const LiveCtx = createContext({});
export const useLive = () => useContext(LiveCtx);

const SITE_OP = 'op-jumeme-001';
const SITE_ID = 'site-tz-001';
const TOPIC   = `gridios/${SITE_OP}/${SITE_ID}`;

function LiveProvider({ children }) {
  const [meters,   setMeters]   = useState({});
  const [summary,  setSummary]  = useState(null);
  const [alerts,   setAlerts]   = useState([]);
  const [online,   setOnline]   = useState(false);

  useEffect(() => {
    const c = mqtt.connect('wss://broker.hivemq.com:8884/mqtt', {
      clientId: `gridios-ui-${Math.random().toString(16).slice(2,8)}`,
    });
    c.on('connect', () => {
      setOnline(true);
      c.subscribe([`${TOPIC}/meters/+/status`, `${TOPIC}/site/summary`, `${TOPIC}/alerts`]);
    });
    c.on('message', (topic, raw) => {
      try {
        const d = JSON.parse(raw.toString());
        if (topic.includes('/status'))  setMeters(p => ({ ...p, [d.meter_id]: d }));
        if (topic.includes('/summary')) setSummary(d);
        if (topic.includes('/alerts'))  setAlerts(p => [d, ...p].slice(0, 30));
      } catch {}
    });
    c.on('close', () => setOnline(false));
    return () => c.end();
  }, []);

  return (
    <LiveCtx.Provider value={{ meters, summary, alerts, online }}>
      {children}
    </LiveCtx.Provider>
  );
}

// ─── Language context ─────────────────────────────────────────
export const LangCtx = createContext({ lang:'en', setLang:()=>{} });
export const useLang = () => useContext(LangCtx);

// ─── Nav items ────────────────────────────────────────────────
const NAV = [
  { to:'/',           icon:'◉', label:'Dashboard' },
  { to:'/portfolio',  icon:'⬡', label:'Portfolio' },
  { to:'/meters',     icon:'⚡', label:'Meters' },
  { to:'/customers',  icon:'◎', label:'Customers' },
  { to:'/alerts',     icon:'◈', label:'Alerts', badge:'alerts' },
  { to:'/analytics',  icon:'▦', label:'Analytics' },
  { to:'/fintech',    icon:'◆', label:'Fintech' },
  { to:'/operations', icon:'⚙', label:'Operations' },
  { to:'/reports',    icon:'▤', label:'Reports' },
  { to:'/planning',   icon:'⊕', label:'Planning' },
];

function Sidebar({ online, alerts, lang, setLang }) {
  const critCount = alerts.filter(a => ['critical','high'].includes(a.severity)).length;
  const location  = useLocation();

  return (
    <aside style={{
      width:'var(--sidebar-w)', height:'100vh', background:'var(--bg-card)',
      borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column',
      position:'sticky', top:0, flexShrink:0, overflowY:'auto',
    }}>
      {/* Logo */}
      <div style={{ padding:'18px 16px 14px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
          <div style={{ width:28, height:28, background:'var(--emerald)', borderRadius:6,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'13px', fontWeight:700, color:'#000', fontFamily:'var(--font-mono)' }}>G</div>
          <span style={{ fontFamily:'var(--font-head)', fontSize:'16px', fontWeight:700,
            letterSpacing:'-.02em', color:'var(--text-1)' }}>GridOS</span>
        </div>
        <div style={{ fontSize:'11px', color:'var(--text-3)' }}>Ukerewe · Nansio Feeder</div>
        <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:5 }}>
          <StatusDot status={online ? 'active' : 'offline'} pulse={online}/>
          <span style={{ fontSize:'10px', color:'var(--text-3)' }}>{online ? 'Live data' : 'Reconnecting...'}</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding:'10px 8px', flex:1 }}>
        {NAV.map(({ to, icon, label, badge }) => {
          const count = badge === 'alerts' ? critCount : 0;
          return (
            <NavLink key={to} to={to} end={to === '/'}
              style={({ isActive }) => ({
                display:'flex', alignItems:'center', gap:9, padding:'8px 10px',
                borderRadius:8, fontSize:'13px', fontWeight:isActive ? 500 : 400,
                color: isActive ? 'var(--text-1)' : 'var(--text-3)',
                background: isActive ? 'var(--bg-surface)' : 'transparent',
                textDecoration:'none', marginBottom:1,
                transition:'all var(--dur-fast) var(--ease)',
                borderLeft: isActive ? '2px solid var(--emerald)' : '2px solid transparent',
              })}>
              <span style={{ fontSize:'14px', width:16, textAlign:'center' }}>{icon}</span>
              <span style={{ flex:1 }}>{label}</span>
              {count > 0 && (
                <span style={{ fontSize:'10px', fontWeight:600, fontFamily:'var(--font-mono)',
                  background:'var(--red)', color:'#fff', borderRadius:99,
                  padding:'1px 6px', minWidth:18, textAlign:'center' }}>{count}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding:'10px 8px 14px', borderTop:'1px solid var(--border)' }}>
        {/* Language switcher */}
        <div style={{ display:'flex', gap:4, marginBottom:8 }}>
          {['en','sw','fr'].map(l => (
            <button key={l} onClick={() => setLang(l)}
              style={{ flex:1, padding:'4px', fontSize:'10px', fontWeight:500,
                background: lang===l ? 'var(--bg-surface)' : 'transparent',
                border: `1px solid ${lang===l ? 'var(--border-mid)' : 'transparent'}`,
                color: lang===l ? 'var(--text-1)' : 'var(--text-3)',
                borderRadius:6, textTransform:'uppercase', letterSpacing:'.04em' }}>
              {l}
            </button>
          ))}
        </div>
        <NavLink to="/settings" style={({ isActive }) => ({
          display:'flex', alignItems:'center', gap:9, padding:'7px 10px', borderRadius:8,
          fontSize:'12px', color:'var(--text-3)', textDecoration:'none',
          background: isActive ? 'var(--bg-surface)' : 'transparent',
        })}>
          <span>⚙</span><span>Settings</span>
        </NavLink>
        <div style={{ fontSize:'10px', color:'var(--text-4)', marginTop:8, paddingLeft:10 }}>
          GridOS v2.0 · Jumeme Rural Power
        </div>
      </div>
    </aside>
  );
}

// ─── Main layout ──────────────────────────────────────────────
function Layout() {
  const { alerts, online } = useLive();
  const [lang, setLang]    = useState('en');

  return (
    <LangCtx.Provider value={{ lang, setLang }}>
      <div style={{ display:'flex', minHeight:'100vh' }}>
        <Sidebar online={online} alerts={alerts} lang={lang} setLang={setLang}/>
        <main style={{ flex:1, overflowX:'hidden', minWidth:0 }}>
          <Routes>
            <Route path="/"           element={<DashboardPage/>}/>
            <Route path="/portfolio"  element={<PortfolioPage/>}/>
            <Route path="/meters"     element={<MetersPage/>}/>
            <Route path="/customers"  element={<CustomersPage/>}/>
            <Route path="/alerts"     element={<AlertsPage/>}/>
            <Route path="/analytics"  element={<AnalyticsPage/>}/>
            <Route path="/fintech"    element={<FintechPage/>}/>
            <Route path="/operations" element={<OperationsPage/>}/>
            <Route path="/reports"    element={<ReportsPage/>}/>
            <Route path="/planning"   element={<PlanningPage/>}/>
            <Route path="/settings"   element={<SettingsPage/>}/>
          </Routes>
        </main>
      </div>
    </LangCtx.Provider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <LiveProvider>
          <Layout/>
        </LiveProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
