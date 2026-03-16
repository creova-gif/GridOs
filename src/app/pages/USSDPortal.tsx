import { useState } from 'react';
import { Smartphone, Signal, User, HelpCircle, Clock, DollarSign, Zap, MessageSquare } from 'lucide-react';
import CoverageArithmetic from '../components/CoverageArithmetic';

export default function USSDPortal() {
  const [activeTab, setActiveTab] = useState<'overview' | 'ussd' | 'agent' | 'why'>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: HelpCircle },
    { id: 'ussd', label: 'USSD Deep Dive', icon: Smartphone },
    { id: 'agent', label: 'Agent App Deep Dive', icon: User },
    { id: 'why', label: 'Why Both Exist', icon: Signal },
  ] as const;

  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
          <Smartphone className="w-7 h-7" style={{ color: 'var(--brand-emerald)' }} />
          Customer-Facing Channels
        </h1>
        <p className="mt-1" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-body)' }}>
          USSD Portal + Agent App — the two channels that work without internet and without smartphones
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b" style={{ borderColor: 'var(--bg-border-subtle)' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all"
              style={{
                color: isActive ? 'var(--brand-emerald)' : 'var(--text-muted)',
                borderBottom: isActive ? '2px solid var(--brand-emerald)' : '2px solid transparent',
                backgroundColor: isActive ? 'var(--bg-surface)' : 'transparent',
              }}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="animate-fadeIn">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'ussd' && <USSDDeepDiveTab />}
        {activeTab === 'agent' && <AgentDeepDiveTab />}
        {activeTab === 'why' && <WhyBothExistTab />}
      </div>
    </div>
  );
}

