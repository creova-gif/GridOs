import { useState } from 'react';
import { Users, Search, Phone, Zap, DollarSign, TrendingUp } from 'lucide-react';
import { Card, Badge, Stat, HealthRing } from '../components/ui';

interface Customer {
  id: string;
  name: string;
  accountId: string;
  phone: string;
  type: 'residential' | 'commercial' | 'productive';
  meterId: string;
  balance: number;
  score: number;
  status: 'active' | 'low' | 'disconnected';
}

const CUSTOMERS: Customer[] = [
  {
    id: '1',
    name: 'Amina Hassan',
    accountId: 'ACC-000001',
    phone: '+255711001001',
    type: 'residential',
    meterId: 'MTR-001',
    balance: 4980,
    score: 82,
    status: 'active'
  },
  {
    id: '2',
    name: 'Joseph Mwangi',
    accountId: 'ACC-000002',
    phone: '+255711001002',
    type: 'commercial',
    meterId: 'MTR-002',
    balance: 12540,
    score: 95,
    status: 'active'
  },
  {
    id: '3',
    name: 'Fatuma Juma',
    accountId: 'ACC-000003',
    phone: '+255711001003',
    type: 'productive',
    meterId: 'MTR-003',
    balance: 8720,
    score: 88,
    status: 'active'
  },
  {
    id: '4',
    name: 'David Kimaro',
    accountId: 'ACC-000004',
    phone: '+255711001004',
    type: 'residential',
    meterId: 'MTR-004',
    balance: 6340,
    score: 76,
    status: 'active'
  },
  {
    id: '5',
    name: 'Grace Nyamweru',
    accountId: 'ACC-000005',
    phone: '+255711001005',
    type: 'residential',
    meterId: 'MTR-005',
    balance: 680,
    score: 45,
    status: 'low'
  },
  {
    id: '6',
    name: 'John Massawe',
    accountId: 'ACC-000006',
    phone: '+255711001006',
    type: 'residential',
    meterId: 'MTR-006',
    balance: 5120,
    score: 71,
    status: 'active'
  },
  {
    id: '7',
    name: 'Sarah Mbogo',
    accountId: 'ACC-000007',
    phone: '+255711001007',
    type: 'commercial',
    meterId: 'MTR-007',
    balance: 15200,
    score: 92,
    status: 'active'
  },
  {
    id: '8',
    name: 'Ali Khamis',
    accountId: 'ACC-000008',
    phone: '+255711001008',
    type: 'productive',
    meterId: 'MTR-008',
    balance: 9840,
    score: 85,
    status: 'active'
  },
  {
    id: '9',
    name: 'Maria Paulo',
    accountId: 'ACC-000009',
    phone: '+255711001009',
    type: 'residential',
    meterId: 'MTR-009',
    balance: 3200,
    score: 68,
    status: 'active'
  },
  {
    id: '10',
    name: 'Pastor Elias',
    accountId: 'ACC-000010',
    phone: '+255711001010',
    type: 'residential',
    meterId: 'MTR-010',
    balance: 0,
    score: 28,
    status: 'disconnected'
  }
];

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'disconnected' | 'productive'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(CUSTOMERS[0].id);

  // Calculate stats
  const total = CUSTOMERS.length;
  const active = CUSTOMERS.filter(c => c.balance > 0).length;
  const lowCredit = CUSTOMERS.filter(c => c.balance > 0 && c.balance < 3000).length;
  const disconnected = CUSTOMERS.filter(c => c.balance === 0).length;

  // Filter customers
  const filteredCustomers = CUSTOMERS.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.phone.includes(searchQuery);
    
    if (!matchesSearch) return false;

    if (filter === 'all') return true;
    if (filter === 'low') return customer.balance > 0 && customer.balance < 3000;
    if (filter === 'disconnected') return customer.balance === 0;
    if (filter === 'productive') return customer.type === 'productive';
    
    return true;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'residential': return 'var(--brand-emerald)';
      case 'commercial': return 'var(--status-info)';
      case 'productive': return 'var(--status-warn)';
      default: return 'var(--text-muted)';
    }
  };

  const getBalanceColor = (balance: number) => {
    if (balance === 0) return 'var(--status-danger)';
    if (balance < 3000) return 'var(--status-warn)';
    return 'var(--brand-emerald)';
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
          <Users className="w-7 h-7" style={{ color: 'var(--brand-emerald)' }} />
          Customers
        </h1>
        <p className="mt-1" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-body)' }}>
          {total} registered · Ukerewe Island · {active} active
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <Stat
          label="TOTAL"
          value={total.toString()}
          sub="registered"
        />
        <Stat
          label="ACTIVE"
          value={active.toString()}
          sub="balance > 0"
          color="var(--emerald)"
        />
        <Stat
          label="LOW CREDIT"
          value={lowCredit.toString()}
          sub="under TZS 3K"
          color="var(--amber)"
        />
        <Stat
          label="DISCONNECTED"
          value={disconnected.toString()}
          sub="zero balance"
          color="var(--red)"
        />
      </div>

      {/* Search & Filters */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search 
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" 
            style={{ color: 'var(--text-faint)' }}
          />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--bg-border-mid)',
              color: 'var(--text-primary)'
            }}
          />
        </div>
        
        <button
          onClick={() => setFilter('all')}
          className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: filter === 'all' ? 'var(--brand-dim)' : 'var(--bg-surface)',
            color: filter === 'all' ? 'var(--brand-emerald)' : 'var(--text-muted)',
            border: `1px solid ${filter === 'all' ? 'var(--brand-emerald)' : 'var(--bg-border-mid)'}`
          }}
        >
          All
        </button>
        
        <button
          onClick={() => setFilter('low')}
          className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: filter === 'low' ? 'var(--bg-surface)' : 'var(--bg-surface)',
            color: 'var(--text-muted)',
            border: `1px solid var(--bg-border-mid)`
          }}
        >
          Low credit
        </button>
        
        <button
          onClick={() => setFilter('disconnected')}
          className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: filter === 'disconnected' ? 'var(--bg-surface)' : 'var(--bg-surface)',
            color: 'var(--text-muted)',
            border: `1px solid var(--bg-border-mid)`
          }}
        >
          Zero bal.
        </button>
        
        <button
          onClick={() => setFilter('productive')}
          className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: filter === 'productive' ? 'var(--bg-surface)' : 'var(--bg-surface)',
            color: 'var(--text-muted)',
            border: `1px solid var(--bg-border-mid)`
          }}
        >
          Productive use
        </button>
      </div>

      {/* Customers Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--bg-border-subtle)' }}>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
                  Customer
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
                  Phone
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
                  Type
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
                  Meter
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
                  Balance
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
                  Score
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer.id)}
                  className="border-b cursor-pointer hover:bg-opacity-50 transition-colors"
                  style={{
                    borderColor: 'var(--bg-border-subtle)',
                    backgroundColor: selectedCustomer === customer.id ? 'var(--bg-surface)' : 'transparent',
                    borderLeft: selectedCustomer === customer.id ? '2px solid var(--brand-emerald)' : 'none'
                  }}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {customer.name}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                      {customer.accountId}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-sm flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                      <Phone className="w-3 h-3" />
                      {customer.phone}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge 
                      variant={customer.type === 'residential' ? 'success' : customer.type === 'commercial' ? 'info' : 'warning'}
                    >
                      {customer.type.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-sm flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                      <Zap className="w-3 h-3" />
                      {customer.meterId}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono font-semibold flex items-center gap-2" style={{ color: getBalanceColor(customer.balance) }}>
                      <DollarSign className="w-3 h-3" />
                      TZS {customer.balance.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center">
                      <HealthRing score={customer.score} size={32} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className="px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--text-muted)',
                        border: `1px solid var(--bg-border-mid)`
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        alert(`Top up ${customer.name}`);
                      }}
                    >
                      Top up
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
            <p style={{ color: 'var(--text-muted)' }}>
              No customers found matching your search
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}