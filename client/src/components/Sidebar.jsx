import React from 'react';

const NAV = [
  { icon: '', label: 'Tableau de bord', id: 'dashboard' },
  { icon: '', label: 'Patients', id: 'patients' },
  { icon: '', label: 'Vaccinations', id: 'vaccinations' },
  { icon: '', label: 'Rappels', id: 'rappels' },
];

export default function Sidebar({ page, setPage }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">
          <div className="logo-text" style={{fontSize:25}}>Vacci<span>Track</span></div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-label">Navigation</div>
        {NAV.map(item => (
          <button
            key={item.id}
            className={`nav-item ${page === item.id ? 'active' : ''}`}
            onClick={() => setPage(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ fontWeight: 600, marginBottom: 2 }}>VacciTrack v1.0</div>
        <div>Système de suivi vaccinal</div>
      </div>
    </aside>
  );
}
