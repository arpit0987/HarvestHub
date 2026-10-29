/**
 * HarvestHub API Client
 * Wraps REST endpoints for Fields, Crops, Rotations, Operations, Equipment, Analytics, and Weather
 */

const API = {
  baseUrl: '/api',

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = localStorage.getItem('harvesthub_token');
    const defaultHeaders = {
      'Content-Type': 'application/json'
    };

    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP error ${response.status}`);
      }
      return data;
    } catch (err) {
      console.error(`API Error on [${options.method || 'GET'}] ${endpoint}:`, err);
      throw err;
    }
  },

  // Weather & KPIs
  getWeather() {
    return this.request('/weather');
  },

  getKPIs() {
    return this.request('/analytics/kpis');
  },

  // Fields
  getFields() {
    return this.request('/fields');
  },

  getField(id) {
    return this.request(`/fields/${id}`);
  },

  createField(payload) {
    return this.request('/fields', { method: 'POST', body: payload });
  },

  updateField(id, payload) {
    return this.request(`/fields/${id}`, { method: 'PUT', body: payload });
  },

  deleteField(id) {
    return this.request(`/fields/${id}`, { method: 'DELETE' });
  },

  // Crops
  getCrops() {
    return this.request('/crops');
  },

  createCrop(payload) {
    return this.request('/crops', { method: 'POST', body: payload });
  },

  // Crop Rotations
  getRotations(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/rotations${query ? `?${query}` : ''}`);
  },

  upsertRotation(payload) {
    return this.request('/rotations', { method: 'POST', body: payload });
  },

  evaluateFieldRotation(fieldId) {
    return this.request(`/rotations/evaluate/${fieldId}`);
  },

  evaluateSimulated(sequence) {
    return this.request('/rotations/evaluate-simulated', { method: 'POST', body: { sequence } });
  },

  deleteRotation(id) {
    return this.request(`/rotations/${id}`, { method: 'DELETE' });
  },

  // Field Operations
  getOperations(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/operations${query ? `?${query}` : ''}`);
  },

  getOperation(id) {
    return this.request(`/operations/${id}`);
  },

  createOperation(payload) {
    return this.request('/operations', { method: 'POST', body: payload });
  },

  updateOperation(id, payload) {
    return this.request(`/operations/${id}`, { method: 'PUT', body: payload });
  },

  addOperationInput(operationId, inputPayload) {
    return this.request(`/operations/${operationId}/inputs`, { method: 'POST', body: inputPayload });
  },

  deleteOperationInput(inputId) {
    return this.request(`/operations/inputs/${inputId}`, { method: 'DELETE' });
  },

  deleteOperation(id) {
    return this.request(`/operations/${id}`, { method: 'DELETE' });
  },

  // Equipment Fleet & Maintenance
  getEquipment() {
    return this.request('/equipment');
  },

  getEquipmentDetail(id) {
    return this.request(`/equipment/${id}`);
  },

  createEquipment(payload) {
    return this.request('/equipment', { method: 'POST', body: payload });
  },

  logEquipmentHours(id, payload) {
    return this.request(`/equipment/${id}/log-hours`, { method: 'POST', body: payload });
  },

  completeEquipmentService(id, payload) {
    return this.request(`/equipment/${id}/service`, { method: 'POST', body: payload });
  },

  deleteEquipment(id) {
    return this.request(`/equipment/${id}`, { method: 'DELETE' });
  },

  // Analytics & P&L
  getPNL(year = null) {
    const q = year ? `?year=${year}` : '';
    return this.request(`/analytics/pnl${q}`);
  },

  getInputsBreakdown() {
    return this.request('/analytics/inputs-breakdown');
  },

  getYields() {
    return this.request('/analytics/yields');
  },

  // Authentication & Profile
  login(email, password) {
    return this.request('/auth/login', { method: 'POST', body: { email, password } });
  },

  signup(payload) {
    return this.request('/auth/signup', { method: 'POST', body: payload });
  },

  getMe() {
    return this.request('/auth/me');
  },

  updateProfile(payload) {
    return this.request('/auth/profile', { method: 'PUT', body: payload });
  },

  getDemoUsers() {
    return this.request('/auth/demo-users');
  },

  // HarvestAI Copilot & Advisory
  chatAI(message, history = [], userProfile = null) {
    return this.request('/ai/chat', { method: 'POST', body: { message, history, userProfile } });
  },

  getAIRotationRecommendation(fieldId) {
    return this.request(`/ai/recommend-rotation/${fieldId}`);
  },

  getAIMachineryDiagnosis(equipmentId) {
    return this.request(`/ai/diagnose-machinery/${equipmentId}`);
  },

  getAIFinancialInsights() {
    return this.request('/ai/financial-insights');
  }
};

window.API = API;
