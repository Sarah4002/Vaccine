import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

const EMPTY = {
  nom: '', prenom: '', dateNaissance: '', sexe: 'M',
  telephone: '', email: '', adresse: '', groupeSanguin: 'A+'
};

const GROUPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function PatientModal({ patient, onClose, onSave }) {
  const [form, setForm] = useState(patient || EMPTY);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (patient?.id) {
      await api.updatePatient(patient.id, form);
    } else {
      await api.createPatient(form);
    }
    onSave();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{patient?.id ? 'Modifier patient' : '+ Nouveau patient'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Prénom *</label>
              <input className="form-control" required value={form.prenom}
                onChange={e => set('prenom', e.target.value)} placeholder="Prénom" />
            </div>
            <div className="form-group">
              <label className="form-label">Nom *</label>
              <input className="form-control" required value={form.nom}
                onChange={e => set('nom', e.target.value)} placeholder="Nom" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date de naissance *</label>
              <input className="form-control" type="date" required value={form.dateNaissance}
                onChange={e => set('dateNaissance', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Sexe</label>
              <select className="form-control" value={form.sexe} onChange={e => set('sexe', e.target.value)}>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Téléphone</label>
              <input className="form-control" value={form.telephone}
                onChange={e => set('telephone', e.target.value)} placeholder="05XXXXXXXX" />
            </div>
            <div className="form-group">
              <label className="form-label">Groupe sanguin</label>
              <select className="form-control" value={form.groupeSanguin} onChange={e => set('groupeSanguin', e.target.value)}>
                {GROUPES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" value={form.email}
              onChange={e => set('email', e.target.value)} placeholder="email@exemple.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Adresse</label>
            <input className="form-control" value={form.adresse}
              onChange={e => set('adresse', e.target.value)} placeholder="Ville, Wilaya" />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Annuler</button>
            <button type="submit"style={{color:'white'}} className="btn btn-primary">
              {patient?.id ? 'Enregistrer' : 'Créer le patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function calcAge(dob) {
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export default function Patients({ setPage, setSelectedPatient }) {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'create' | patient obj
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await api.getPatients(search);
    setPatients(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [search]);

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce patient et toutes ses vaccinations ?')) {
      await api.deletePatient(id);
      load();
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Patients</h1>
          <p className="page-subtitle">{patients.length} patient(s) enregistré(s)</p>
        </div>
        <button className="btn btn-primary" style={{color:'white'}}onClick={() => setModal('create')}>
          + Nouveau patient
        </button>
      </div>

      <div className="search-bar">
        <div className="search-input-wrapper">
          <span className="search-icon"></span>
          <input
            className="search-input"
            placeholder="Rechercher par nom, prénom ou email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Chargement...</div>
          ) : patients.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"></div>
              <div className="empty-title">Aucun patient trouvé</div>
              <p>Ajoutez votre premier patient pour commencer.</p>
            </div>
          ) : (
            <table>
              <colgroup>
                <col style={{ width: '28%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '12%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Âge</th>
                  <th>Sexe</th>
                  <th>Groupe</th>
                  <th>Téléphone</th>
                  <th>Adresse</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="patient-cell">
                        <div className="avatar">{p.prenom[0]}{p.nom[0]}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.prenom} {p.nom}</div>
                          <div style={{ fontSize: 12, color: '#94a3b8' }}>{p.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{p.dateNaissance ? calcAge(p.dateNaissance) + ' ans' : '—'}</td>
                    <td>
                      <span className={`badge ${p.sexe === 'M' ? 'badge-info' : 'badge-warning'}`}>
                        {p.sexe === 'M' ? '♂ Homme' : '♀ Femme'}
                      </span>
                    </td>
                    <td><span className="badge badge-neutral">{p.groupeSanguin}</span></td>
                    <td>{p.telephone || '—'}</td>
                    <td style={{ color: '#94a3b8', fontSize: 13 }}>{p.adresse || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="icon-btn icon-btn-edit" style ={{color:'green',border:'none'}} onClick={() => setModal(p)} title="Modifier">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button className="icon-btn icon-btn-view" style ={{color:'grey',border:'none'}}onClick={() => { setSelectedPatient(p); setPage('vaccinations'); }} title="Voir vaccinations">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        <button className="icon-btn icon-btn-delete" style ={{color:'red',border:'none'}} onClick={() => handleDelete(p.id)} title="Supprimer">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <PatientModal
          patient={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
