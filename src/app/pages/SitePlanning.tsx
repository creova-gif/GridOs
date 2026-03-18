import { useTranslation } from 'react-i18next';
import { MapPin, Sun, Users, DollarSign, Zap, Map as MapIcon, Layers } from 'lucide-react';
import { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';

// Google Maps API Key - user needs to provide this
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export default function SitePlanning() {
  const { t } = useTranslation();
  const [location, setLocation] = useState({ lat: '', lng: '' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'form'>('map');
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'terrain'>('terrain');
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

  // Candidate locations for map view (Tanzania - Lake Victoria region)
  const candidates = [
    { id: 'A', lat: -2.014, lng: 33.021, score: 87, label: 'Candidate A', color: '#10b981' },
    { id: 'B', lat: -2.134, lng: 32.954, score: 71, label: 'Candidate B', color: '#378ADD' },
    { id: 'C', lat: -2.201, lng: 32.887, score: 52, label: 'Candidate C', color: '#EF9F27' },
    { id: 'D', lat: -2.285, lng: 33.104, score: 28, label: 'Candidate D', color: '#E24B4A' },
  ];

  const existingSite = { lat: -2.061, lng: 32.912, label: 'Nansio Site (Existing)' };
  const [selectedCandidate, setSelectedCandidate] = useState(candidates[0]);

  // Center on Lake Victoria region (Tanzania)
  const mapCenter = { lat: -2.15, lng: 32.95 };
  const mapZoom = 10;

  const handleScore = () => {
    if (!location.lat || !location.lng) {
      alert('Please enter latitude and longitude');
      return;
    }

    setLoading(true);

    // Mock scoring result
    setTimeout(() => {
      setResult({
        coordinates: { lat: parseFloat(location.lat), lng: parseFloat(location.lng) },
        viability: 'good',
        total_score: 72,
        population: {
          population: 850,
          density_km2: 42,
          source: 'worldpop'
        },
        solar: {
          ghi_annual: 5.4,
          source: 'global_solar_atlas'
        },
        nearest_site: {
          name: 'Nansio Site',
          distance_km: 12.3,
          overlap_risk: false
        },
        score_breakdown: {
          population: 25,
          solar: 20,
          isolation: 18,
          productive_use: 9
        },
        projections: {
          estimated_connections: 255,
          estimated_capacity_kw: 20,
          estimated_capex_usd: 90000,
          estimated_annual_revenue_usd: 24480,
          payback_years: 3.7,
          rbf_eligible: true
        },
        regulatory: {
          tanzania: {
            license_type: 'EWURA_SMALL',
            estimated_timeline_months: 6
          }
        }
      });
      setLoading(false);
      setViewMode('form');
    }, 1500);
  };

  const handleCandidateClick = (candidate: typeof candidates[0]) => {
    setSelectedCandidate(candidate);
    setLocation({ lat: candidate.lat.toString(), lng: candidate.lng.toString() });
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            <MapPin className="w-7 h-7" style={{ color: 'var(--brand-emerald)' }} />
            {t('planning.title')}
          </h1>
          <p className="mt-1" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-body)' }}>
            Geospatial analysis for optimal mini-grid site selection — GridOS integrates via API, no hardware installation required
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              viewMode === 'map'
                ? 'text-white'
                : ''
            }`}
            style={{
              backgroundColor: viewMode === 'map' ? 'var(--brand-emerald)' : 'var(--bg-surface)',
              color: viewMode === 'map' ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            <MapIcon className="w-4 h-4" />
            Map View
          </button>
          <button
            onClick={() => setViewMode('form')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2`}
            style={{
              backgroundColor: viewMode === 'form' ? 'var(--brand-emerald)' : 'var(--bg-surface)',
              color: viewMode === 'form' ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            <MapPin className="w-4 h-4" />
            Form View
          </button>
        </div>
      </div>

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="grid grid-cols-3 gap-6">
          {/* Map Box */}
          <div className="col-span-2 rounded-lg border overflow-hidden relative" style={{ 
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--bg-border-subtle)',
            height: '600px'
          }}>
            {/* Map Type Selector */}
            <div className="absolute top-4 left-4 flex gap-2" style={{ zIndex: 10 }}>
              <div className="flex rounded overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)' }}>
                <button
                  onClick={() => setMapType('roadmap')}
                  className="px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: mapType === 'roadmap' ? 'var(--brand-emerald)' : 'transparent',
                    color: mapType === 'roadmap' ? '#ffffff' : 'var(--text-muted)'
                  }}
                >
                  Road
                </button>
                <button
                  onClick={() => setMapType('terrain')}
                  className="px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: mapType === 'terrain' ? 'var(--brand-emerald)' : 'transparent',
                    color: mapType === 'terrain' ? '#ffffff' : 'var(--text-muted)'
                  }}
                >
                  <Layers className="w-3 h-3 inline mr-1" />
                  Terrain
                </button>
                <button
                  onClick={() => setMapType('satellite')}
                  className="px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: mapType === 'satellite' ? 'var(--brand-emerald)' : 'transparent',
                    color: mapType === 'satellite' ? '#ffffff' : 'var(--text-muted)'
                  }}
                >
                  Satellite
                </button>
              </div>
            </div>

            {GOOGLE_MAPS_API_KEY ? (
              <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                <Map
                  defaultCenter={mapCenter}
                  defaultZoom={mapZoom}
                  mapId="gridios-site-planning"
                  mapTypeId={mapType}
                  disableDefaultUI={false}
                  gestureHandling="greedy"
                  style={{ width: '100%', height: '100%' }}
                >
                  {/* Existing Site Marker */}
                  <AdvancedMarker
                    position={{ lat: existingSite.lat, lng: existingSite.lng }}
                    onClick={() => setSelectedMarker('existing')}
                  >
                    <Pin background="#378ADD" borderColor="#ffffff" glyphColor="#ffffff" />
                  </AdvancedMarker>
                  {selectedMarker === 'existing' && (
                    <InfoWindow
                      position={{ lat: existingSite.lat, lng: existingSite.lng }}
                      onCloseClick={() => setSelectedMarker(null)}
                    >
                      <div style={{ padding: '8px', color: '#000' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{existingSite.label}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {existingSite.lat.toFixed(4)}, {existingSite.lng.toFixed(4)}
                        </div>
                      </div>
                    </InfoWindow>
                  )}

                  {/* Candidate Markers */}
                  {candidates.map((candidate) => (
                    <div key={candidate.id}>
                      <AdvancedMarker
                        position={{ lat: candidate.lat, lng: candidate.lng }}
                        onClick={() => {
                          handleCandidateClick(candidate);
                          setSelectedMarker(candidate.id);
                        }}
                      >
                        <Pin background={candidate.color} borderColor="#ffffff" glyphColor="#ffffff" />
                      </AdvancedMarker>
                      {selectedMarker === candidate.id && (
                        <InfoWindow
                          position={{ lat: candidate.lat, lng: candidate.lng }}
                          onCloseClick={() => setSelectedMarker(null)}
                        >
                          <div style={{ padding: '8px', color: '#000' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                              {candidate.label}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                              {candidate.lat.toFixed(4)}, {candidate.lng.toFixed(4)}
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: candidate.color }}>
                              Score: {candidate.score}/100
                            </div>
                          </div>
                        </InfoWindow>
                      )}
                    </div>
                  ))}
                </Map>
              </APIProvider>
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#0a1929' }}>
                <div className="text-center p-8">
                  <MapIcon className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-faint)' }} />
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Google Maps API Key Required
                  </h3>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                    Add VITE_GOOGLE_MAPS_API_KEY to your .env file to enable interactive maps.
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                    Get a free API key at: <a href="https://console.cloud.google.com/google/maps-apis" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-emerald)' }}>Google Cloud Console</a>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Location Score Card */}
          <div className="rounded-lg border p-6 space-y-6" style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--bg-border-subtle)'
          }}>
            <div>
              <div className="text-xs uppercase tracking-wider mb-2" style={{ 
                color: 'var(--text-faint)',
                fontSize: 'var(--text-label)'
              }}>
                Location score
              </div>
              <div className="text-sm mb-4" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-small)' }}>
                {selectedCandidate.label} · {selectedCandidate.lat.toFixed(3)}, {selectedCandidate.lng.toFixed(3)}
              </div>
              
              <div className="text-6xl font-bold mb-1" style={{ color: 'var(--brand-emerald)' }}>
                {selectedCandidate.score}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-small)' }}>
                / 100 — {selectedCandidate.score >= 80 ? 'Excellent' : selectedCandidate.score >= 60 ? 'Good' : selectedCandidate.score >= 40 ? 'Marginal' : 'Poor'}
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: 'var(--text-muted)' }}>Population</span>
                  <span style={{ color: 'var(--text-primary)' }}>28/30</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)' }}>
                  <div className="h-full rounded-full" style={{ 
                    backgroundColor: 'var(--brand-emerald)',
                    width: '93%'
                  }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: 'var(--text-muted)' }}>Solar resource</span>
                  <span style={{ color: 'var(--text-primary)' }}>25/25</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)' }}>
                  <div className="h-full rounded-full" style={{ 
                    backgroundColor: 'var(--brand-emerald)',
                    width: '100%'
                  }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: 'var(--text-muted)' }}>Isolation</span>
                  <span style={{ color: 'var(--text-primary)' }}>24/25</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)' }}>
                  <div className="h-full rounded-full" style={{ 
                    backgroundColor: 'var(--brand-emerald)',
                    width: '96%'
                  }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: 'var(--text-muted)' }}>Productive use</span>
                  <span style={{ color: 'var(--text-primary)' }}>10/20</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)' }}>
                  <div className="h-full rounded-full" style={{ 
                    backgroundColor: 'var(--brand-emerald)',
                    width: '50%'
                  }} />
                </div>
              </div>
            </div>

            {/* Financial Projections */}
            <div className="pt-4 border-t space-y-3" style={{ borderColor: 'var(--bg-border-subtle)' }}>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-small)' }}>Est. connections:</span>
                <span style={{ color: 'var(--text-primary)', fontSize: 'var(--text-small)' }} className="font-medium">420</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-small)' }}>Capex:</span>
                <span style={{ color: 'var(--text-primary)', fontSize: 'var(--text-small)' }} className="font-medium">$189,000</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-small)' }}>Payback:</span>
                <span style={{ color: 'var(--text-primary)', fontSize: 'var(--text-small)' }} className="font-medium">5.4 years</span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-small)' }}>RBF eligible:</span>
                <span style={{ color: 'var(--brand-emerald)', fontSize: 'var(--text-small)' }} className="font-medium">Yes</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form View */}
      {viewMode === 'form' && (
        <>
          {/* Location Scorer */}
          <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Score a Candidate Location</h2>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  placeholder="-2.5684"
                  value={location.lat}
                  onChange={(e) => setLocation({ ...location, lat: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  placeholder="32.8254"
                  value={location.lng}
                  onChange={(e) => setLocation({ ...location, lng: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleScore}
                  disabled={loading}
                  className="w-full px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4" />
                      {t('planning.score_location')}
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-500">
              Example coordinates: Ukerewe Island (-2.0617, 33.0012) • Mwanza Region (-2.5184, 32.8996)
            </div>
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-6">
              {/* Viability Score */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-6 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-100">Site Viability Assessment</h2>
                  <span className={`px-4 py-2 rounded-lg font-bold text-lg ${
                    result.viability === 'excellent' ? 'bg-green-500/20 text-green-400' :
                    result.viability === 'good' ? 'bg-blue-500/20 text-blue-400' :
                    result.viability === 'marginal' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {result.viability.toUpperCase()} ({result.total_score}/100)
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                      <Users className="w-4 h-4" />
                      {t('planning.population')}
                    </div>
                    <div className="text-2xl font-bold text-slate-100">{result.population.population}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {result.population.density_km2} per km² • {result.score_breakdown.population}/30 pts
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                      <Sun className="w-4 h-4" />
                      {t('planning.solar_resource')}
                    </div>
                    <div className="text-2xl font-bold text-slate-100">{result.solar.ghi_annual} kWh/m²/day</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Global Solar Atlas • {result.score_breakdown.solar}/25 pts
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                      <MapPin className="w-4 h-4" />
                      Isolation
                    </div>
                    <div className="text-2xl font-bold text-slate-100">{result.nearest_site.distance_km} km</div>
                    <div className="text-xs text-slate-500 mt-1">
                      from {result.nearest_site.name} • {result.score_breakdown.isolation}/25 pts
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                      <Zap className="w-4 h-4" />
                      Productive Use
                    </div>
                    <div className="text-2xl font-bold text-slate-100">
                      {result.population.density_km2 > 50 ? 'High' : 'Medium'}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Potential • {result.score_breakdown.productive_use}/20 pts
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Projections */}
              <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
                <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  Financial Projections
                </h2>

                <div className="grid grid-cols-5 gap-4">
                  <div>
                    <div className="text-sm text-slate-400">Estimated Connections</div>
                    <div className="text-2xl font-bold text-slate-100 mt-1">
                      {result.projections.estimated_connections}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">households</div>
                  </div>

                  <div>
                    <div className="text-sm text-slate-400">System Size</div>
                    <div className="text-2xl font-bold text-slate-100 mt-1">
                      {result.projections.estimated_capacity_kw} kW
                    </div>
                    <div className="text-xs text-slate-500 mt-1">solar + storage</div>
                  </div>

                  <div>
                    <div className="text-sm text-slate-400">CAPEX</div>
                    <div className="text-2xl font-bold text-slate-100 mt-1">
                      ${(result.projections.estimated_capex_usd / 1000).toFixed(0)}K
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      ${(result.projections.estimated_capex_usd / result.projections.estimated_capacity_kw).toFixed(0)}/kW
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-slate-400">Annual Revenue</div>
                    <div className="text-2xl font-bold text-emerald-400 mt-1">
                      ${(result.projections.estimated_annual_revenue_usd / 1000).toFixed(1)}K
                    </div>
                    <div className="text-xs text-slate-500 mt-1">at $8 ARPU/month</div>
                  </div>

                  <div>
                    <div className="text-sm text-slate-400">Payback Period</div>
                    <div className="text-2xl font-bold text-blue-400 mt-1">
                      {result.projections.payback_years} yrs
                    </div>
                    <div className="text-xs text-slate-500 mt-1">simple payback</div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg border ${
                    result.projections.rbf_eligible
                      ? 'bg-green-500/10 border-green-500/20'
                      : 'bg-red-500/10 border-red-500/20'
                  }`}>
                    <div className="text-sm font-medium mb-1">
                      {result.projections.rbf_eligible ? '✓ RBF Eligible' : '✗ Not RBF Eligible'}
                    </div>
                    <div className="text-xs text-slate-400">
                      {result.projections.rbf_eligible
                        ? `Potential subsidy: $${(result.projections.estimated_connections * 400).toLocaleString()} from REA Tanzania`
                        : 'Need ≥50 connections for RBF eligibility'}
                    </div>
                  </div>

                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="text-sm font-medium mb-1">
                      {result.regulatory.tanzania.license_type}
                    </div>
                    <div className="text-xs text-slate-400">
                      Timeline: {result.regulatory.tanzania.estimated_timeline_months} months • EWURA licensing
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Save Site to Planning Database
                </button>
                <button className="px-6 py-3 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors font-medium">
                  Export Feasibility Report (PDF)
                </button>
                <button className="px-6 py-3 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors font-medium">
                  Screen Multiple Locations
                </button>
              </div>
            </div>
          )}

          {/* Info Card */}
          {!result && (
            <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
              <h3 className="font-semibold text-slate-100 mb-3">How Site Planning Works</h3>
              <div className="space-y-3 text-sm text-slate-400">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-slate-300">Population Analysis:</strong> WorldPop API provides unelectrified population density within 5km radius
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Sun className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-slate-300">Solar Resource:</strong> Global Solar Atlas GHI data shows energy potential (4.5–6.0 kWh/m²/day in EA)
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-slate-300">Site Isolation:</strong> Checks distance to existing GridOS sites to avoid overlap
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-slate-300">Viability Score:</strong> Combines all factors into 0–100 score with financial projections
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}