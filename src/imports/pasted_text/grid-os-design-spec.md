
You are designing and building GridOS — a B2B SaaS platform for mini-grid energy operators in East Africa (Tanzania, Kenya, Rwanda). The primary users are energy operators managing 1–50 solar mini-grid sites, each with 50–5,000 customer connections. Secondary users are field agents working offline in rural areas.
The tech stack is React + Vite + TailwindCSS. The backend is Node.js + Supabase. Live data comes via MQTT WebSocket. The design must be production-ready, Figma Make deployable, and match the quality bar of Linear, Vercel Dashboard, and Stripe.

DESIGN DIRECTION
Aesthetic: Precision dark — the operators using this work long hours managing critical infrastructure. The UI should feel like mission control: dense, confident, zero decoration. Think Grafana meets Linear meets a Bloomberg terminal — but refined, not overwhelming.
Unforgettable element: Every number breathes. All live metrics animate when they update. The site load chart pulses. Meter tiles glow green when healthy, shift to amber when credit is low, turn deep red when disconnected. The UI communicates system health at a glance without reading a single label.
Avoid entirely: gradients on text, purple anything, glass morphism, rounded everything, emoji icons, Inter font, generic SaaS blue, cards with drop shadows, dashboard templates that look like any other dashboard.

TYPOGRAPHY

Display / KPIs: DM Mono — monospaced, industrial, makes numbers feel technical and precise
Headings: Syne — geometric, angular, authoritative (weight 600–700)
Body / labels: Geist — ultra-clean, optimized for dense data at 11–13px
All three from Google Fonts — free, no license issues

Sizes:

Page title: 22px Syne 700
Section header: 15px Syne 600
Table body: 12px Geist 400
KPI number: 28–36px DM Mono 600
Badge / label: 10px Geist 500 uppercase tracking-wide
Timestamp / ID: 11px DM Mono 400


COLOR SYSTEM — CSS VARIABLES
css:root {
  /* Backgrounds — layered depth */
  --bg-base:      #060d18;   /* page */
  --bg-card:      #0a1628;   /* cards */
  --bg-surface:   #0f1e35;   /* inputs, hover */
  --bg-elevated:  #152540;   /* selected, active */

  /* Borders */
  --border-subtle: rgba(255,255,255,.05);
  --border-default: rgba(255,255,255,.09);
  --border-strong:  rgba(255,255,255,.15);

  /* Brand — emerald only */
  --brand:        #00d97e;   /* primary action, active state */
  --brand-dim:    rgba(0,217,126,.08);
  --brand-glow:   rgba(0,217,126,.20);

  /* Semantic */
  --success:      #00d97e;
  --warning:      #f5a623;
  --danger:       #ff4d4f;
  --info:         #4d9fff;

  /* Text */
  --text-primary:   #eef2ff;
  --text-secondary: #7a8ba8;
  --text-tertiary:  #3d5068;
  --text-inverse:   #060d18;
}
```

---

**LAYOUT ARCHITECTURE**
```
┌─────────────────────────────────────────────────────────┐
│ SIDEBAR 200px fixed                                      │
│ ┌──────────────┐ ┌────────────────────────────────────┐ │
│ │ Logo         │ │ TOPBAR 52px                        │ │
│ │              │ │  breadcrumb · search · lang · user │ │
│ │ Nav items    │ ├────────────────────────────────────┤ │
│ │ (icon+label) │ │                                    │ │
│ │              │ │  PAGE CONTENT                      │ │
│ │              │ │  max-width 1440px, 28px padding    │ │
│ │              │ │                                    │ │
│ │ ─────────── │ │                                    │ │
│ │ Lang switch  │ │                                    │ │
│ │ User avatar  │ │                                    │ │
│ └──────────────┘ └────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

Sidebar nav items: icon (16px SVG Lucide) + label + active indicator (2px left border, brand color). No text labels on hover tooltip — always visible. Collapse to icon-only at < 1024px.

---

**COMPONENT SPECIFICATIONS**

**KPI Stat Card**
```
bg: var(--bg-card)
border: 1px solid var(--border-subtle)
border-radius: 10px
padding: 16px 18px
label: 10px Geist 500 uppercase tracking-widest var(--text-tertiary)
value: 32px DM Mono 600 — animate on change with spring interpolation
sub-label: 11px Geist 400 var(--text-tertiary)
trend: small arrow + percentage, green if positive
hover: border shifts to var(--border-default), bg to var(--bg-surface)
```

