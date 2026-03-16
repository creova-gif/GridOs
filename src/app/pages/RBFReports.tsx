import { useTranslation } from 'react-i18next';
import { FileText, Download, CheckCircle, Globe, Leaf, Zap } from 'lucide-react';
import { useState } from 'react';

export default function RBFReports() {
  const { t } = useTranslation();
  const [generating, setGenerating] = useState<string | null>(null);

  const reports = [
    {
      id: 'rea',
      title: 'REA Tanzania RBF Verification',
      icon: <CheckCircle className="w-6 h-6 text-green-400" />,
      description: 'Results-Based Financing verification report for REA LOIS system',
      status: 'Ready',
      format: 'JSON',
      lastGenerated: '2026-03-10',
      eligible: true,
    },
    {
      id: 'worldbank',
      title: 'World Bank ESMAP / Mission 300',
      icon: <Globe className="w-6 h-6 text-blue-400" />,
      description: 'Universal energy access tracking in ESMAP mini-grid template format',
      status: 'Ready',
      format: 'JSON/Excel',
      lastGenerated: '2026-03-01',
      eligible: true,
    },
    {
      id: 'ewura',
      title: 'EWURA Tariff Submission',
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
      description: 'Regulatory tariff review submission for EWURA Tanzania',
      status: 'Ready',
      format: 'PDF/JSON',
      lastGenerated: '2026-02-15',
      eligible: true,
    },
    {
      id: 'carbon',
      title: 'Carbon Credits (Verra/Gold Standard)',
      icon: <Leaf className="w-6 h-6 text-emerald-400" />,
      description: 'Annual carbon displacement report for VCS verification',
      status: 'Pending',
      format: 'PDF',
      lastGenerated: null,
      eligible: false,
      note: 'Requires 1 year of operation data'
    },
  ];

  const handleGenerate = (reportId: string) => {
    setGenerating(reportId);
    // Simulate API call
    setTimeout(() => {
      setGenerating(null);
      alert(`Report ${reportId} generated successfully!`);
    }, 2000);
  };

  const rbfEligibility = {
    connections: 10,
    minConnections: 50,
    collectionRate: 92,
    minCollectionRate: 70,
    loisRegistration: true,
    ewuraLicense: true,
    eligible: false, // Not enough connections yet
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <FileText className="w-7 h-7 text-emerald-400" />
          {t('reports.title')}
        </h1>
        <p className="text-slate-400 mt-1">
          Auto-generate compliance and verification reports for funders and regulators
        </p>
      </div>

      {/* RBF Eligibility Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">RBF Eligibility Status</h2>
        
        <div className="grid grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-slate-400">Connections</div>
            <div className={`text-2xl font-bold mt-1 ${
              rbfEligibility.connections >= rbfEligibility.minConnections
                ? 'text-green-400'
                : 'text-yellow-400'
            }`}>
              {rbfEligibility.connections} / {rbfEligibility.minConnections}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {rbfEligibility.connections >= rbfEligibility.minConnections ? '✓ Met' : '⚠ Below threshold'}
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-400">Collection Rate</div>
            <div className={`text-2xl font-bold mt-1 ${
              rbfEligibility.collectionRate >= rbfEligibility.minCollectionRate
                ? 'text-green-400'
                : 'text-red-400'
            }`}>
              {rbfEligibility.collectionRate}%
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {rbfEligibility.collectionRate >= rbfEligibility.minCollectionRate ? '✓ Met' : '✗ Not met'}
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-400">LOIS Registration</div>
            <div className={`text-2xl font-bold mt-1 ${
              rbfEligibility.loisRegistration ? 'text-green-400' : 'text-red-400'
            }`}>
              {rbfEligibility.loisRegistration ? '✓' : '✗'}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {rbfEligibility.loisRegistration ? 'Registered' : 'Not registered'}
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-400">EWURA License</div>
            <div className={`text-2xl font-bold mt-1 ${
              rbfEligibility.ewuraLicense ? 'text-green-400' : 'text-red-400'
            }`}>
              {rbfEligibility.ewuraLicense ? '✓' : '✗'}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {rbfEligibility.ewuraLicense ? 'Licensed' : 'Not licensed'}
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-sm text-yellow-400">
            <strong>Status:</strong> Not yet eligible for RBF subsidy (need 40 more connections).
            Continue registering customers to unlock up to $400/connection in REA funding.
          </p>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-2 gap-6">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-slate-900 rounded-lg p-6 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {report.icon}
                <div>
                  <h3 className="font-semibold text-slate-100">{report.title}</h3>
                  <p className="text-sm text-slate-400 mt-1">{report.description}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
              <div>
                <div className="text-slate-500">Status</div>
                <div className={`font-medium mt-1 ${
                  report.status === 'Ready' ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {report.status}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Format</div>
                <div className="font-medium text-slate-300 mt-1">{report.format}</div>
              </div>
              <div>
                <div className="text-slate-500">Last Generated</div>
                <div className="font-medium text-slate-300 mt-1">
                  {report.lastGenerated || 'Never'}
                </div>
              </div>
            </div>

            {report.note && (
              <div className="mb-4 p-3 bg-slate-800/50 rounded text-xs text-slate-400">
                {report.note}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleGenerate(report.id)}
                disabled={!report.eligible || generating === report.id}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  !report.eligible
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : generating === report.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
                }`}
              >
                {generating === report.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    {t('reports.generate')}
                  </>
                )}
              </button>
              {report.eligible && (
                <button className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2">
                  <Download className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Productive Use Analysis */}
      <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
        <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-3">
          <Zap className="w-5 h-5 text-purple-400" />
          Productive Use Identification
        </h2>

        <p className="text-sm text-slate-400 mb-4">
          Identify customers with productive-use consumption patterns for financing referrals to CLASP / ENGIE.
        </p>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-slate-400">Productive Users Identified</div>
            <div className="text-2xl font-bold text-purple-400 mt-1">2</div>
            <div className="text-xs text-slate-500 mt-1">St. Peter School, Emmanuel Shop</div>
          </div>
          <div>
            <div className="text-sm text-slate-400">Total Daily Consumption</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">18.4 kWh</div>
            <div className="text-xs text-slate-500 mt-1">from productive users</div>
          </div>
          <div>
            <div className="text-sm text-slate-400">Financing Eligible</div>
            <div className="text-2xl font-bold text-green-400 mt-1">2 / 2</div>
            <div className="text-xs text-slate-500 mt-1">credit score ≥ 50</div>
          </div>
        </div>

        <button className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium">
          Generate Productive Use Package
        </button>
      </div>
    </div>
  );
}
