import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

const cardStyle = {
  background: 'white',
  border: '1px solid #eaebef',
  borderRadius: 16,
  padding: 20,
  boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
};

const metricStyle = {
  fontSize: 28,
  fontWeight: 800,
  color: '#0056ff',
  marginTop: 8,
};

export default function DashboardClean({ setPage }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await api.getStats();
        if (mounted) setStats(data);
      } catch (err) {
        console.error('Erreur dashboard:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const items = [
    { label: 'Patients', value: stats?.totalPatients ?? 0, page: 'patients' },
    { label: 'Vaccinations', value: stats?.totalVaccinations ?? 0, page: 'vaccinations' },
    { label: 'Rappels proches', value: stats?.rappelsProchains ?? 0, page: 'rappels' },
    { label: 'Stocks critiques', value: stats?.stocksCritiques ?? 0, page: 'pharmacy' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={cardStyle}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#8a94a6', textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Tableau de bord
        </div>
        <h1 style={{ margin: '8px 0 6px', fontSize: 28, color: '#1d2129' }}>Vue d'ensemble VacciTrack</h1>
        <p style={{ margin: 0, color: '#8a94a6', fontSize: 14 }}>
          {loading ? 'Chargement des statistiques...' : 'Accedez rapidement aux donnees principales de la plateforme.'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
        {items.map(item => (
          <button
            key={item.label}
            onClick={() => setPage?.(item.page)}
            style={{
              ...cardStyle,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: '#8a94a6', textTransform: 'uppercase' }}>
              {item.label}
            </div>
            <div style={metricStyle}>{item.value}</div>
          </button>
        ))}
      </div>

      <div style={{ ...cardStyle, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>
        <div>
          <div style={{ fontWeight: 800, color: '#1d2129', marginBottom: 10 }}>Resume</div>
          <div style={{ color: '#4b5563', fontSize: 14, lineHeight: 1.6 }}>
            Cette version du dashboard a ete remise proprement pour debloquer la compilation du client.
            Les modules patients, vaccinations, rappels et pharmacie restent accessibles depuis la barre laterale.
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 800, color: '#1d2129', marginBottom: 10 }}>Raccourcis</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => setPage?.('patients')} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #dbe3f0', background: '#f8fbff', cursor: 'pointer' }}>Ouvrir Patients</button>
            <button onClick={() => setPage?.('vaccinations')} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #dbe3f0', background: '#f8fbff', cursor: 'pointer' }}>Ouvrir Vaccinations</button>
            <button onClick={() => setPage?.('map-tlemcen')} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #dbe3f0', background: '#f8fbff', cursor: 'pointer' }}>Ouvrir Carte SIG</button>
          </div>
        </div>
      </div>
    </div>
  );
}