**Meter Tile** (used in 5-column grid on dashboard)
```
bg: var(--bg-surface) when healthy
border: 1px solid var(--border-subtle)
border-radius: 8px
padding: 12px

States:
  healthy:      border-color: var(--border-subtle), top accent: none
  low_credit:   border-color: rgba(245,166,35,.3), top 2px accent: var(--warning)
  disconnected: border-color: rgba(255,77,79,.25), bg: rgba(255,77,79,.04), top 2px accent: var(--danger)
  tamper:       border-color: rgba(245,166,35,.4), animated pulse on border

Content:
  line 1: meter ID (11px DM Mono 600 var(--text-secondary))
  line 2: power value (20px DM Mono 600 — color by state)
  line 3: balance (12px DM Mono 400 — color by threshold)
  line 4: status badge (10px)

Power value animation: number ticks up/down smoothly on update
```

**Data Table**
```
header row: bg var(--bg-surface), 10px Geist 500 uppercase tracking-widest var(--text-tertiary)
body row: 12px Geist 400, 40px row height
hover: bg var(--bg-surface) transition 80ms
selected: bg var(--bg-elevated) + left 2px brand accent
border: 1px solid var(--border-subtle) between rows only (no outer border)
numeric columns: DM Mono, right-aligned
status columns: inline badge component
```

**Badge Component**
```
font: 10px Geist 600 uppercase tracking-wide
padding: 2px 7px
border-radius: 4px (not pill — more technical)
variants:
  success:  bg rgba(0,217,126,.10)  color #00d97e  border rgba(0,217,126,.20)
  warning:  bg rgba(245,166,35,.10) color #f5a623  border rgba(245,166,35,.20)
  danger:   bg rgba(255,77,79,.10)  color #ff4d4f  border rgba(255,77,79,.20)
  neutral:  bg rgba(255,255,255,.05) color var(--text-secondary) border var(--border-default)
```

**Button**
```
primary: bg var(--brand) color var(--text-inverse) border none — hover: brightness(1.1)
ghost: bg transparent border var(--border-default) color var(--text-secondary) — hover: border-strong bg-surface
danger: bg rgba(255,77,79,.12) border rgba(255,77,79,.25) color var(--danger)
all: 8px border-radius, 13px Geist 500, 7px 16px padding, 80ms transition, scale(.97) on active
```

**Chart — Load Sparkline**
```
Canvas-based, no library dependency
Line: 1.5px stroke var(--brand)
Fill: linear gradient brand → transparent (15% opacity at top, 0 at bottom)
Last point: 4px filled circle var(--brand)
Grid lines: 1px dashed rgba(255,255,255,.04) horizontal only
Axis labels: 10px DM Mono var(--text-tertiary)
Animation: new points slide in from right, old points slide off left
```

**Modal**
```
backdrop: rgba(0,0,0,.65) blur(4px)
panel: bg var(--bg-card) border var(--border-default) border-radius 14px
max-width: 480px
padding: 24px
header: 16px Syne 600 + close button top-right
animation: scale(.95)→scale(1) + opacity 0→1, 180ms ease-out
```

**STS Token Display** (in top-up modal)
```
font: 24px DM Mono 700
letter-spacing: 0.15em
color: var(--brand)
background: var(--brand-dim)
border: 1px solid var(--brand-glow)
border-radius: 8px
padding: 16px 20px
text-align: center
animation: fade in + subtle scale from .98 → 1
```

---

**PAGES TO BUILD — EXACT SPECS**

**1. Dashboard** (`/`)
```
Header: "Site overview" + site name + live indicator (pulsing dot + "Live" text)
Row 1: 4 KPI cards — Connected meters · Total load (W) · Zero balance · Active alerts
Row 2: [Load chart 65%] + [Alert feed 35%]
Row 3: Meter grid (5 columns × 2 rows = 10 tiles)

Load chart: rolling 40-point window, updates every 3s from MQTT
Alert feed: chronological, newest top, max 8 visible, severity dot + message + time
```

**2. Meters** (`/meters`)
```
Header + 4 stat cards (Total / Active / Disconnected / Tamper)
Full-width table: Meter ID · Customer · Brand · Status · Power · Voltage · Balance · Signal · Actions
Row click → slide-in detail panel (right side, 380px wide)
Detail panel: meter info + 24h readings sparkline + last 10 events
```

**3. Customers** (`/customers`)
```
Header + search bar + filter pills (All / Low credit / Zero / Productive use)
Table: Name · Phone · Type · Meter · Balance · Credit score ring · Actions
Credit score: small donut ring (32px) inline in table cell
"Top Up" button opens TopUpModal
Row click → Customer profile slide-in
Customer profile: billing timeline · balance chart · token history · credit score breakdown
```

