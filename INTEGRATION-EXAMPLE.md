# 🔌 API Integration Example

**How to convert a page from local simulator to real API**

---

## 📝 **EXAMPLE: Dashboard Page**

### **BEFORE (Local Simulator)**

```tsx
// /src/app/pages/Dashboard.tsx
import { useLiveData } from '../contexts/LiveDataContext';

export default function Dashboard() {
  const { meters, summary, alerts, connected } = useLiveData();
  
  return (
    <div>
      <h1>Site: {summary.site_id}</h1>
      <div>Total Load: {summary.total_load_w}W</div>
      {/* ... */}
    </div>
  );
}
```

---

### **AFTER (Real API with React Query)**

```tsx
// /src/app/pages/Dashboard.tsx
import { useQuery } from '@tanstack/react-query';
import { sitesApi, metersApi, alertsApi } from '../services/api';

const SITE_ID = '00000000-0000-0000-0000-000000000010';

export default function Dashboard() {
  // Fetch site stats (refreshes every 30 seconds)
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['site-stats', SITE_ID],
    queryFn: async () => {
      const response = await sitesApi.getStats(SITE_ID);
      return response.data;
    },
    refetchInterval: 30000,
  });

  // Fetch meters (refreshes every 15 seconds)
  const { data: meters = [], isLoading: loadingMeters } = useQuery({
    queryKey: ['meters', SITE_ID],
    queryFn: async () => {
      const response = await metersApi.getBySite(SITE_ID);
      return response.data;
    },
    refetchInterval: 15000,
  });

  // Fetch alerts
  const { data: alerts = [], isLoading: loadingAlerts } = useQuery({
    queryKey: ['alerts', SITE_ID],
    queryFn: async () => {
      const response = await alertsApi.getBySite(SITE_ID, { status: 'unresolved' });
      return response.data;
    },
    refetchInterval: 10000,
  });

  if (loadingSummary || loadingMeters || loadingAlerts) {
    return (
      <div className="p-8">
        <div className="text-center" style={{ color: 'var(--text-muted)' }}>
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 style={{ color: 'var(--text-primary)' }}>
        Site: {summary?.name || 'Ukerewe Island'}
      </h1>
      <div style={{ color: 'var(--text-muted)' }}>
        Total Load: {summary?.total_load_w || 0}W
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <StatCard
          label="Revenue (Today)"
          value={`TZS ${(summary?.revenue_today_tzs || 0).toLocaleString()}`}
          trend={summary?.revenue_trend_pct}
        />
        <StatCard
          label="Connected Meters"
          value={`${summary?.meters_connected || 0}/${summary?.meters_total || 0}`}
          color="success"
        />
        <StatCard
          label="Total Load"
          value={`${(summary?.total_load_w || 0) / 1000} kW`}
          subtitle={`${summary?.utilization_pct || 0}% capacity`}
        />
        <StatCard
          label="Active Alerts"
          value={alerts.length}
          color={alerts.length > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* Meters Table */}
      <div className="mt-8">
        <h2>Meters</h2>
        <table>
          {meters.map(meter => (
            <tr key={meter.id}>
              <td>{meter.meter_ref}</td>
              <td>{meter.customer_name}</td>
              <td>TZS {meter.balance_tzs.toLocaleString()}</td>
              <td>{meter.power_w}W</td>
            </tr>
          ))}
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, trend, color = 'primary', subtitle }) {
  return (
    <div className="rounded-lg border p-4" style={{
      backgroundColor: 'var(--bg-card)',
      borderColor: 'var(--bg-border-subtle)'
    }}>
      <div className="text-xs uppercase" style={{ color: 'var(--text-faint)' }}>
        {label}
      </div>
      <div className="text-2xl font-bold mt-2" style={{
        color: color === 'success' ? 'var(--brand-emerald)' :
               color === 'danger' ? 'var(--status-danger)' :
               'var(--text-primary)'
      }}>
        {value}
      </div>
      {subtitle && (
        <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          {subtitle}
        </div>
      )}
      {trend && (
        <div className="text-xs mt-1" style={{
          color: trend > 0 ? 'var(--brand-emerald)' : 'var(--status-danger)'
        }}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}
```

---

## 📦 **STEP-BY-STEP CONVERSION**

### **Step 1: Install Dependencies**

Update `/package.json`:

```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "@tanstack/react-query": "^5.0.0"
  }
}
```

---

### **Step 2: Add React Query Provider**

Update `/src/app/App.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* ... rest of your app ... */}
    </QueryClientProvider>
  );
}
```

---

### **Step 3: Create API Service** (Already Done)

File: `/src/app/services/api.ts`

This provides:
- `sitesApi.getStats(siteId)`
- `metersApi.getBySite(siteId)`
- `alertsApi.getBySite(siteId)`
- And 20+ more API methods

---

### **Step 4: Replace useLiveData with useQuery**

**FIND:**
```tsx
const { meters, summary } = useLiveData();
```

