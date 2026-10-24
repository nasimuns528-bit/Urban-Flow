/**
 * UrbanFlow API Client
 * Seamless communication with Express REST endpoints
 */

const BASE_URL = '/api';

function getAuthHeaders(isFormData = false) {
  const token = localStorage.getItem('urbanflow_token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

export const api = {
  // Auth
  async login(email, password) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },

  async register(data) {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getMe() {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async getDemoUsers() {
    const res = await fetch(`${BASE_URL}/auth/demo-users`);
    return res.json();
  },

  // Incidents
  async getIncidents(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/incidents?${query}`);
    return res.json();
  },

  async getIncidentById(id) {
    const res = await fetch(`${BASE_URL}/incidents/${id}`);
    return res.json();
  },

  async trackIncident(trackingCode) {
    const res = await fetch(`${BASE_URL}/incidents/track/${encodeURIComponent(trackingCode)}`);
    return res.json();
  },

  async reportIncident(formData) {
    const res = await fetch(`${BASE_URL}/incidents`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData
    });
    return res.json();
  },

  async triageIncident(id, data) {
    const res = await fetch(`${BASE_URL}/incidents/${id}/triage`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Hotspots
  async getHotspots() {
    const res = await fetch(`${BASE_URL}/hotspots`);
    return res.json();
  },

  // Tasks (Field work orders)
  async getTasks(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/tasks?${query}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async getFieldWorkers() {
    const res = await fetch(`${BASE_URL}/tasks/workers`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async assignTask(taskData) {
    const res = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(taskData)
    });
    return res.json();
  },

  async updateTaskStatus(taskId, formData) {
    const res = await fetch(`${BASE_URL}/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(true),
      body: formData
    });
    return res.json();
  },

  // Analytics
  async getAnalyticsOverview() {
    const res = await fetch(`${BASE_URL}/analytics/overview`);
    return res.json();
  },

  async getAnalyticsCharts() {
    const res = await fetch(`${BASE_URL}/analytics/charts`);
    return res.json();
  },

  // Wards & Weather
  async getWards() {
    const res = await fetch(`${BASE_URL}/wards`);
    return res.json();
  },

  async getWeather(lat, lng) {
    const query = lat && lng ? `?lat=${lat}&lng=${lng}` : '';
    const res = await fetch(`${BASE_URL}/weather/current${query}`);
    return res.json();
  }
};