**4. Alerts** (`/alerts`)
```
Header + severity filter tabs
Card list: severity dot · type badge · message · meter ref · time · Resolve button
Resolve → inline modal: notes field + agent assign + confirm
Resolved alerts: strikethrough style, moved to bottom
```

**5. Analytics** (`/analytics`)
```
Date range picker (7d / 30d / 90d / custom)
Row 1: 4 KPIs — ARPU · Collection rate · Energy efficiency · Total revenue
Row 2: Revenue bar chart (daily) + Energy donut (by customer type)
Row 3: Customer type breakdown table + top 5 revenue customers
```

**6. Fintech** (`/fintech`)
```
RBF Milestone Tracker: progress checklist with animated checkmarks, grant estimate counter
Carbon Revenue: 3 market tiers side by side, tCO2e accumulation counter (live, increments)
MFI Portfolio: score tier donut + customer table with scores
Blended Finance Calculator: two inputs + calculate button + financing waterfall bar chart
```

**7. Operations** (`/operations`)
```
4-card summary row
Left column: Anomaly feed (real-time, color-coded by severity, probability %)
Right column: Agricultural season calendar (month grid, demand index heat map)
Bottom left: Maintenance task list (priority-sorted, agent assignment dropdown)
Bottom right: SDG7 impact counters (animated number counters on page load)
```

**8. Portfolio** (`/portfolio`)
```
Operator-level: all sites in one view
Table: Site name · Region · Health ring (52px) · Meters · Customers · Revenue · Alerts · Status
Sort by any column
Click site → navigate to site-specific dashboard
```

**9. Reports** (`/reports`)
```
6 report cards in 2×3 grid
Each: registry badge · title · description · Generate button · last generated timestamp
Generate → loading state → JSON preview modal with Download + Close
```

**10. Site Planning** (`/planning`)
```
Left panel (40%): lat/lng inputs + score button + score breakdown
Right panel (60%): stylised grid map of Tanzania showing candidate sites as dots
Dot colors: green (excellent) / blue (good) / amber (marginal) / red (poor)
Score panel: animated progress bars per factor + financial projection table
```

**11. USSD Preview** (`/ussd`) — operator monitoring only
```
5-step flow shown as phone mockups side by side
Each phone: dark screen, monospace text, Kiswahili
Below: live USSD session log (real Africa's Talking webhook events)
Stats: sessions today · tokens issued via USSD · avg session length
```

**12. Settings** (`/settings`)
```
Left nav: Profile · Sites · Billing · Integrations · API Keys · Team
Each section: clean form layout, save button per section
API Keys: generate + copy + revoke with confirmation modal
```

---

**MOTION & INTERACTION**
```
Page transition: fadeUp (translateY 8px → 0, opacity 0→1, 250ms ease-out)
Staggered cards: each card delays 40ms more than previous (creates cascade)
Number animation: spring interpolation on all KPI values when data updates
Meter tiles: background color transitions 400ms on state change
Table row hover: 80ms background transition
Modal: scale(.95)→(1) + opacity, 180ms
Sidebar active: left border slides in 120ms
Load chart: data point slides in from right 200ms
Alert severity pulse: critical alerts have 2s pulse animation on dot

LIVE DATA WIRING
javascript// MQTT via WebSocket (no native TCP in browser)
const client = mqtt.connect('wss://broker.hivemq.com:8884/mqtt');
client.subscribe('gridios/op-jumeme-001/site-tz-001/meters/+/status');
client.subscribe('gridios/op-jumeme-001/site-tz-001/site/summary');
client.subscribe('gridios/op-jumeme-001/site-tz-001/alerts');

// React Query for REST data
// staleTime: 30s for most, 5s for alerts, 60s for reports
// refetchInterval: 15s for anomalies, 30s for analytics

// State management: React Context for live MQTT state
// Server state: React Query
// UI state: useState/useReducer local to components
// No Redux, no Zustand needed

ACCESSIBILITY & PERFORMANCE

All interactive elements keyboard navigable
Focus rings: outline: 2px solid var(--brand); outline-offset: 2px
Reduced motion: all animations wrapped in @media (prefers-reduced-motion: no-preference)
WCAG AA contrast on all text/background combinations
Color never the only differentiator — always paired with text or icon
Virtual scroll on tables > 50 rows
Charts use canvas (not SVG) for performance at 60fps
Code-split each page with React.lazy()


FIGMA MAKE DEPLOYMENT NOTES

All colors as CSS variables — Figma Make maps these to Figma Variables automatically
All spacing as multiples of 4px
Component file structure matches Figma component naming: ComponentName/variant
Export tokens as design-tokens.json for bidirectional sync
No inline styles on layout — only CSS classes and CSS variables
All fonts loaded via @import in index.css — Figma Make resolves these