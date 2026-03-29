import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

const DOSES = ['1ère dose', '2ème dose', '3ème dose', 'Rappel', 'Annuelle', 'Dose unique'];
const STATUTS = ['complete', 'a_venir', 'annule'];

const EMPTY = {
  patientId: '', vaccin: '', dose: '1ère dose',
  dateAdministration: new Date().toISOString().slice(0, 10),
  dateProchaineDose: '', medecin: '', centre: '',
  lotNumero: '', statut: 'complete', notes: ''
};

function VaccinModal({ vaccination, patients, vaccins, onClose, onSave }) {
  const [form, setForm] = useState(vaccination || EMPTY);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...form, dateProchaineDose: form.dateProchaineDose || null };
    if (vaccination?.id) {
      await api.updateVaccination(vaccination.id, data);
    } else {
      await api.createVaccination(data);
    }
    onSave();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{vaccination?.id ? 'Modifier vaccination' : '+ Nouvelle vaccination'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Patient *</label>
            <select className="form-control" required value={form.patientId} onChange={e => set('patientId', e.target.value)}>
              <option value="">-- Sélectionner un patient --</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Vaccin *</label>
              <select className="form-control" required value={form.vaccin} onChange={e => set('vaccin', e.target.value)}>
                <option value="">-- Sélectionner --</option>
                {vaccins.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Dose</label>
              <select className="form-control" value={form.dose} onChange={e => set('dose', e.target.value)}>
                {DOSES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date d'administration *</label>
              <input className="form-control" type="date" required value={form.dateAdministration}
                onChange={e => set('dateAdministration', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Date prochaine dose</label>
              <input className="form-control" type="date" value={form.dateProchaineDose || ''}
                onChange={e => set('dateProchaineDose', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Médecin</label>
              <input className="form-control" value={form.medecin}
                onChange={e => set('medecin', e.target.value)} placeholder="Dr. Nom" />
            </div>
            <div className="form-group">
              <label className="form-label">Centre de vaccination</label>
              <input className="form-control" value={form.centre}
                onChange={e => set('centre', e.target.value)} placeholder="Clinique / CHU" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">N° de lot</label>
              <input className="form-control" value={form.lotNumero}
                onChange={e => set('lotNumero', e.target.value)} placeholder="LOT-XXXX" />
            </div>
            <div className="form-group">
              <label className="form-label">Statut</label>
              <select className="form-control" value={form.statut} onChange={e => set('statut', e.target.value)}>
                <option value="complete">Complète</option>
                <option value="a_venir">À venir</option>
                <option value="annule">Annulée</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes / Réactions</label>
            <textarea className="form-control" rows={3} value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Notes sur la vaccination, réactions éventuelles..." />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Annuler</button>
            <button type="submit"style={{color:'white'}} className="btn btn-primary">
              {vaccination?.id ? 'Enregistrer' : 'Ajouter la vaccination'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const STATUT_BADGE = {
  complete: { cls: 'badge-success', label: 'Complète' },
  a_venir: { cls: 'badge-info', label: 'À venir' },
  annule: { cls: 'badge-neutral', label: 'Annulée' }
};

export default function Vaccinations({ selectedPatient, setSelectedPatient }) {
  const [vaccinations, setVaccinations] = useState([]);
  const [patients, setPatients] = useState([]);
  const [vaccins, setVaccins] = useState([]);
  const [modal, setModal] = useState(null);
  const [filterPatient, setFilterPatient] = useState(selectedPatient?.id || '');
  const [filterStatut, setFilterStatut] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const params = {};
    if (filterPatient) params.patientId = filterPatient;
    if (filterStatut) params.statut = filterStatut;
    const [v, p, vx] = await Promise.all([
      api.getVaccinations(params),
      api.getPatients(),
      api.getVaccinsDisponibles()
    ]);
    setVaccinations(v);
    setPatients(p);
    setVaccins(vx);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterPatient, filterStatut]);

  useEffect(() => {
    if (selectedPatient) setFilterPatient(selectedPatient.id);
  }, [selectedPatient]);

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer cette vaccination ?')) {
      await api.deleteVaccination(id);
      load();
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Vaccinations</h1>
          <p className="page-subtitle">{vaccinations.length} vaccination(s)</p>
        </div>
        <button className="btn btn-primary" style={{color:'white'}} onClick={() => setModal('create')}>
          + Nouvelle vaccination
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <select
          className="form-control"
          style={{ maxWidth: 240 }}
          value={filterPatient}
          onChange={e => { setFilterPatient(e.target.value); setSelectedPatient(null); }}
        >
          <option value="">Tous les patients</option>
          {patients.map(p => (
            <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
          ))}
        </select>
        <select
          className="form-control"
          style={{ maxWidth: 200 }}
          value={filterStatut}
          onChange={e => setFilterStatut(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          <option value="complete">Complètes</option>
          <option value="a_venir">À venir</option>
          <option value="annule">Annulées</option>
        </select>
        {(filterPatient || filterStatut) && (
          <button className="btn btn-outline btn-sm" onClick={() => { setFilterPatient(''); setFilterStatut(''); setSelectedPatient(null); }}>
            ✕ Effacer filtres
          </button>
        )}
      </div>

      <div className="card">
        <div className="table-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Chargement...</div>
          ) : vaccinations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"></div>
              <div className="empty-title">Aucune vaccination trouvée</div>
              <p>Ajoutez la première vaccination.</p>
            </div>
          ) : (
            <table>
              <colgroup>
                <col style={{ width: '18%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '10%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Vaccin</th>
                  <th>Dose</th>
                  <th>Date admin.</th>
                  <th>Prochaine</th>
                  <th>Centre</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vaccinations.map(v => {
                  const badge = STATUT_BADGE[v.statut] || STATUT_BADGE.complete;
                  return (
                    <tr key={v.id}>
                      <td>
                        <div className="patient-cell">
                          <div className="avatar" style={{ fontSize: 11 }}>
                            {v.patient?.split(' ').map(n => n[0]).join('').slice(0,2)}
                          </div>
                          <span style={{ fontWeight: 500 }}>{v.patient}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{v.vaccin}</div>
                        {v.lotNumero && <div style={{ fontSize: 11, color: '#94a3b8' }}>{v.lotNumero}</div>}
                      </td>
                      <td>{v.dose}</td>
                      <td>{new Date(v.dateAdministration).toLocaleDateString('fr-FR')}</td>
                      <td>
                        {v.dateProchaineDose
                          ? new Date(v.dateProchaineDose).toLocaleDateString('fr-FR')
                          : <span style={{ color: '#94a3b8' }}>—</span>}
                      </td>
                      <td style={{ fontSize: 13, color: '#94a3b8' }}>{v.centre || '—'}</td>
                      <td><span className={`badge ${badge.cls}`}>{badge.label}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="icon-btn icon-btn-edit" style ={{color:'green',border:'none'}}onClick={() => setModal(v)} title="Modifier">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button className="icon-btn icon-btn-delete" style ={{color:'red',border:'none'}}onClick={() => handleDelete(v.id)} title="Supprimer">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <VaccinModal
          vaccination={modal === 'create' ? null : modal}
          patients={patients}
          vaccins={vaccins}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