**REPLACE WITH:**
```tsx
const { data: summary } = useQuery({
  queryKey: ['site-stats', SITE_ID],
  queryFn: () => sitesApi.getStats(SITE_ID).then(r => r.data),
  refetchInterval: 30000,
});

const { data: meters } = useQuery({
  queryKey: ['meters', SITE_ID],
  queryFn: () => metersApi.getBySite(SITE_ID).then(r => r.data),
  refetchInterval: 15000,
});
```

---

### **Step 5: Add Loading States**

```tsx
const { data: summary, isLoading, error } = useQuery({
  queryKey: ['site-stats', SITE_ID],
  queryFn: () => sitesApi.getStats(SITE_ID).then(r => r.data),
});

if (isLoading) {
  return <div>Loading...</div>;
}

if (error) {
  return <div>Error: {error.message}</div>;
}
```

---

## 🎯 **PAGES TO CONVERT**

### **Priority 1: Core Pages**
1. ✅ Dashboard (`/src/app/pages/Dashboard.tsx`)
2. ✅ Meters (`/src/app/pages/Meters.tsx`)
3. ✅ Alerts (`/src/app/pages/Alerts.tsx`)
4. ✅ Analytics (`/src/app/pages/Analytics.tsx`)

### **Priority 2: Advanced Pages**
5. ✅ AI Insights (`/src/app/pages/AIInsights.tsx`)
6. ✅ RBF Reports (`/src/app/pages/RBFReports.tsx`)
7. ✅ Site Planning (`/src/app/pages/SitePlanning.tsx`)

### **Priority 3: Mockups (Keep as-is)**
8. ⚠️ USSD Portal - Keep as mockup (no backend needed)
9. ⚠️ Agent App - Keep as mockup (no backend needed)

---

## 🔄 **API ENDPOINTS REFERENCE**

### **Sites API**

```tsx
// Get all sites
const { data } = useQuery({
  queryKey: ['sites'],
  queryFn: () => sitesApi.getAll().then(r => r.data),
});

// Get site stats
const { data } = useQuery({
  queryKey: ['site-stats', siteId],
  queryFn: () => sitesApi.getStats(siteId).then(r => r.data),
});
```

**Response format:**
```json
{
  "site_id": "uuid",
  "name": "Ukerewe Island",
  "meters_total": 10,
  "meters_connected": 8,
  "total_load_w": 3420,
  "utilization_pct": 6.8,
  "revenue_today_tzs": 45600,
  "revenue_trend_pct": 12.5
}
```

---

### **Meters API**

```tsx
// Get meters by site
const { data } = useQuery({
  queryKey: ['meters', siteId],
  queryFn: () => metersApi.getBySite(siteId).then(r => r.data),
});

// Get meter readings (last 24 hours)
const { data } = useQuery({
  queryKey: ['meter-readings', meterId],
  queryFn: () => metersApi.getReadings(meterId, { hours: 24 }).then(r => r.data),
});
```

**Response format:**
```json
[
  {
    "id": "uuid",
    "meter_ref": "MTR-001",
    "customer_name": "Amina Hassan",
    "customer_type": "residential",
    "balance_tzs": 5200,
    "power_w": 240,
    "voltage_v": 230,
    "current_a": 1.04,
    "connected": true,
    "status": "active"
  }
]
```

---

### **Customers API**

```tsx
// Get customer profile
const { data } = useQuery({
  queryKey: ['customer', customerId],
  queryFn: () => customersApi.getById(customerId).then(r => r.data),
});

// Top up customer (mutation)
const mutation = useMutation({
  mutationFn: ({ customerId, amount, method }) =>
    customersApi.topup(customerId, {
      amount_tzs: amount,
      payment_method: method,
    }),
  onSuccess: () => {
    queryClient.invalidateQueries(['customer', customerId]);
  },
});

// Usage:
mutation.mutate({
  customerId: 'uuid',
  amount: 5000,
  method: 'mpesa',
});
```

**Response format:**
```json
{
  "token": "1234-5678-9012-3456-7890",
  "amount_tzs": 5000,
  "kwh_credited": 2.92,
  "new_balance_tzs": 10200
}
```

---

### **Alerts API**

```tsx
// Get alerts
const { data } = useQuery({
  queryKey: ['alerts', siteId],
  queryFn: () => alertsApi.getBySite(siteId, { status: 'unresolved' }).then(r => r.data),
});

// Resolve alert (mutation)
const mutation = useMutation({
  mutationFn: ({ alertId, notes }) =>
    alertsApi.resolve(alertId, {
      notes,
      agent_id: 'current-user-id',
    }),
  onSuccess: () => {
    queryClient.invalidateQueries(['alerts']);
  },
});
```

---

### **AI & Advanced Features**

