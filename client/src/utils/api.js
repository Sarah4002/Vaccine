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
};
