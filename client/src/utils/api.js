export const API_BASE = process.env.REACT_APP_API || 'http://localhost:3001';
const BASE = `${API_BASE}/api`;

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

async function download(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return {
    blob: await res.blob(),
    contentDisposition: res.headers.get('content-disposition') || '',
  };
}

export const api = {
  // Patients
  getPatients: (search = '', options = {}) => {
    const params = new URLSearchParams({ all: '1' });
    if (search) params.set('search', search);
    if (options.year) params.set('year', options.year);
    return request(`/patients?${params.toString()}`);
  },
  getPatient: (id) => request(`/patients/${id}`),
  exportPatientsDatabase: () => download('/export/patients'),
  createPatient: (data) => request('/patients', { method: 'POST', body: JSON.stringify(data) }),
  updatePatient: (id, data) => request(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePatient: (id) => request(`/patients/${id}`, { method: 'DELETE' }),

  // Vaccinations
  getVaccinations: (params = {}) => {
    const query = params.patientId ? params : { all: '1', ...params };
    const q = new URLSearchParams(query).toString();
    return request(`/vaccinations${q ? `?${q}` : ''}`);
  },
  createVaccination: (data) => request('/vaccinations', { method: 'POST', body: JSON.stringify(data) }),
  updateVaccination: (id, data) => request(`/vaccinations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVaccination: (id) => request(`/vaccinations/${id}`, { method: 'DELETE' }),

  // Rappels & Stats
  getRappels: () => request('/rappels'),
  importAntirab: () => request('/import-antirab', { method: 'POST' }),
  getMapCommunes: () => request('/map/communes'),
  getStats: (params = {}) => {
    const mapped = {
      period: params.period || '',
      year: params.year || params.annee || '',
      month: params.month || params.mois || '',
      day: params.day || params.jour || '',
      sexe: params.sexe || '',
      ageMin: params.ageMin || '',
      ageMax: params.ageMax || '',
      wilaya: params.wilaya || '',
    };
    const q = new URLSearchParams(
      Object.entries(mapped).filter(([, value]) => value !== '' && value !== null && value !== undefined)
    ).toString();
    return request(`/stats${q ? `?${q}` : ''}`);
  },
  getVaccinsDisponibles: () => request('/vaccins-disponibles'),
  
  // Stocks
  getStocks: () => request('/stocks'),
  getStockMovements: () => request('/stocks/movements'),
  createStock: (data) => request('/stocks', { method: 'POST', body: JSON.stringify(data) }),
  updateStock: (id, data) => request(`/stocks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStock: (id) => request(`/stocks/${id}`, { method: 'DELETE' }),
  
  // Ordonnances
  getOrdonnances: (patientId) => request(`/ordonnances?patientId=${patientId}`),
  createOrdonnance: (data) => request('/ordonnances', { method: 'POST', body: JSON.stringify(data) }),
  deleteOrdonnance: (id) => request(`/ordonnances/${id}`, { method: 'DELETE' }),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Help center
  getHelpArticles: (params = {}) => {
    const q = new URLSearchParams(
      Object.entries({
        search: params.search || '',
        categorie: params.categorie || '',
      }).filter(([, value]) => value)
    ).toString();
    return request(`/help/articles${q ? `?${q}` : ''}`);
  },
  sendHelpFeedback: (articleId, type) =>
    request(`/help/articles/${articleId}/feedback`, { method: 'POST', body: JSON.stringify({ type }) }),

  // Support
  getTickets: () => request('/support/tickets'),
  createTicket: (data) => request('/support/tickets', { method: 'POST', body: JSON.stringify(data) }),
  updateTicketStatus: (id, statut) =>
    request(`/support-tickets/${id}`, { method: 'PUT', body: JSON.stringify({ statut }) }),

  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
};
