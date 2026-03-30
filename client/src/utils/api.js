const BASE = 'http://localhost:3001/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export const api = {
  // Patients
  getPatients: (search = '') => request(`/patients${search ? `?search=${search}` : ''}`),
  getPatient: (id) => request(`/patients/${id}`),
  createPatient: (data) => request('/patients', { method: 'POST', body: JSON.stringify(data) }),
  updatePatient: (id, data) => request(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePatient: (id) => request(`/patients/${id}`, { method: 'DELETE' }),

  // Vaccinations
  getVaccinations: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/vaccinations${q ? `?${q}` : ''}`);
  },
  createVaccination: (data) => request('/vaccinations', { method: 'POST', body: JSON.stringify(data) }),
  updateVaccination: (id, data) => request(`/vaccinations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVaccination: (id) => request(`/vaccinations/${id}`, { method: 'DELETE' }),

  // Rappels & Stats
  getRappels: () => request('/rappels'),
  getStats: () => request('/stats'),
  getVaccinsDisponibles: () => request('/vaccins-disponibles'),
  
  // Stocks
  getStocks: () => request('/stocks'),
  createStock: (data) => request('/stocks', { method: 'POST', body: JSON.stringify(data) }),
  updateStock: (id, data) => request(`/stocks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStock: (id) => request(`/stocks/${id}`, { method: 'DELETE' }),
  
  // Ordonnances
  getOrdonnances: (patientId) => request(`/ordonnances?patientId=${patientId}`),
  createOrdonnance: (data) => request('/ordonnances', { method: 'POST', body: JSON.stringify(data) }),
  deleteOrdonnance: (id) => request(`/ordonnances/${id}`, { method: 'DELETE' }),

  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
};
