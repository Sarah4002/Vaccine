import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

export default function Rappels() {
  const [rappels, setRappels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getRappels().then(r => { setRappels(r); setLoading(false); });
  }, []);

  const enRetard = rappels.filter(r => r.enRetard);
  const urgents = rappels.filter(r => r.urgent && !r.enRetard);
  const prochains = rappels.filter(r => !r.urgent && !r.enRetard);

  const Section = ({ title, items, emptyMsg, badgeClass }) => (
    <div className="card" style={{ marginBottom: 20 }}>
      <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>{title}</h3>
      {items.length === 0 ? (
        <div style={{ color: '#94a3b8', fontSize: 14, padding: '12px 0' }}>{emptyMsg}</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Téléphone</th>
              <th>Vaccin</th>
              <th>Dose</th>
              <th>Date rappel</th>
              <th>Délai</th>
            </tr>
          </thead>
          <tbody>
            {items.map(r => (
              <tr key={r.id}>
                <td>
                  <div className="patient-cell">
                    <div className="avatar">{r.patient?.split(' ').map(n => n[0]).join('').slice(0,2)}</div>
                    <span style={{ fontWeight: 500 }}>{r.patient}</span>
                  </div>
                </td>
                <td style={{ color: '#94a3b8', fontSize: 13 }}>{r.telephone || '—'}</td>
                <td>{r.vaccin}</td>
                <td>{r.dose}</td>
                <td>{new Date(r.dateProchaineDose).toLocaleDateString('fr-FR')}</td>
                <td>
                  <span className={`badge ${badgeClass}`}>
                    {r.enRetard
                      ? `${Math.abs(r.joursRestants)}j de retard`
                      : r.joursRestants === 0
                        ? "Aujourd'hui"
                        : `Dans ${r.joursRestants}j`}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Rappels de vaccination</h1>
          <p className="page-subtitle">Suivez les vaccinations à planifier dans les 30 prochains jours</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {enRetard.length > 0 && (
            <span className="badge badge-danger" style={{ fontSize: 14 }}>
              {enRetard.length} en retard
            </span>
          )}
          {urgents.length > 0 && (
            <span className="badge badge-warning" style={{ fontSize: 14 }}>
              {urgents.length} urgents
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Chargement...</div>
      ) : rappels.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon"></div>
            <div className="empty-title">Aucun rappel dans les 30 prochains jours</div>
            <p>Tous vos patients sont à jour dans leurs vaccinations.</p>
          </div>
        </div>
      ) : (
        <>
          {enRetard.length > 0 && (
            <Section
              title="En retard"
              items={enRetard}
              emptyMsg="Aucune vaccination en retard"
              badgeClass="badge-danger"
            />
          )}
          {urgents.length > 0 && (
            <Section
              title="Urgents (dans les 7 jours)"
              items={urgents}
              emptyMsg="Aucun rappel urgent"
              badgeClass="badge-warning"
            />
          )}
          <Section
            title="À venir (8 à 30 jours)"
            items={prochains}
            emptyMsg="Aucun rappel planifié"
            badgeClass="badge-info"
          />
        </>
      )}
    </div>
  );
}