```tsx
// Load forecast
const { data } = useQuery({
  queryKey: ['load-forecast', siteId],
  queryFn: () => aiApi.loadForecast(siteId).then(r => r.data),
});

// Credit scores
const { data } = useQuery({
  queryKey: ['credit-scores', siteId],
  queryFn: () => aiApi.creditScores(siteId).then(r => r.data),
});

// Site health
const { data } = useQuery({
  queryKey: ['site-health', siteId],
  queryFn: () => aiApi.siteHealth(siteId).then(r => r.data),
});

// Portfolio
const { data } = useQuery({
  queryKey: ['portfolio', operatorId],
  queryFn: () => portfolioApi.getByOperator(operatorId).then(r => r.data),
});

// Fintech - RBF
const { data } = useQuery({
  queryKey: ['rbf', siteId],
  queryFn: () => fintechApi.getRbf(siteId).then(r => r.data),
});

// Fintech - Carbon credits
const { data } = useQuery({
  queryKey: ['carbon', siteId],
  queryFn: () => fintechApi.getCarbon(siteId).then(r => r.data),
});
```

---

## 🚨 **ERROR HANDLING**

### **Pattern 1: Show Error Message**

```tsx
const { data, isLoading, error } = useQuery({
  queryKey: ['meters', siteId],
  queryFn: () => metersApi.getBySite(siteId).then(r => r.data),
});

if (error) {
  return (
    <div className="p-8">
      <div className="rounded-lg border p-4" style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--status-danger)',
        color: 'var(--status-danger)'
      }}>
        <div className="font-bold mb-2">Failed to load meters</div>
        <div className="text-sm">{error.message}</div>
        <button 
          onClick={() => queryClient.invalidateQueries(['meters'])}
          className="mt-3 px-4 py-2 rounded"
          style={{ backgroundColor: 'var(--status-danger)' }}
        >
          Retry
        </button>
      </div>
    </div>
  );
}
```

---

### **Pattern 2: Fallback to Empty State**

```tsx
const { data: meters = [] } = useQuery({
  queryKey: ['meters', siteId],
  queryFn: () => metersApi.getBySite(siteId).then(r => r.data),
  onError: (error) => {
    console.error('Failed to load meters:', error);
  },
});

// meters will be empty array [] on error
```

---

### **Pattern 3: Toast Notification**

```tsx
import { toast } from 'sonner';

const { data } = useQuery({
  queryKey: ['meters', siteId],
  queryFn: () => metersApi.getBySite(siteId).then(r => r.data),
  onError: (error) => {
    toast.error('Failed to load meters', {
      description: error.message,
    });
  },
});
```

---

## 🔄 **MUTATIONS (POST/PUT/DELETE)**

### **Example: Top Up Customer**

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '../services/api';
import { toast } from 'sonner';

function TopUpButton({ customerId }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: { amount_tzs: number; payment_method: string }) =>
      customersApi.topup(customerId, data),
    onSuccess: (response) => {
      // Invalidate customer data to refetch
      queryClient.invalidateQueries(['customer', customerId]);
      queryClient.invalidateQueries(['meters']);
      
      // Show success message
      toast.success('Token generated!', {
        description: `Token: ${response.data.token}`,
      });
    },
    onError: (error: any) => {
      toast.error('Top-up failed', {
        description: error.response?.data?.error || error.message,
      });
    },
  });

  const handleTopUp = () => {
    mutation.mutate({
      amount_tzs: 5000,
      payment_method: 'mpesa',
    });
  };

  return (
    <button
      onClick={handleTopUp}
      disabled={mutation.isPending}
      className="px-4 py-2 rounded"
      style={{ backgroundColor: 'var(--brand-emerald)' }}
    >
      {mutation.isPending ? 'Processing...' : 'Top Up TZS 5,000'}
    </button>
  );
}
```

---

## 📊 **REAL-TIME UPDATES**

### **Auto-refresh every 30 seconds**

```tsx
const { data } = useQuery({
  queryKey: ['site-stats', siteId],
  queryFn: () => sitesApi.getStats(siteId).then(r => r.data),
  refetchInterval: 30000, // 30 seconds
});
```

### **Manual refresh**

```tsx
const queryClient = useQueryClient();

function RefreshButton() {
  const handleRefresh = () => {
    queryClient.invalidateQueries(['site-stats']);
    toast.success('Dashboard refreshed');
  };

  return <button onClick={handleRefresh}>↻ Refresh</button>;
}
```

---

## ✅ **FINAL CHECKLIST**

Before converting a page:

- [ ] API service method exists in `/src/app/services/api.ts`
- [ ] Backend endpoint is implemented
- [ ] React Query provider added to App.tsx
- [ ] Dependencies installed (axios, @tanstack/react-query)
- [ ] Environment variable `VITE_API_URL` set
- [ ] Backend is deployed and accessible

After converting:

- [ ] Loading state implemented
- [ ] Error handling added
- [ ] Data refreshes automatically
- [ ] Mutations invalidate cache
- [ ] Console has no errors
- [ ] UI matches design system

---

**Pro Tip:** Start with one simple page (like Meters) before converting complex pages (like Dashboard). Test thoroughly before moving to the next page.
