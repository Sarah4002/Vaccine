import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import VaccinModal from '../components/VaccinModal';
import { useI18n } from '../i18n';

export default function Vaccinations({ selectedPatient, setSelectedPatient }) {
  const { t, langue } = useI18n();
  const currentYear = String(new Date().getFullYear());
  const [vaccinations, setVaccinations] = useState([]);
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const locale = langue === 'en' ? 'en-GB' : 'fr-FR';

  const load = async () => {
    setLoading(true);
    const hasSearch = search.trim().length > 0;
    const [v, p] = await Promise.all([
      api.getVaccinations(hasSearch ? {} : { year: currentYear }),
      api.getPatients('', hasSearch ? {} : { year: currentYear })
    ]);
    setVaccinations(v);
    setPatients(p);
    setLoading(false);
  };

  useEffect(() => { load(); }, [search, currentYear]);

  const handleDelete = async (id) => {
    if (window.confirm(langue === 'en' ? 'Delete this official record?' : 'Supprimer ce certificat officiel ?')) {
      await api.deleteVaccination(id);
      load();
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const { blob, contentDisposition } = await api.exportPatientsDatabase();
      const match = contentDisposition.match(/filename="?([^"]+)"?/i);
      const downloadName = match?.[1] || `vaccitrack_export_patients_${new Date().toISOString().slice(0, 10)}.xlsx`;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      window.alert(langue === 'en' ? 'Unable to export the database right now.' : "Impossible d'exporter la base de donnees pour le moment.");
    } finally {
      setExporting(false);
    }
  };

  const searchTerm = search.trim().toLowerCase();
  const filteredVaccinations = vaccinations.filter((vaccination) =>
    !searchTerm ||
    vaccination.patient?.toLowerCase().includes(searchTerm) ||
    vaccination.vaccin?.toLowerCase().includes(searchTerm) ||
    vaccination.type?.toLowerCase().includes(searchTerm) ||
    String(vaccination.protocoleData?.grade || '').toLowerCase().includes(searchTerm) ||
    String(vaccination.protocoleData?.schema || '').toLowerCase().includes(searchTerm)
  );

  const getRegisterTypeLabel = (vaccination) => {
    if (vaccination.type === 'rage') return 'Anti-Rabique';
    if (vaccination.type === 'hepb') return langue === 'en' ? 'Hepatitis B' : 'Hepatite B';
    if (vaccination.type === 'dt') return 'DT';
    return vaccination.vaccin;
  };

  const getDetailsLabel = (vaccination) => {
    if (vaccination.type === 'rage') return `Grade: ${vaccination.protocoleData?.grade || '-'}`;
    if (vaccination.type === 'hepb') return `${langue === 'en' ? 'Schedule' : 'Schema'}: ${vaccination.protocoleData?.schema || '-'}`;
    return langue === 'en' ? 'Official form' : 'Formulaire officiel';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontSize: 26, fontWeight: 800, color: '#1d2129', marginBottom: 4 }}>{t('vac_cert_title')}</h1>
          <p style={{ color: '#8a94a6', fontSize: 14 }}>{t('vac_cert_sub')}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{ background: '#ffffff', color: '#0056ff', border: '1px solid #cfe0ff', padding: '12px 24px', borderRadius: '50px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, cursor: exporting ? 'wait' : 'pointer' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3v12"></path>
              <path d="M7 10l5 5 5-5"></path>
              <path d="M5 21h14"></path>
            </svg>
            {exporting ? (langue === 'en' ? 'Exporting...' : 'Export en cours...') : (langue === 'en' ? 'Export .xlsx' : 'Exporter en .xlsx')}
          </button>
          <button onClick={() => setModal('create')} style={{ background: '#0056ff', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '50px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,86,255,0.2)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l-2 2 4 4 2-2-4-4z"></path><path d="M10 4L2 12l2 2-2 2 2 2 2-2 2 2 8-8-8-8z"></path><line x1="14" y1="10" x2="4" y2="20"></line></svg>
            {t('vac_add_reg')}
          </button>
        </div>
      </div>

      <div className="card" style={{ border: 'none', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18 }}>{t('vac_registers')} ({filteredVaccinations.length})</h3>
          <div style={{ position: 'relative', width: '350px' }}>
            <svg style={{ position: 'absolute', left: 16, top: 10, color: '#8a94a6' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              type="text"
              placeholder={t('vac_search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '10px 16px 10px 42px', borderRadius: '50px', border: '1px solid #eaebef', background: '#f4f5f9', outline: 'none', fontSize: 13, width: '100%', color: '#1d2129' }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#8a94a6' }}>{t('dash_loading')}</div>
        ) : filteredVaccinations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8a94a6', background: '#f4f5f9', borderRadius: '12px' }}>
            {langue === 'en' ? 'No records found.' : 'Aucun certificat enregistre.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: '#8a94a6', borderBottom: '1px solid #eaebef' }}>
                  <th style={{ padding: '16px 8px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('vac_date_init')}</th>
                  <th style={{ padding: '16px 8px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('vac_patient_col')}</th>
                  <th style={{ padding: '16px 8px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('vac_reg_type')}</th>
                  <th style={{ padding: '16px 8px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('vac_prof_details')}</th>
                  <th style={{ padding: '16px 8px', textAlign: 'right' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredVaccinations.map((vaccination, index) => (
                  <tr key={vaccination.id} style={{ borderBottom: index < filteredVaccinations.length - 1 ? '1px solid #eaebef' : 'none' }}>
                    <td style={{ padding: '16px 8px', fontWeight: 600, fontSize: 13, color: '#1d2129' }}>
                      {new Date(vaccination.dateAdministration || Date.now()).toLocaleDateString(locale)}
                    </td>
                    <td style={{ padding: '16px 8px', fontWeight: 800, fontSize: 14, color: '#1d2129' }}>
                      {vaccination.patient}
                    </td>
                    <td style={{ padding: '16px 8px' }}>
                      <span style={{ fontWeight: 800, color: '#0056ff', background: '#ebf2ff', padding: '4px 10px', borderRadius: '6px', fontSize: '13px' }}>
                        {getRegisterTypeLabel(vaccination)}
                      </span>
                    </td>
                    <td style={{ padding: '16px 8px', color: '#8a94a6', fontSize: 13 }}>
                      {getDetailsLabel(vaccination)}
                    </td>
                    <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button onClick={() => setModal(vaccination)} style={{ background: '#f4f5f9', border: '1px solid #eaebef', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#8a94a6' }} title={langue === 'en' ? 'View record' : 'Voir le certificat'}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                        <button onClick={() => handleDelete(vaccination.id)} style={{ background: '#fce7f3', border: '1px solid #fbcfe8', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#ec4899' }} title={langue === 'en' ? 'Delete' : 'Supprimer'}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
