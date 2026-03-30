import React, { useState, useEffect } from 'react';
import './index.css';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Vaccinations from './pages/Vaccinations';
import Rappels from './pages/Rappels';
import Pharmacy from './pages/Pharmacy';
import MapTlemcen from './pages/MapTlemcen';
import Login from './pages/Login';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // <--- ETAT D'AUTHENTIFICATION

  useEffect(() => {
    // Vérification basique d'une connexion persistante (pour la démo)
    const token = localStorage.getItem('vaccitrack_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('vaccitrack_token');
    localStorage.removeItem('vaccitrack_user');
    setIsAuthenticated(false);
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard setPage={setPage} />;
      case 'patients': return <Patients setPage={setPage} setSelectedPatient={setSelectedPatient} />;
      case 'vaccinations': return <Vaccinations selectedPatient={selectedPatient} setSelectedPatient={setSelectedPatient} />;
      case 'rappels': return <Rappels />;
      case 'pharmacy': return <Pharmacy />;
      case 'map-tlemcen': return <MapTlemcen />;
      default: return <Dashboard setPage={setPage} />;
    }
  };

  // Si non authentifié, on montre SEULEMENT l'écran de Login
  if (!isAuthenticated) {
    return <Login setAuthenticated={setIsAuthenticated} />;
  }

  // Sinon, on montre l'application normale
  return (
    <div className="app-layout">
      {/* On passe handleLogout si vous souhaitez ajouter un bouton de déconnexion dans la Sidebar ultérieurement */}
      <Sidebar page={page} setPage={setPage} />


      <main className="main-content">
        <header style={{ 
          background: 'white', 
          padding: '24px', 
          borderRadius: '20px', 
          marginBottom: '32px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
          border: '1px solid #eaebef',
          position: 'relative'
        }}>
          {/* Branding Central (Comme sur le Login) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <img src="/chu-logo.png" alt="CHU Tlemcen" style={{ height: '75px', width: 'auto', display: 'block', marginBottom: '8px' }} />
            <div style={{ color: '#1d2129', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '12px', letterSpacing: '1.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              Service d'Épidémiologie
            </div>
            <div style={{ fontSize: '10px', color: '#8a94a6', marginTop: '4px', fontWeight: 600 }}>Centre Hospitalo-Universitaire de Tlemcen</div>
          </div>

          {/* Déconnexion déportée à droite */}
          <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
            <button onClick={handleLogout} style={{ 
              background: '#fef2f2', 
              color: '#ef4444', 
              border: '1px solid #fee2e2',
              padding: '8px 16px',
              borderRadius: '50px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Déconnexion
            </button>
          </div>
        </header>
        {renderPage()}
      </main>
    </div>
  );
}
