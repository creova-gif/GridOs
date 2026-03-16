import { useState } from 'react';
import { Server, Lock, Globe, Webhook, Zap, Database, FileText, Shield, CheckCircle } from 'lucide-react';

type Category = 'all' | 'public' | 'protected' | 'agent' | 'webhooks';

export default function APIDocumentation() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');

  const apiEndpoints = [
    // Public Endpoints
    {
      method: 'GET',
      path: '/health',
      category: 'public',
      description: 'Health check endpoint with version info',
      auth: 'None',
      response: '{ status: "ok", version: "3.0.0", features: 28 }'
    },
    {
      method: 'POST',
      path: '/ussd',
      category: 'public',
      description: 'USSD handler for Africa\'s Talking integration',
      auth: 'None',
      response: 'USSD response text'
    },
    {
      method: 'POST',
      path: '/api/onboarding',
      category: 'public',
      description: 'Operator self-onboarding (creates account)',
      auth: 'None',
      response: '{ success: true, operatorId: "..." }'
    },

    // M-Pesa Webhooks
    {
      method: 'POST',
      path: '/webhooks/mpesa/stk',
      category: 'webhooks',
      description: 'M-Pesa STK Push callback from Safaricom Daraja',
      auth: 'None (Safaricom)',
      response: '{ ResultCode: 0, ResultDesc: "Accepted" }'
    },
    {
      method: 'POST',
      path: '/webhooks/mpesa/c2b',
      category: 'webhooks',
      description: 'M-Pesa C2B callback for customer payments',
      auth: 'None (Safaricom)',
      response: '{ ResultCode: 0 }'
    },
    {
      method: 'POST',
      path: '/webhooks/mpesa/confirm',
      category: 'webhooks',
      description: 'M-Pesa confirmation callback',
      auth: 'None (Safaricom)',
      response: '{ ResultCode: 0, ResultDesc: "Accepted" }'
    },

    // Protected Endpoints - Sites
    {
      method: 'GET',
      path: '/api/sites',
      category: 'protected',
      description: 'Get all sites for authenticated operator',
      auth: 'Bearer JWT',
      response: '{ sites: [...] }'
    },
    {
      method: 'POST',
      path: '/api/sites',
      category: 'protected',
      description: 'Create new site',
      auth: 'Bearer JWT',
      response: '{ site: {...} }'
    },

    // Protected Endpoints - Meters
    {
      method: 'GET',
      path: '/api/meters',
      category: 'protected',
      description: 'Get all meters with real-time data',
      auth: 'Bearer JWT',
      response: '{ meters: [...] }'
    },
    {
      method: 'GET',
      path: '/api/meters/:id',
      category: 'protected',
      description: 'Get single meter with historical data',
      auth: 'Bearer JWT',
      response: '{ meter: {...} }'
    },

    // Protected Endpoints - Customers
    {
      method: 'GET',
      path: '/api/customers',
      category: 'protected',
      description: 'Get all customers for operator',
      auth: 'Bearer JWT',
      response: '{ customers: [...] }'
    },
    {
      method: 'POST',
      path: '/api/customers',
      category: 'protected',
      description: 'Create new customer',
      auth: 'Bearer JWT',
      response: '{ customer: {...} }'
    },

    // Protected Endpoints - Payments
    {
      method: 'GET',
      path: '/api/payments',
      category: 'protected',
      description: 'Get payment history',
      auth: 'Bearer JWT',
      response: '{ payments: [...] }'
    },
    {
      method: 'POST',
      path: '/api/payments',
      category: 'protected',
      description: 'Process payment and generate STS token',
      auth: 'Bearer JWT',
      response: '{ token: "XXXX-XXXX-...", success: true }'
    },

    // AI Endpoints
    {
      method: 'GET',
      path: '/api/ai/insights',
      category: 'protected',
      description: 'Get AI-generated insights for operator',
      auth: 'Bearer JWT',
      response: '{ insights: [...] }'
    },
    {
      method: 'GET',
      path: '/api/ai/predictions',
      category: 'protected',
      description: 'Get load forecasting predictions',
      auth: 'Bearer JWT',
      response: '{ predictions: [...] }'
    },

    // Reports
    {
      method: 'GET',
      path: '/api/reports/revenue',
      category: 'protected',
      description: 'Generate revenue report',
      auth: 'Bearer JWT',
      response: '{ report: {...} }'
    },
    {
      method: 'GET',
      path: '/api/reports/operational',
      category: 'protected',
      description: 'Generate operational metrics report',
      auth: 'Bearer JWT',
      response: '{ report: {...} }'
    },

    // Site Planning
    {
      method: 'GET',
      path: '/api/planning/sites',
      category: 'protected',
      description: 'Get site planning data and recommendations',
      auth: 'Bearer JWT',
      response: '{ sites: [...], recommendations: [...] }'
    },

    // Fintech
    {
      method: 'GET',
      path: '/api/fintech/rbf',
      category: 'protected',
      description: 'Get RBF (Results-Based Financing) status',
      auth: 'Bearer JWT',
      response: '{ rbf: {...} }'
    },
    {
      method: 'GET',
      path: '/api/fintech/carbon',
      category: 'protected',
      description: 'Get carbon credit calculations',
      auth: 'Bearer JWT',
      response: '{ credits: {...} }'
    },

    // Operations
    {
      method: 'GET',
      path: '/api/operations/kpis',
      category: 'protected',
      description: 'Get operational KPIs',
      auth: 'Bearer JWT',
      response: '{ kpis: {...} }'
    },

    // Portfolio
    {
      method: 'GET',
      path: '/api/portfolio/summary',
      category: 'protected',
      description: 'Get portfolio summary',
      auth: 'Bearer JWT',
      response: '{ summary: {...} }'
    },

    // Disputes (v3 NEW)
    {
      method: 'POST',
      path: '/api/disputes/:id/open',
      category: 'protected',
      description: 'Open billing dispute',
      auth: 'Bearer JWT',
      response: '{ dispute: {...} }'
    },
    {
      method: 'POST',
      path: '/api/disputes/:id/resolve',
      category: 'protected',
      description: 'Resolve billing dispute',
      auth: 'Bearer JWT',
      response: '{ success: true }'
    },

    // Tariffs (v3 NEW)
    {
      method: 'PATCH',
      path: '/api/tariffs/:site_id',
      category: 'protected',
      description: 'Update tariff structure for site',
      auth: 'Bearer JWT',
      response: '{ tariff: {...} }'
    },

    // Exports (v3 NEW)
    {
      method: 'GET',
      path: '/api/export/customers/:site_id',
      category: 'protected',
      description: 'Export customers as CSV',
      auth: 'Bearer JWT',
      response: 'CSV file download'
    },
    {
      method: 'GET',
      path: '/api/export/billing/:site_id',
      category: 'protected',
      description: 'Export billing data as CSV',
      auth: 'Bearer JWT',
      response: 'CSV file download'
    },
    {
      method: 'GET',
      path: '/api/export/rea/:site_id',
      category: 'protected',
      description: 'Export data in REA grant format',
      auth: 'Bearer JWT',
      response: 'CSV file download'
    },

    // Agent Endpoints
    {
      method: 'POST',
      path: '/api/agent/sync/payment',
      category: 'agent',
      description: 'Sync payment from field agent app',
      auth: 'Bearer JWT',
      response: '{ success: true }'
    },
    {
      method: 'POST',
      path: '/api/agent/sync/inspection',
      category: 'agent',
      description: 'Sync meter inspection from field agent',
      auth: 'Bearer JWT',
      response: '{ success: true }'
    },
    {
      method: 'POST',
      path: '/api/agent/sync/token-confirm',
      category: 'agent',
      description: 'Confirm STS token delivery to customer',
      auth: 'Bearer JWT',
      response: '{ success: true }'
    },
    {
      method: 'GET',
      path: '/api/agent/customers',
      category: 'agent',
      description: 'Get customer list for agent app',
      auth: 'Bearer JWT',
      response: '{ customers: [...] }'
    },
    {
      method: 'GET',
      path: '/api/agent/tokens/prefetch',
      category: 'agent',
      description: 'Prefetch available STS tokens for offline mode',
      auth: 'Bearer JWT',
      response: '{ tokens: [...] }'
    }
  ];

  const filteredEndpoints = selectedCategory === 'all' 
    ? apiEndpoints 
    : apiEndpoints.filter(ep => ep.category === selectedCategory);

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'var(--status-info)';
      case 'POST': return 'var(--brand-emerald)';
      case 'PATCH': return 'var(--status-warn)';
      case 'DELETE': return 'var(--status-danger)';
      default: return 'var(--text-muted)';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'public': return <Globe className="w-4 h-4" />;
      case 'protected': return <Lock className="w-4 h-4" />;
      case 'agent': return <Zap className="w-4 h-4" />;
      case 'webhooks': return <Webhook className="w-4 h-4" />;
      default: return <Server className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
          <Server className="w-8 h-8" style={{ color: 'var(--brand-emerald)' }} />
          GridOS API v3.0 Documentation
        </h1>
        <p className="mt-2" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-body)' }}>
          Complete REST API reference · 28 features · JWT authentication · All routes wired
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-lg border" style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--bg-border-subtle)'
        }}>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5" style={{ color: 'var(--brand-emerald)' }} />
            <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Total Endpoints
            </div>
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--brand-emerald)' }}>
            {apiEndpoints.length}
          </div>
        </div>

        <div className="p-5 rounded-lg border" style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--bg-border-subtle)'
        }}>
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-5 h-5" style={{ color: 'var(--status-info)' }} />
            <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Public Routes
            </div>
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--status-info)' }}>
            {apiEndpoints.filter(ep => ep.category === 'public').length}
          </div>
        </div>

        <div className="p-5 rounded-lg border" style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--bg-border-subtle)'
        }}>
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-5 h-5" style={{ color: 'var(--status-warn)' }} />
            <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Protected Routes
            </div>
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--status-warn)' }}>
            {apiEndpoints.filter(ep => ep.category === 'protected').length}
          </div>
        </div>

        <div className="p-5 rounded-lg border" style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--bg-border-subtle)'
        }}>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5" style={{ color: 'var(--brand-emerald)' }} />
            <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Agent Endpoints
            </div>
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--brand-emerald)' }}>
            {apiEndpoints.filter(ep => ep.category === 'agent').length}
          </div>
        </div>
      </div>

      {/* New in v3.0 */}
      <div className="p-5 rounded-lg border-2" style={{
        backgroundColor: 'var(--brand-dim)',
        borderColor: 'var(--brand-emerald)'
      }}>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Zap className="w-5 h-5" style={{ color: 'var(--brand-emerald)' }} />
          New in v3.0
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" style={{ color: 'var(--brand-emerald)' }} />
            Billing Disputes API
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" style={{ color: 'var(--brand-emerald)' }} />
            Dynamic Tariff Management
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" style={{ color: 'var(--brand-emerald)' }} />
            CSV/Excel Export Endpoints
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" style={{ color: 'var(--brand-emerald)' }} />
            M-Pesa Daraja Integration
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" style={{ color: 'var(--brand-emerald)' }} />
            WhatsApp Daily Digest Cron
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" style={{ color: 'var(--brand-emerald)' }} />
            JWT Auth on All Protected Routes
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" style={{ color: 'var(--brand-emerald)' }} />
            RLS Isolation Tests
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" style={{ color: 'var(--brand-emerald)' }} />
            REA Grant Format Export
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'public', 'protected', 'agent', 'webhooks'] as Category[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className="px-4 py-2 rounded-lg border transition-all text-sm font-medium capitalize"
            style={{
              backgroundColor: selectedCategory === cat ? 'var(--brand-emerald)' : 'var(--bg-surface)',
              borderColor: selectedCategory === cat ? 'var(--brand-emerald)' : 'var(--bg-border-mid)',
              color: selectedCategory === cat ? '#ffffff' : 'var(--text-primary)'
            }}
          >
            {cat} {cat !== 'all' && `(${apiEndpoints.filter(ep => ep.category === cat).length})`}
          </button>
        ))}
      </div>

      {/* Endpoints List */}
      <div className="space-y-3">
        {filteredEndpoints.map((endpoint, idx) => (
          <div
            key={idx}
            className="p-5 rounded-lg border hover:border-emerald-500 transition-colors"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--bg-border-subtle)'
            }}
          >
            <div className="flex items-start gap-4">
              {/* Method Badge */}
              <div
                className="px-3 py-1 rounded text-xs font-bold flex-shrink-0"
                style={{
                  backgroundColor: getMethodColor(endpoint.method),
                  color: '#ffffff'
                }}
              >
                {endpoint.method}
              </div>

              {/* Endpoint Details */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <code className="text-sm font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                    {endpoint.path}
                  </code>
                  <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded" style={{
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-muted)'
                  }}>
                    {getCategoryIcon(endpoint.category)}
                    <span className="capitalize">{endpoint.category}</span>
                  </div>
                </div>

                <div className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                  {endpoint.description}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span style={{ color: 'var(--text-faint)' }}>Authentication:</span>
                    <code className="ml-2 px-2 py-1 rounded" style={{
                      backgroundColor: 'var(--bg-surface)',
                      color: endpoint.auth === 'None' || endpoint.auth === 'None (Safaricom)' 
                        ? 'var(--status-info)' 
                        : 'var(--status-warn)'
                    }}>
                      {endpoint.auth}
                    </code>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-faint)' }}>Response:</span>
                    <code className="ml-2 px-2 py-1 rounded text-xs" style={{
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--brand-emerald)'
                    }}>
                      {endpoint.response}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Architecture Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-lg border" style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--bg-border-subtle)'
        }}>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Database className="w-5 h-5" style={{ color: 'var(--brand-emerald)' }} />
            Technology Stack
          </h3>
          <div className="space-y-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--brand-emerald)' }} />
              <strong>Runtime:</strong> Node.js / Express.js
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--brand-emerald)' }} />
              <strong>Database:</strong> Supabase PostgreSQL + TimescaleDB
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--brand-emerald)' }} />
              <strong>MQTT:</strong> HiveMQ Cloud for meter data
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--brand-emerald)' }} />
              <strong>Auth:</strong> Supabase JWT validation
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--brand-emerald)' }} />
              <strong>Monitoring:</strong> Sentry error tracking
            </div>
          </div>
        </div>

        <div className="p-5 rounded-lg border" style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--bg-border-subtle)'
        }}>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Shield className="w-5 h-5" style={{ color: 'var(--status-warn)' }} />
            Security Features
          </h3>
          <div className="space-y-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--status-warn)' }} />
              JWT verification on all protected routes
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--status-warn)' }} />
              Multi-tenant isolation via RLS
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--status-warn)' }} />
              Rate limiting (300 req/min per IP)
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--status-warn)' }} />
              Helmet.js security headers
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--status-warn)' }} />
              CORS configured for frontend origin
            </div>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      <div className="p-5 rounded-lg border-l-4" style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--status-info)'
      }}>
        <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          Quick Start
        </h3>
        <div className="space-y-2 text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
          <div className="p-3 rounded" style={{ backgroundColor: 'var(--bg-card)' }}>
            # Start the server<br/>
            npm install && npm start
          </div>
          <div className="p-3 rounded" style={{ backgroundColor: 'var(--bg-card)' }}>
            # Health check<br/>
            curl http://localhost:4000/health
          </div>
          <div className="p-3 rounded" style={{ backgroundColor: 'var(--bg-card)' }}>
            # Authenticated request<br/>
            curl -H "Authorization: Bearer YOUR_JWT" http://localhost:4000/api/sites
          </div>
        </div>
      </div>
    </div>
  );
}
