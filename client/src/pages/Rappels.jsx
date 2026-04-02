import React, { useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { api } from '../utils/api';

export default function Rappels() {
  const { t } = useI18n();
  const [rappels, setRappels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getRappels().then(r => { setRappels(r); setLoading(false); });
  }, []);

  const enRetard = rappels.filter(r => r.enRetard);
  const urgents = rappels.filter(r => r.urgent && !r.enRetard);
  const prochains = rappels.filter(r => !r.urgent && !r.enRetard);

  const Section = ({ title, items, emptyMsg, theme }) => (
    <div className="card" style={{ marginBottom: 24, padding: 24, border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ background: theme.bg, color: theme.color, width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {theme.icon}
        </div>
        <h3 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: '#1d2129', margin: 0 }}>
          {title} <span style={{ color: theme.color, marginLeft: 8 }}>({items.length})</span>
        </h3>
      </div>

      {items.length === 0 ? (
        <div style={{ color: '#8a94a6', fontSize: 14, padding: '20px 0', borderTop: '1px solid #eaebef' }}>
          {emptyMsg}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: '#8a94a6', borderBottom: '1px solid #eaebef' }}>
                <th style={{ padding: '12px 8px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>{t('rap_col_patient') || 'Patient'}</th>
                <th style={{ padding: '12px 8px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>{t('rap_col_contact') || 'Contact'}</th>
                <th style={{ padding: '12px 8px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>{t('rap_col_vaccin') || 'Vaccin & Dose'}</th>
                <th style={{ padding: '12px 8px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>{t('rap_col_date') || 'Date prévue'}</th>
                <th style={{ padding: '12px 8px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>{t('rap_col_action') || 'Délai & Action'}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: i < items.length-1 ? '1px solid #eaebef' : 'none' }}>
                  
                  <td style={{ padding: '16px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f4f5f9', color: '#1d2129', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 13 }}>
                      {r.patient?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#1d2129' }}>{r.patient}</span>
                  </td>

                  <td style={{ padding: '16px 8px' }}>
                    <div style={{ color: '#1d2129', fontSize: 13, fontWeight: 600 }}>{r.telephone || t('pat_no_phone') || 'Non renseigné'}</div>
                  </td>

                  <td style={{ padding: '16px 8px' }}>
                    <div style={{ fontWeight: 800, color: theme.color, fontSize: 14 }}>{r.vaccin}</div>
                    <div style={{ fontSize: 12, color: '#8a94a6', marginTop: 2 }}>{r.dose}</div>
                  </td>

                  <td style={{ padding: '16px 8px', fontWeight: 600, fontSize: 13, color: '#1d2129' }}>
                    {new Date(r.dateProchaineDose).toLocaleDateString('fr-FR')}
                  </td>

                  <td style={{ padding: '16px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ 
                        background: r.enRetard ? '#fee2e2' : r.joursRestants === 0 ? '#ffedd5' : theme.bg, 
                        color: r.enRetard ? '#ef4444' : r.joursRestants === 0 ? '#f97316' : theme.color, 
                        padding: '4px 10px', borderRadius: '6px', fontSize: 12, fontWeight: 700 
                      }}>
                        {r.enRetard ? `${Math.abs(r.joursRestants)} jours de retard` : r.joursRestants === 0 ? "Aujourd'hui" : `Dans ${r.joursRestants} jours`}
                      </span>
                      
                      {/* Fake action button pour "Convoquer" */}
                      <button style={{ background: 'white', border: '1px solid #eaebef', padding: '6px 12px', borderRadius: '50px', fontSize: 12, fontWeight: 600, color: '#1d2129', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        {t('rap_remind') || 'Relancer'}
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
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontSize: 26, fontWeight: 800, color: '#1d2129', marginBottom: 4 }}>{t('rap_title_main') || 'Alertes & Rappels'}</h1>
          <p style={{ color: '#8a94a6', fontSize: 14 }}>{t('rap_subtitle_main') || 'Planifiez et convoquez les patients pour assurer la couverture vaccinale.'}</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {enRetard.length > 0 && (
            <div style={{ background: '#fee2e2', color: '#ef4444', padding: '8px 16px', borderRadius: '50px', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              {enRetard.length} en retard
            </div>
          )}
          <button style={{ background: 'white', color: '#1d2129', border: '1px solid #eaebef', padding: '10px 20px', borderRadius: '50px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            {t('rap_sort') || 'Trier'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#8a94a6' }}>{t('rap_loading') || 'Recherche des rappels...'}</div>
      ) : rappels.length === 0 ? (
         <div style={{ textAlign: 'center', padding: '80px 20px', color: '#8a94a6', background: 'white', borderRadius: '16px', border: '1px dashed #eaebef' }}>
            <svg style={{ margin: '0 auto 16px auto', color: '#cbd5e1' }} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1d2129', marginBottom: 8, fontFamily: 'Syne' }}>{t('rap_all_good') || 'Tous les patients sont à jour'}</div>
            <p style={{ margin: 0 }}>{t('rap_no_soon') || "Il n'y a aucun rappel planifié dans les 30 prochains jours."}</p>
         </div>
      ) : (
        <>
          {enRetard.length > 0 && (
            <Section
              title={t('rap_sec_late') || "Priorité Absolue : En retard"}
              items={enRetard}
              emptyMsg={t('rap_sec_late_empty') || "Aucune vaccination en retard"}
              theme={{ 
                bg: '#fee2e2', color: '#ef4444', 
                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> 
              }}
            />
          )}

          {urgents.length > 0 && (
            <Section
              title={t('rap_sec_urgent') || "Convocations Urgentes (7 prochains jours)"}
              items={urgents}
              emptyMsg={t('rap_sec_urgent_empty') || "Aucun rappel urgent"}
              theme={{ 
                bg: '#ffedd5', color: '#f97316', 
                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              }}
            />
          )}

          <Section
            title={t('rap_sec_plan') || "À planifier (8 à 30 jours)"}
            items={prochains}
            emptyMsg={t('rap_sec_plan_empty') || "Aucune échéance à moyen terme."}
            theme={{ 
              bg: '#ebf2ff', color: '#0056ff', 
              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            }}
          />
        </>
      )}
    </div>
  );
}
