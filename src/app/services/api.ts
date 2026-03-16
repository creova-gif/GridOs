/**
 * GridOS API Client
 * Connects Figma Make frontend to Express backend
 */

import axios from 'axios';

// API base URL - configure based on environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Create axios instance with defaults
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gridosToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('gridosToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================================
// API Endpoints
// ============================================================

// Sites API
export const sitesApi = {
  getAll: () => api.get('/api/sites'),
  getById: (id: string) => api.get(`/api/sites/${id}`),
  getStats: (id: string) => api.get(`/api/sites/${id}/stats`),
};

// Meters API
export const metersApi = {
  getBySite: (siteId: string) => api.get(`/api/sites/${siteId}/meters`),
  getById: (id: string) => api.get(`/api/meters/${id}`),
  getReadings: (id: string, params?: { hours?: number }) => 
    api.get(`/api/meters/${id}/readings`, { params }),
};

// Customers API
export const customersApi = {
  getBySite: (siteId: string) => api.get(`/api/sites/${siteId}/customers`),
  getById: (id: string) => api.get(`/api/customers/${id}`),
  topup: (id: string, data: { amount_tzs: number; payment_method: string }) =>
    api.post(`/api/customers/${id}/topup`, data),
  getProfile: (id: string) => api.get(`/api/customers/${id}/profile`),
};

// Alerts API
export const alertsApi = {
  getBySite: (siteId: string, params?: { status?: string }) =>
    api.get(`/api/sites/${siteId}/alerts`, { params }),
  resolve: (id: string, data: { notes: string; agent_id: string }) =>
    api.patch(`/api/alerts/${id}/resolve`, data),
};

// AI Insights API
export const aiApi = {
  loadForecast: (siteId: string) => api.get(`/api/ai/load-forecast/${siteId}`),
  creditScores: (siteId: string) => api.get(`/api/ai/credit-scores/${siteId}`),
  siteHealth: (siteId: string) => api.get(`/api/ai/site-health/${siteId}`),
};

// Reports API
export const reportsApi = {
  generate: (siteId: string, data: { start_date: string; end_date: string }) =>
    api.post(`/api/reports/rbf/${siteId}`, data),
  download: (reportId: string) => api.get(`/api/reports/${reportId}/download`, {
    responseType: 'blob',
  }),
};

// Planning API
export const planningApi = {
  scoreLocation: (data: { lat: number; lng: number; country: string }) =>
    api.post('/api/planning/score-location', data),
  getSites: () => api.get('/api/planning/sites'),
};

// Portfolio API
export const portfolioApi = {
  getByOperator: (operatorId: string) => api.get(`/api/portfolio/${operatorId}`),
};

// Fintech API
export const fintechApi = {
  getRbf: (siteId: string) => api.get(`/api/fintech/rbf/${siteId}`),
  getCarbon: (siteId: string) => api.get(`/api/fintech/carbon/${siteId}`),
  getMfi: (siteId: string) => api.get(`/api/fintech/mfi/${siteId}`),
  calculateBlendedFinance: (data: {
    capacity_kw: number;
    expected_connections: number;
    country: string;
    has_lois: boolean;
  }) => api.post('/api/fintech/blended-finance', data),
};

// Operations API
export const operationsApi = {
  getAnomalies: (siteId: string) => api.get(`/api/operations/anomalies/${siteId}`),
  getAgriculture: (siteId: string) => api.get(`/api/operations/agriculture/${siteId}`),
  getMaintenance: (siteId: string) => api.get(`/api/operations/maintenance/${siteId}`),
  getRegulatory: (operatorId: string) => api.get(`/api/operations/regulatory/${operatorId}`),
  getImpact: (operatorId: string) => api.get(`/api/operations/impact/${operatorId}`),
};

// Onboarding API
export const onboardingApi = {
  getChecklist: (operatorId: string) => api.get(`/api/onboarding/checklist/${operatorId}`),
};

// USSD API
export const ussdApi = {
  handleSession: (data: { sessionId: string; phoneNumber: string; text: string }) =>
    api.post('/ussd', data),
};

// Health check
export const healthCheck = () => api.get('/health');

export default api;