// ============================================================
// OVERVIEW TAB
// ============================================================
function OverviewTab() {
  const channels = [
    {
      name: 'USSD Portal',
      code: '*150*00#',
      icon: Smartphone,
      color: 'var(--brand-emerald)',
      audience: '82% of rural customers',
      requirement: 'Basic Nokia phone',
      noNeed: 'No smartphone, no internet',
      flow: 'Dial → Kiswahili menu (45 sec) → 20-digit STS token via SMS',
      tech: "Africa's Talking, ~$0.01/transaction, 24/7 automated",
      fills: '80% gap (GSM users without smartphones)'
    },
    {
      name: 'Agent App',
      icon: User,
      color: 'var(--status-info)',
      audience: 'Field agents + 2% customers with NO phone',
      requirement: 'Motorcycle agent with Android phone',
      noNeed: 'Works 100% offline',
      flow: 'WiFi sync → all-day offline → auto-sync when GSM returns',
      tech: 'Local SQLite → auto-sync to Supabase',
      fills: "2% no phone + all cash payments (USSD can't handle cash)"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Channel cards */}
      <div className="grid grid-cols-2 gap-6">
        {channels.map((channel, index) => {
          const Icon = channel.icon;
          return (
            <div 
              key={index}
              className="rounded-lg border p-6 space-y-4"
              style={{ 
                backgroundColor: 'var(--bg-card)',
                borderColor: channel.color
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${channel.color}20` }}>
                    <Icon className="w-6 h-6" style={{ color: channel.color }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {channel.name}
                    </h3>
                    {channel.code && (
                      <div className="font-mono text-sm mt-0.5" style={{ color: channel.color }}>
                        {channel.code}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <Detail label="Audience" value={channel.audience} />
                <Detail label="Requirement" value={channel.requirement} />
                <Detail label="No need for" value={channel.noNeed} color="var(--brand-emerald)" />
                <Detail label="Flow" value={channel.flow} />
                <Detail label="Tech" value={channel.tech} mono />
                <Detail label="Gap filled" value={channel.fills} color={channel.color} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Coverage arithmetic preview */}
      <div className="rounded-lg border p-6" style={{ 
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--bg-border-subtle)'
      }}>
        <CoverageArithmetic />
      </div>
    </div>
  );
}

// ============================================================
// USSD DEEP DIVE TAB
// ============================================================
function USSDDeepDiveTab() {
  const screens = [
    {
      title: 'Main menu',
      subtitle: 'Habari Amina!',
      balance: 'Salio: TZS 4,980',
      options: [
        '1. Angalia salio',
        '2. Nunua tokeni',
        '3. Ripoti tatizo',
        '4. Malipo ya mwisho',
        '5. Wasiliana na wakala'
      ]
    },
    {
      title: 'Check balance',
      subtitle: 'Salio lako:',
      balance: 'TZS 4,980',
      options: [
        'Hali: Imeunganishwa',
        'Mita: MTR-001',
        '',
        'Nunua tokeni:',
        '*150*00*2#'
      ]
    },
    {
      title: 'Buy tokens — amount',
      subtitle: 'Weka kiasi:',
      balance: '(angalau TZS 500)',
      options: [
        'Mfano: 2000, 5000',
        '',
        '(Andika kiasi)'
      ]
    },
    {
      title: 'Confirm purchase',
      subtitle: 'Thibitisha:',
      balance: 'TZS 5,000 = 2.92 kWh',
      options: [
        '1. Thibitisha',
        '2. Ghairi'
      ]
    },
    {
      title: 'Token delivered',
      subtitle: 'Tokeni yako:',
      balance: '1234-5678',
      options: [
        '9012-3456-7890',
        '',
        'SMS imetumwa',
        '+255711***001'
      ]
    }
  ];

  const specs = [
    { icon: Clock, label: 'Session time', value: '< 45 seconds', color: 'var(--brand-emerald)' },
    { icon: DollarSign, label: 'Cost per transaction', value: '~$0.01 USD', color: 'var(--brand-emerald)' },
    { icon: Signal, label: 'Availability', value: '24/7 automated', color: 'var(--brand-emerald)' },
    { icon: MessageSquare, label: 'Language', value: 'Kiswahili-first', color: 'var(--status-info)' },
  ];

  return (
    <div className="space-y-6">
      {/* Specs row */}
      <div className="grid grid-cols-4 gap-4">
        {specs.map((spec, index) => {
          const Icon = spec.icon;
          return (
            <div 
              key={index}
              className="rounded-lg border p-4 space-y-2"
              style={{ 
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--bg-border-subtle)'
              }}
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" style={{ color: spec.color }} />
                <div className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  {spec.label}
                </div>
              </div>
              <div className="text-lg font-semibold" style={{ color: spec.color }}>
                {spec.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Flow screens */}
      <div>
        <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          USSD Flow — 5 screen journey
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {screens.map((screen, index) => (
            <div
              key={index}
              className="flex-shrink-0 rounded-lg border p-6 space-y-4"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--brand-emerald)',
                width: '280px'
              }}
            >
              {/* Header */}
              <div className="border-b pb-3" style={{ borderColor: 'var(--bg-border-subtle)' }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs uppercase tracking-wider" style={{
                    color: 'var(--brand-emerald)',
                    fontSize: 'var(--text-label)'
                  }}>
                    {screen.title}
                  </div>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono" style={{
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-muted)'
                  }}>
                    {index + 1}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div>
                <div className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {screen.subtitle}
                </div>
                <div className="mb-4" style={{ color: 'var(--text-primary)' }}>
                  {screen.balance}
                </div>

                {/* Options */}
                <div className="space-y-2">
                  {screen.options.map((option, i) => (
                    <div
                      key={i}
                      style={{
                        color: 'var(--text-muted)',
                        fontSize: 'var(--text-body)',
                        minHeight: option ? '20px' : '8px'
                      }}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technical implementation */}
      <div className="rounded-lg border p-6 space-y-4" style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--bg-border-subtle)'
      }}>
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Technical Implementation
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <Detail label="Provider" value="Africa's Talking USSD" />
          <Detail label="USSD Code" value="*150*00# (sandbox)" mono />
          <Detail label="Language" value="Kiswahili UI" />
          <Detail label="Compatibility" value="All GSM handsets" />
          <Detail label="Data cost" value="Zero (runs on GSM)" color="var(--brand-emerald)" />
          <Detail label="Session timeout" value="90 seconds" mono />
          <Detail label="Token format" value="20-digit STS standard" mono />
          <Detail label="Delivery" value="SMS to registered number" />
        </div>
      </div>

      {/* How it works - Architecture clarification */}
      <div className="rounded-lg border p-6 space-y-4" style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--brand-emerald)'
      }}>
        <h3 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--brand-emerald)' }}>
          <Zap className="w-4 h-4" />
          How GridOS generates tokens (cloud architecture)
        </h3>
        <div className="space-y-3 text-sm" style={{ color: 'var(--text-muted)' }}>
          <p>
            <strong style={{ color: 'var(--text-primary)' }}>GridOS does NOT install on the meter.</strong> The meter already has its own firmware (Hexing, SparkMeter, Conlog). GridOS is a cloud platform that receives meter readings via MQTT every 15 minutes.
          </p>
          <p>
            When a customer pays via USSD: <span style={{ color: 'var(--brand-emerald)' }}>GridOS backend calculates kWh from payment amount → generates 20-digit STS token (international standard) → sends token via SMS</span>. Customer enters token on meter keypad. Meter validates and credits energy.
          </p>
          <p>
            GridOS never touches the meter directly — it just generates the correct STS token based on the payment. This works with ANY meter that accepts STS tokens (universal standard across East Africa).
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// AGENT APP DEEP DIVE TAB
// ============================================================
function AgentDeepDiveTab() {
  const workflow = [
    {
      time: '06:00 AM',
      step: 'Morning sync',
      description: 'James connects to WiFi at home, app syncs customer list + balances',
      icon: Zap,
      color: 'var(--brand-emerald)'
    },
    {
      time: '07:00 AM',
      step: 'Offline all day',
      description: 'Rides motorcycle around Ukerewe Island. Zero connectivity. All actions save to local SQLite.',
      icon: Signal,
      color: 'var(--status-warn)'
    },
    {
      time: '06:00 PM',
      step: 'Auto-sync when GSM returns',
      description: 'Billing events fire, customer balances update, SMS confirmations send, dashboard updates',
      icon: Zap,
      color: 'var(--brand-emerald)'
    }
  ];

  const features = [
    {
      category: 'Offline capability',
      items: [
        'Local SQLite database stores all customer data',
        'Works 100% offline for entire day',
        'Auto-sync when any connectivity returns (WiFi or GSM)',
        'Conflict resolution for duplicate entries'
      ]
    },
    {
      category: 'Cash handling',
      items: [
        'Issue tokens for cash payments on the spot',
        'Record collections with photo proof',
        'GPS location stamps every transaction',
        'Receipt printing via Bluetooth printer'
      ]
    },
    {
      category: 'Field operations',
      items: [
        'Meter inspections with photo evidence',
        'Customer registration and KYC',
        'Fault reporting and maintenance logs',
        'Route optimization for daily visits'
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Agent workflow */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Typical Agent Day — James on Ukerewe Island
        </h3>
        {workflow.map((item, index) => {
          const Icon = item.icon;
          return (
            <div 
              key={index}
              className="flex gap-4 rounded-lg border p-4"
              style={{ 
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--bg-border-subtle)'
              }}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${item.color}20` }}>
                  <Icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <div className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                  {item.time}
                </div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {item.step}
                </div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {item.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Features grid */}
      <div className="grid grid-cols-3 gap-4">
        {features.map((feature, index) => (
          <div 
            key={index}
            className="rounded-lg border p-4 space-y-3"
            style={{ 
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--bg-border-subtle)'
            }}
          >
            <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {feature.category}
            </h4>
            <div className="space-y-2">
              {feature.items.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: 'var(--brand-emerald)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Tech stack */}
      <div className="rounded-lg border p-6 space-y-4" style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--bg-border-subtle)'
      }}>
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Technical Stack
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <Detail label="Platform" value="React Native (Android)" />
          <Detail label="Local storage" value="SQLite database" mono />
          <Detail label="Sync engine" value="Background service (15min interval)" />
          <Detail label="Backend" value="Supabase PostgreSQL" mono />
          <Detail label="Photos" value="Compressed JPEG, uploaded on sync" />
          <Detail label="GPS" value="Location stamps every transaction" />
          <Detail label="Offline duration" value="Up to 7 days supported" color="var(--brand-emerald)" />
          <Detail label="Conflict resolution" value="Last-write-wins with timestamp" mono />
        </div>
      </div>

      {/* Architecture clarification */}
      <div className="rounded-lg border p-6 space-y-4" style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--status-info)'
      }}>
        <h3 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--status-info)' }}>
          <Zap className="w-4 h-4" />
          How agents interface with GridOS (cloud API, not meter hardware)
        </h3>
        <div className="space-y-3 text-sm" style={{ color: 'var(--text-muted)' }}>
          <p>
            <strong style={{ color: 'var(--text-primary)' }}>Agents never physically interact with meters.</strong> They interface with GridOS via the mobile app. When an agent collects cash payment, the app syncs to GridOS cloud → GridOS generates STS token → SMS sent to customer.
          </p>
          <p>
            The agent's phone stores customer data locally (SQLite) for offline access. When connectivity returns, the app syncs billing events to Supabase. GridOS processes the payment and triggers token generation server-side.
          </p>
          <p>
            This architecture means agents can operate for days without connectivity, and GridOS works with ANY prepayment meter — no custom hardware or meter firmware modifications required.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// WHY BOTH EXIST TAB
// ============================================================
function WhyBothExistTab() {
  return (
    <div className="space-y-6">
      <CoverageArithmetic />

      {/* Comparison table */}
      <div className="rounded-lg border overflow-hidden" style={{ 
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--bg-border-subtle)'
      }}>
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-surface)' }}>
              <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Feature
              </th>
              <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                USSD Portal
              </th>
              <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Agent App
              </th>
            </tr>
          </thead>
          <tbody>
            <TableRow feature="Requires smartphone?" ussd="No — basic phone only" agent="Agent has one" />
            <TableRow feature="Requires internet?" ussd="No — runs on GSM" agent="No — 100% offline" />
            <TableRow feature="Handles cash?" ussd="No — digital only" agent="Yes — primary use case" ussdColor="var(--status-danger)" agentColor="var(--brand-emerald)" />
            <TableRow feature="Customer coverage" ussd="80% (GSM without smartphone)" agent="2% (no phone) + cash" />
            <TableRow feature="Availability" ussd="24/7 automated" agent="Agent working hours" />
            <TableRow feature="Cost per transaction" ussd="~$0.01" agent="Agent salary + fuel" />
            <TableRow feature="Token delivery" ussd="SMS (instant)" agent="Issued on device" />
            <TableRow feature="Language" ussd="Kiswahili menus" agent="Agent speaks local dialect" />
          </tbody>
        </table>
      </div>

      {/* Bottom insight */}
      <div className="rounded-lg p-6 border" style={{ 
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--brand-emerald)'
      }}>
        <div className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Why both channels are essential
        </div>
        <div className="text-sm leading-relaxed space-y-2" style={{ color: 'var(--text-muted)' }}>
          <p>
            <strong>USSD</strong> covers the 80% gap between GSM coverage (98%) and smartphone ownership (18%). 
            It's automated, cheap ($0.01/txn), and works 24/7 without requiring operators to hire more staff.
          </p>
          <p>
            <strong>Agent App</strong> handles the 2% with no phone at all, plus ALL cash payments — which USSD 
            cannot process. In rural Tanzania, 60% of top-ups are still cash despite mobile money penetration.
          </p>
          <p>
            Together: <strong>100% customer coverage, zero gaps.</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// HELPER COMPONENTS
// ============================================================

function Detail({ label, value, color, mono }: { label: string; value: string; color?: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
      <div 
        className="text-sm"
        style={{ 
          color: color || 'var(--text-primary)',
          fontFamily: mono ? 'var(--font-mono)' : 'inherit'
        }}
      >
        {value}
      </div>
    </div>
  );
}

function TableRow({ feature, ussd, agent, ussdColor, agentColor }: {
  feature: string;
  ussd: string;
  agent: string;
  ussdColor?: string;
  agentColor?: string;
}) {
  return (
    <tr className="border-t" style={{ borderColor: 'var(--bg-border-subtle)' }}>
      <td className="p-4 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        {feature}
      </td>
      <td className="p-4 text-sm" style={{ color: ussdColor || 'var(--text-muted)' }}>
        {ussd}
      </td>
      <td className="p-4 text-sm" style={{ color: agentColor || 'var(--text-muted)' }}>
        {agent}
      </td>
    </tr>
  );
}