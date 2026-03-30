import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import VaccinModal, { PROTOCOLES } from '../components/VaccinModal';

// --- LISTE PRINCIPALE ---

export default function Vaccinations({ selectedPatient, setSelectedPatient }) {
  const [vaccinations, setVaccinations] = useState([]);
  const [patients, setPatients] = useState([]);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [v, p] = await Promise.all([
      api.getVaccinations({}),
      api.getPatients()
    ]);
    setVaccinations(v);
    setPatients(p);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce certificat officiel ?')) {
      await api.deleteVaccination(id);
      load();
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontSize: 26, fontWeight: 800, color: '#1d2129', marginBottom: 4 }}>Certificats & Protocoles</h1>
          <p style={{ color: '#8a94a6', fontSize: 14 }}>Registres officiels Anti-Rabique, Hépatite B et DT.</p>
        </div>
        <button onClick={() => setModal('create')} style={{ background: '#0056ff', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '50px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,86,255,0.2)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l-2 2 4 4 2-2-4-4z"></path><path d="M10 4L2 12l2 2-2 2 2 2 2-2 2 2 8-8-8-8z"></path><line x1="14" y1="10" x2="4" y2="20"></line></svg>
          Saisir un Registre
        </button>
      </div>

      <div className="card" style={{ border: 'none', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#8a94a6' }}>Chargement...</div>
        ) : vaccinations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8a94a6', background: '#f4f5f9', borderRadius: '12px' }}>
            Aucun certificat enregistré.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: '#8a94a6', borderBottom: '1px solid #eaebef' }}>
                  <th style={{ padding: '16px 8px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date Initiale</th>
                  <th style={{ padding: '16px 8px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Patient</th>
                  <th style={{ padding: '16px 8px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type de Registre</th>
                  <th style={{ padding: '16px 8px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Détails Profil</th>
                  <th style={{ padding: '16px 8px', textAlign: 'right' }}></th>
                </tr>
              </thead>
              <tbody>
                {vaccinations.map((v, i) => {
                  return (
                    <tr key={v.id} style={{ borderBottom: i < vaccinations.length-1 ? '1px solid #eaebef' : 'none' }}>
                      <td style={{ padding: '16px 8px', fontWeight: 600, fontSize: 13, color: '#1d2129' }}>
                        {new Date(v.dateAdministration || Date.now()).toLocaleDateString('fr-FR')}
                      </td>
                      
                      <td style={{ padding: '16px 8px', fontWeight: 800, fontSize: 14, color: '#1d2129' }}>
                        {v.patient}
                      </td>
                      
                      <td style={{ padding: '16px 8px' }}>
                        <span style={{ fontWeight: 800, color: '#0056ff', background: '#ebf2ff', padding: '4px 10px', borderRadius: '6px', fontSize: '13px' }}>
                          {v.type === 'rage' ? 'Anti-Rabique' : v.type === 'hepb' ? 'Hépatite B' : v.type === 'dt' ? 'DT' : v.vaccin}
                        </span>
                      </td>
                      
                      <td style={{ padding: '16px 8px', color: '#8a94a6', fontSize: 13 }}>
                        {v.type === 'rage' ? `Grade: ${v.protocoleData?.grade}` : v.type === 'hepb' ? `Schéma: ${v.protocoleData?.schema}` : 'Formulaire Officiel'}
                      </td>

                      <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button onClick={() => setModal(v)} style={{ background: '#f4f5f9', border: '1px solid #eaebef', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#8a94a6' }} title="Voir le certificat">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                          </button>
                          <button onClick={() => handleDelete(v.id)} style={{ background: '#fce7f3', border: '1px solid #fbcfe8', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#ec4899' }} title="Supprimer">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <VaccinModal
          vaccination={modal === 'create' ? null : modal}
          patients={patients}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
